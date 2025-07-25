import { contextBridge, ipcRenderer } from 'electron'

/**
 * 暴露给渲染进程的API
 */
const electronAPI = {
  // 应用控制
  quit: () => ipcRenderer.invoke('app-quit'),
  hide: () => ipcRenderer.invoke('window-hide'),
  minimize: () => ipcRenderer.invoke('window-minimize'),
  resizeWindow: (isMenuOpen: boolean) => ipcRenderer.invoke('window-resize', isMenuOpen),

  // 系统搜索
  searchApplications: () => ipcRenderer.invoke('search-applications'),
  searchFiles: (query: string, maxResults?: number) => ipcRenderer.invoke('search-files', query, maxResults),
  getFileIcon: (path: string) => {
    try {
      const result = ipcRenderer.sendSync('sync-message', { type: 'getFileIcon', path })
      return result.success ? result.data : null
    } catch (error) {
      console.error('同步获取图标失败:', error)
      return null
    }
  },
  openApplication: (path: string) => ipcRenderer.invoke('open-application', path),
  openFile: (path: string) => ipcRenderer.invoke('open-file', path),

  // 系统信息
  platform: process.platform,

  // 事件监听
  onWindowFocus: (callback: () => void) => {
    ipcRenderer.on('window-focus', callback)
  },

  onWindowBlur: (callback: () => void) => {
    ipcRenderer.on('window-blur', callback)
  },

  onIconUpdated: (callback: (data: { path: string; icon: string }) => void) => {
    ipcRenderer.on('icon-updated', (_, data) => callback(data))
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
