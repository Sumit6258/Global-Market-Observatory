import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'

let saved: string | null = null
try { saved = localStorage.getItem('theme') } catch { /* storage unavailable */ }
document.documentElement.dataset.theme = saved ?? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
createRoot(document.getElementById('root')!).render(<App />)
