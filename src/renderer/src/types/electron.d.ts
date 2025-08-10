// Electron API 类型扩展
interface SystemInfo {
  cpu: {
    usage: number
    model: string
    cores: number
  }
  memory: {
    used: number
    total: number
    usage: number
  }
  disk: {
    used: number
    total: number
    usage: number
  }
  network: {
    isConnected: boolean
    downloadSpeed: number
    uploadSpeed: number
  }
}

interface HotkeySettings {
  globalToggle: string
  quickCalculator: string
  fileSearch: string
}

declare global {
  interface Window {
    electronAPI: {
      // 现有的 API
      hide: () => void
      show: () => void
      resizeWindow: (options: { 
        isMenuOpen?: boolean
        resultCount?: number
        targetHeight?: number
        installedExtensionCount?: number
      }) => void
      openApplication: (path: string) => Promise<boolean>
      openFile: (path: string) => Promise<boolean>
      searchFiles: (query: string, limit: number) => Promise<any[]>
      searchApplications: () => Promise<any[]>

      // 设置相关 API
      setTheme: (theme: 'auto' | 'light' | 'dark') => void
      setTransparency: (opacity: number) => void
      setAutoStart: (enabled: boolean) => void
      updateHotkeys: (hotkeys: HotkeySettings) => void
      showNotification: (message: string) => void
      exportSettings: (settings: any) => Promise<void>
      openDataDirectory: () => Promise<void>

      // 系统监控相关 API - 预留（未实现）
      // getSystemInfo: () => Promise<SystemInfo>
      // cleanSystem: () => Promise<boolean>

      // 托盘相关 API
      trayShowNotification: (title: string, body: string) => Promise<void>
      trayUpdateIcon: (isActive: boolean) => Promise<void>

      // 扩展管理 API
      extensions: {
        getInstalled: () => Promise<any[]>
        getAvailable: () => Promise<any[]>
        install: (extensionPath: string) => Promise<{ success: boolean; message: string }>
        uninstall: (extensionId: string) => Promise<{ success: boolean; message: string }>
        enable: (extensionId: string) => Promise<{ success: boolean; message: string }>
        disable: (extensionId: string) => Promise<{ success: boolean; message: string }>
        getInfo: (extensionId: string) => Promise<any | null>
        selectFolder: () => Promise<{ success: boolean; path?: string; message?: string }>
        replaceFileSearch: (extensionId: string, provider: any) => Promise<{ success: boolean; message: string }>
        restoreFileSearch: (extensionId: string) => Promise<{ success: boolean; message: string }>
        getContributions: () => Promise<Record<string, any>>
        executeCommand: (extensionId: string, command: string, args?: any) => Promise<boolean>
        openWindow: (extensionId: string, windowId: string) => Promise<boolean>
      }
    }
  }
}

export { }
