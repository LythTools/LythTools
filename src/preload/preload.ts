import { contextBridge, ipcRenderer } from 'electron'

/**
 * 暴露给渲染进程的API
 */
const electronAPI = {
  // 应用控制
  quit: () => ipcRenderer.invoke('app-quit'),
  hide: () => ipcRenderer.invoke('window-hide'),
  minimize: () => ipcRenderer.invoke('window-minimize'),
  
  // 系统信息
  platform: process.platform,
  
  // 事件监听
  onWindowFocus: (callback: () => void) => {
    ipcRenderer.on('window-focus', callback)
  },
  
  onWindowBlur: (callback: () => void) => {
    ipcRenderer.on('window-blur', callback)
  },
  
  // 移除事件监听
  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel)
  }
}

// 将API暴露给渲染进程
contextBridge.exposeInMainWorld('electronAPI', electronAPI)

// 类型声明（用于TypeScript）
export type ElectronAPI = typeof electronAPI
