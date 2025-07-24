import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// 类型声明
declare global {
  interface Window {
    electronAPI: {
      quit: () => Promise<void>
      hide: () => Promise<void>
      minimize: () => Promise<void>
      platform: string
      onWindowFocus: (callback: () => void) => void
      onWindowBlur: (callback: () => void) => void
      removeAllListeners: (channel: string) => void
    }
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
