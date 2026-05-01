import { useEffect, useRef, useState } from 'react';
import { SKILLS, EVOLUTIONS } from '../game/data.js';
import { useGamepadActions } from './useGamepad.js';
import { useT } from '../i18n.js';
import { playSfx } from '../game/audio.js';
import { bus } from '../game/bus.js';

const AUTO_PICK_S = 10;

export default function LevelUpScreen({ lv, choices, skills, onPick, rerollsLeft = 0, banishesLeft = 0 }) {
  const t = useT();
  const [remaining, setRemaining] = useState(AUTO_PICK_S);
  const [selected, setSelected] = useState(0);
  const pickedRef = useRef(false);
  const choicesRef = useRef(choices);
  const selectedRef = useRef(0);
  choicesRef.current = choices;
  selectedRef.current = selected;

  const pick = id => {
    if (pickedRef.current) return;
    pickedRef.current = true;
    onPick(id);
  };

  useEffect(() => {
    pickedRef.current = false;
    setRemaining(AUTO_PICK_S);
    setSelected(0);
    const start = performance.now();
    let rafId;
    const tick = () => {
      const elapsed = (performance.now() - start) / 1000;
      const left = Math.max(0, AUTO_PICK_S - elapsed);
      setRemaining(left);
      if (left <= 0) {
        const id = choicesRef.current[selectedRef.current];
        if (id) pick(id);
        return;
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [choices]);

  const move = delta => {
    const n = choicesRef.current.length;
    if (!n) return;
    setSelected(s => {
      const next = (s + delta + n) % n;
      if (next !== s) playSfx('uimove');
      return next;
    });
  };

  useEffect(() => {
    const onKey = e => {
      const n = choicesRef.current.length;
      if (!n) return;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'q') {
        e.preventDefault();
        move(-1);
      } else if (e.key === 'ArrowRight' || e.key === 'd') {
        e.preventDefault();
        move(1);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const id = choicesRef.current[selectedRef.current];
        if (id) pick(id);
      } else if (e.key >= '1' && e.key <= '9') {
        const idx = parseInt(e.key, 10) - 1;
        if (idx < n) {
          e.preventDefault();
          const id = choicesRef.current[idx];
          if (id) pick(id);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useGamepadActions({
    left: () => move(-1),
    right: () => move(1),
    confirm: () => {
      const id = choicesRef.current[selectedRef.current];
      if (id) pick(id);
    },
  });

  const pct = Math.max(0, Math.min(1, remaining / AUTO_PICK_S));
  const danger = remaining < 3;

  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: 'rgba(3,0,15,.9)',
      backdropFilter: 'blur(8px)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      zIndex: 25, padding: '20px 10px',
    }}>
      <div style={{ fontSize: '0.91em', letterSpacing: 9, color: '#c77dff', marginBottom: 4 }}>{t('levelup.level')} {lv}</div>
      <div style={{
        fontFamily: "'Cinzel Decorative',serif", fontSize: '1.9em',
        color: '#c77dff', textShadow: '0 0 20px #7b2fbe', marginBottom: 14,
      }}>{t('levelup.choose')}</div>

      <div style={{ width: '25em', maxWidth: '90vw', marginBottom: 20 }}>
        <div style={{
          fontSize: '0.82em', letterSpacing: 2, textAlign: 'center', marginBottom: 4,
          color: danger ? '#ff4d6d' : '#9d4edd',
        }}>
          {t('levelup.auto')} · {remaining.toFixed(1)}s
        </div>
        <div style={{ height: 4, background: '#0a0020', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${pct * 100}%`,
            background: danger
              ? 'linear-gradient(90deg,#8b0000,#ff2244)'
              : 'linear-gradient(90deg,#5a189a,#c77dff)',
            transition: 'width .08s linear',
          }}/>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1.1em', flexWrap: 'wrap', justifyContent: 'center' }}>
        {choices.map((id, i) => {
          const isEvo = id.startsWith('evo:');
          const baseId = isEvo ? id.slice(4) : id;
          const evo = isEvo ? EVOLUTIONS[baseId] : null;
          const sk = SKILLS[baseId];
          const cardColor = isEvo ? '#ffd966' : sk.color;
          const cardIcon = isEvo ? evo.icon : sk.icon;
          const cardName = isEvo ? evo.name : t(`skills.${baseId}`);
          const cardDesc = isEvo ? evo.desc : sk.desc[(skills?.[baseId] || 0)];
          const curLv = skills?.[baseId] || 0;
          const nLv = curLv + 1;
          const isSelected = i === selected;
          // Synergy hint: which evolution unlocks if the player picks this skill?
          let synergyHint = null;
          if (!isEvo) {
            const newSkills = { ...(skills || {}), [baseId]: (skills?.[baseId] || 0) + 1 };
            for (const [eId, ev] of Object.entries(EVOLUTIONS)) {
              const wepMax = SKILLS[eId]?.max;
              const passMax = SKILLS[ev.requires]?.max;
              if ((newSkills[eId] || 0) === wepMax && (newSkills[ev.requires] || 0) === passMax) {
                synergyHint = ev.name;
                break;
              }
            }
          }
          return (
            <div
              key={id}
              onClick={() => pick(id)}
              onMouseEnter={() => setSelected(s => { if (s !== i) playSfx('uimove'); return i; })}
              style={{
                width: '14.5em',
                padding: '1.3em 1em',
                background: isEvo
                  ? 'linear-gradient(160deg,rgba(60,40,5,.97),rgba(30,15,0,.97))'
                  : 'linear-gradient(160deg,rgba(22,6,55,.97),rgba(8,0,25,.97))',
                border: `${isEvo ? 2 : 1}px solid ${isSelected ? cardColor : cardColor + '55'}`,
                borderRadius: 8,
                cursor: 'pointer',
                transition: 'transform .18s, box-shadow .18s',
                boxShadow: isSelected
                  ? `0 0 32px ${cardColor}aa`
                  : `0 0 ${isEvo ? 22 : 15}px ${cardColor}30`,
                transform: isSelected ? 'scale(1.06)' : 'scale(1)',
                textAlign: 'center',
                position: 'relative',
              }}
            >
              {isEvo && (
                <div style={{
                  position: 'absolute', top: '-0.9em', left: '50%', transform: 'translateX(-50%)',
                  background: cardColor, color: '#1a0e00',
                  fontSize: '0.78em', letterSpacing: 3, padding: '0.18em 0.9em',
                  borderRadius: 10, fontWeight: 'bold',
                  boxShadow: `0 0 14px ${cardColor}aa`,
                }}>✦ ÉVOLUTION ✦</div>
              )}
              {isSelected && !isEvo && (
                <div style={{
                  position: 'absolute', top: '-0.9em', left: '50%', transform: 'translateX(-50%)',
                  background: cardColor, color: '#030008',
                  fontSize: '0.82em', letterSpacing: 2, padding: '0.18em 0.7em',
                  borderRadius: 10,
                }}>↵</div>
              )}
              <div style={{ fontSize: '2.5em', marginBottom: 7 }}>{cardIcon}</div>
              <div style={{ color: cardColor, fontSize: '1em', letterSpacing: 1, marginBottom: 5 }}>{cardName}</div>
              {!isEvo && (curLv > 0 ? (
                <div style={{ marginBottom: 5 }}>
                  <span style={{ color: `${cardColor}50`, fontSize: '1em' }}>{'●'.repeat(curLv)}</span>
                  <span style={{ color: cardColor, fontSize: '1em' }}>{'○'.repeat(sk.max - curLv)}</span>
                  <span style={{ color: `${cardColor}80`, fontSize: '0.91em' }}> →{nLv}</span>
                </div>
              ) : (
                <div style={{ color: '#6a3a8a', fontSize: '0.82em', letterSpacing: 2, marginBottom: 5 }}>{t('levelup.new')}</div>
              ))}
              {isEvo && (
                <div style={{ color: '#ffd966', fontSize: '0.78em', letterSpacing: 2, marginBottom: 5 }}>
                  ★ ★ ★ ★ ★
                </div>
              )}
              <div style={{ color: '#b89ec4', fontSize: '0.91em', lineHeight: 1.6 }}>{cardDesc}</div>
              {synergyHint && (
                <div style={{
                  marginTop: 8, fontSize: '0.78em', letterSpacing: 1,
                  color: '#ffd966', background: 'rgba(60,40,5,0.55)',
                  border: '1px dashed #ffd96677',
                  borderRadius: 4, padding: '0.25em 0.5em',
                  textAlign: 'center',
                }}>✦ Débloque <strong>{synergyHint}</strong></div>
              )}
              <div style={{
                marginTop: 10, fontSize: '0.82em', letterSpacing: 2,
                color: `${cardColor}aa`,
                border: `1px solid ${cardColor}28`,
                borderRadius: 20, padding: '0.18em 0.7em',
                display: 'inline-block',
              }}>{isEvo ? '✦ MYTHIQUE' : (sk.type === 'weapon' ? t('levelup.weapon') : t('levelup.passive'))}</div>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 18, display: 'flex', gap: '0.6em', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          onClick={() => { if (rerollsLeft > 0) { playSfx('uimove'); bus.emit('skill:reroll'); } }}
          onMouseDown={e => e.preventDefault()}
          tabIndex={-1}
          disabled={rerollsLeft <= 0}
          style={{
            padding: '0.5em 1.1em',
            background: rerollsLeft > 0 ? 'linear-gradient(135deg,#3c096c,#1a0540)' : 'rgba(20,8,30,0.5)',
            border: `1px solid ${rerollsLeft > 0 ? '#9d4edd' : '#3a1d4a'}`,
            color: rerollsLeft > 0 ? '#e0aaff' : '#5a3a7a',
            fontFamily: "'Cinzel',serif", fontSize: '0.91em', letterSpacing: 2,
            cursor: rerollsLeft > 0 ? 'pointer' : 'not-allowed',
            borderRadius: 4,
            opacity: rerollsLeft > 0 ? 1 : 0.5,
          }}
        >🔄 {t('levelup.reroll') || 'Reroll'} ({rerollsLeft})</button>
        <button
          onClick={() => {
            if (banishesLeft > 0) {
              const id = choices?.[selectedRef.current];
              if (id) { playSfx('uipick'); bus.emit('skill:banish', id); }
            }
          }}
          onMouseDown={e => e.preventDefault()}
          tabIndex={-1}
          disabled={banishesLeft <= 0}
          style={{
            padding: '0.5em 1.1em',
            background: banishesLeft > 0 ? 'linear-gradient(135deg,#5a0a0a,#2a0410)' : 'rgba(30,8,8,0.5)',
            border: `1px solid ${banishesLeft > 0 ? '#ff4d6d' : '#4a1d2a'}`,
            color: banishesLeft > 0 ? '#ffaabb' : '#7a3a4a',
            fontFamily: "'Cinzel',serif", fontSize: '0.91em', letterSpacing: 2,
            cursor: banishesLeft > 0 ? 'pointer' : 'not-allowed',
            borderRadius: 4,
            opacity: banishesLeft > 0 ? 1 : 0.5,
          }}
        >🚫 {t('levelup.banish') || 'Bannir'} ({banishesLeft})</button>
      </div>
      <div style={{ marginTop: 14, color: '#b69ad8', fontSize: '0.82em', letterSpacing: 2 }}>
        {t('levelup.hint')}
      </div>
    </div>
  );
}
