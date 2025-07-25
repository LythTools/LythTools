import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// 类型声明
interface ApplicationInfo {
  name: string
  path: string
  icon?: string
  type: 'application'
}

interface FileInfo {
  name: string
  path: string
  type: 'file' | 'folder'
  size?: number
  modified?: Date
}

declare global {
  interface Window {
    electronAPI: {
      quit: () => Promise<void>
      hide: () => Promise<void>
      minimize: () => Promise<void>
      resizeWindow: (isMenuOpen: boolean) => Promise<void>
      searchApplications: () => Promise<ApplicationInfo[]>
      searchFiles: (query: string, maxResults?: number) => Promise<FileInfo[]>
      getAppIcon: (path: string) => Promise<string | null>
      openApplication: (path: string) => Promise<boolean>
      openFile: (path: string) => Promise<boolean>
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
