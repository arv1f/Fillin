import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

{
  const k = 'fillin-hotspot-font'
  try {
    const v = localStorage.getItem(k)
    document.documentElement.dataset.hotspotFont =
      v === 'sm' || v === 'md' || v === 'lg' ? v : 'md'
  } catch {
    document.documentElement.dataset.hotspotFont = 'md'
  }
}

// Без StrictMode: в dev двойной mount ломает WebGL в @egjs/view360.
createRoot(document.getElementById('root')!).render(<App />)
