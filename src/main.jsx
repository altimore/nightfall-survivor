import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import NightfallSurvivor from './Nightfall.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <NightfallSurvivor />
  </StrictMode>
);
