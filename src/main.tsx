import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Prevent disabled Vite HMR WebSocket connection close noise from triggering unhandled rejection overlays
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const msg = event?.reason?.message || String(event?.reason || '');
    if (msg.includes('WebSocket closed without opened')) {
      event.preventDefault();
    }
  });
}

createRoot(document.getElementById('root')!).render(<App />);
