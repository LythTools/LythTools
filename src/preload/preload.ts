import { contextBridge, ipcRenderer } from 'electron'

/**
 * 暴露给渲染进程的API
 */
const electronAPI = {
  // 应用控制
  quit: () => ipcRenderer.invoke('app-quit'),
  hide: () => ipcRenderer.invoke('window-hide'),
  minimize: () => ipcRenderer.invoke('window-minimize'),
  resizeWindow: (options: { 
    isMenuOpen?: boolean
    resultCount?: number
    isEverythingOpen?: boolean
    targetHeight?: number
    installedExtensionCount?: number
  }) => ipcRenderer.invoke('window-resize', options),

  // 系统搜索
  searchApplications: () => ipcRenderer.invoke('search-applications'),
  searchFiles: (query: string, maxResults?: number) => ipcRenderer.invoke('search-files', query, maxResults),
  searchEverything: (query: string, maxResults?: number) => ipcRenderer.invoke('search-everything', query, maxResults),
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

  // 通知事件监听
  onNotification: (callback: (data: { title: string; body: string }) => void) => {
    ipcRenderer.on('show-notification', (_, data) => {
      console.log('预加载: 收到通知事件:', data)
      // 使用系统通知
      new Notification(data.title, {
        body: data.body
      })
      callback(data)
    })
  },

  // 移除事件监听
  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel)
  },

  // 通知
  showNotification: (message: string) => {
    console.log('预加载: 显示通知:', message)
    return ipcRenderer.invoke('showNotification', message)
  },

  // 设置相关 API
  setTheme: (theme: 'auto' | 'light' | 'dark') => ipcRenderer.invoke('set-theme', theme),
  setTransparency: (opacity: number) => ipcRenderer.invoke('set-transparency', opacity),
  setAutoStart: (enabled: boolean) => ipcRenderer.invoke('set-auto-start', enabled),
  updateHotkeys: (hotkeys: any) => ipcRenderer.invoke('update-hotkeys', hotkeys),
  exportSettings: (settings: any) => ipcRenderer.invoke('export-settings', settings),
  openDataDirectory: () => ipcRenderer.invoke('open-data-directory'),
  setEverythingPath: (path: string) => ipcRenderer.invoke('set-everything-path', path),



  // 托盘相关API
  trayShowNotification: (title: string, body: string) => {
    return ipcRenderer.invoke('tray-show-notification', title, body)
  },

  trayUpdateIcon: (isActive: boolean) => {
    return ipcRenderer.invoke('tray-update-icon', isActive)
  },

  // 扩展管理API
  extensions: {
    getInstalled: () => ipcRenderer.invoke('extensions-get-installed'),
    getAvailable: () => ipcRenderer.invoke('extensions-get-available'),
    install: (extensionPath: string) => ipcRenderer.invoke('extensions-install', extensionPath),
    uninstall: (extensionId: string) => ipcRenderer.invoke('extensions-uninstall', extensionId),
    enable: (extensionId: string) => ipcRenderer.invoke('extensions-enable', extensionId),
    disable: (extensionId: string) => ipcRenderer.invoke('extensions-disable', extensionId),
    getInfo: (extensionId: string) => ipcRenderer.invoke('extensions-get-info', extensionId),
    selectFolder: () => ipcRenderer.invoke('extensions-select-folder'),
    replaceFileSearch: (extensionId: string, provider: any) => ipcRenderer.invoke('extensions-replace-file-search', extensionId, provider),
    restoreFileSearch: (extensionId: string) => ipcRenderer.invoke('extensions-restore-file-search', extensionId)
  }
}

// 将API暴露给渲染进程
contextBridge.exposeInMainWorld('electronAPI', electronAPI)

// 类型声明（用于TypeScript）
export type ElectronAPI = typeof electronAPI
