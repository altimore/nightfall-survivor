import { useEffect, useRef } from 'react';

// Edge-detected gamepad navigation hook.
// `handlers` is a partial map of action -> () => void.
// Available actions: left, right, up, down, confirm, back, pause, inventory, menuY.
// Standard mapping (Xbox/PS-style): A=0, B=1, X=2, Y=3, Select/Back=8, Start=9,
// dpad up=12 down=13 left=14 right=15.
// Stick deadzone 0.5.
export function useGamepadActions(handlers) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    let raf;
    const prev = {};
    const tick = () => {
      const pads = navigator.getGamepads ? navigator.getGamepads() : [];
      for (const pad of pads) {
        if (!pad) continue;
        const id = pad.index;
        const ax = pad.axes || [];
        const bt = pad.buttons || [];
        const state = {
          left: bt[14]?.pressed || (ax[0] ?? 0) < -0.5,
          right: bt[15]?.pressed || (ax[0] ?? 0) > 0.5,
          up: bt[12]?.pressed || (ax[1] ?? 0) < -0.5,
          down: bt[13]?.pressed || (ax[1] ?? 0) > 0.5,
          confirm: bt[0]?.pressed,
          back: bt[1]?.pressed,
          menuX: bt[2]?.pressed,
          menuY: bt[3]?.pressed,
          inventory: bt[8]?.pressed,
          pause: bt[9]?.pressed,
        };
        if (!prev[id]) prev[id] = {};
        for (const k in state) {
          if (state[k] && !prev[id][k]) handlersRef.current[k]?.();
          prev[id][k] = state[k];
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
}
