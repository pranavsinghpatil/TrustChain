// Suppress Chrome extension message channel errors
window.addEventListener('unhandledrejection', (event) => {
  const msg = event.reason?.message;
  if (msg && msg.includes('message channel closed before a response was received')) {
    event.preventDefault();
  }
});

import { Buffer } from 'buffer';
;(window as any).Buffer = Buffer;

import { createRoot } from 'react-dom/client'
import App from './App'
import { Web3Provider } from '@/contexts/Web3Context';
import './index.css'

createRoot(document.getElementById("root")!).render(
  <Web3Provider>
    <App />
  </Web3Provider>
);
