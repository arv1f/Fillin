import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Без StrictMode: в dev двойной mount ломает WebGL в @egjs/view360.
createRoot(document.getElementById('root')!).render(<App />)
