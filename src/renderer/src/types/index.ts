/**
 * 搜索结果项接口
 */
export interface SearchResultItem {
  id: string
  title: string
  description: string
  icon?: string
  category: string
  type?: 'application' | 'file' | 'folder' | 'calculator' | 'web' | 'system'
  path?: string
  action: () => void
  score?: number
  preventHide?: boolean // 阻止执行后隐藏窗口
}

/**
 * 搜索类别
 */
export enum SearchCategory {
  APPLICATION = 'application',
  FILE = 'file',
  FOLDER = 'folder',
  WEB = 'web',
  COMMAND = 'command',
  CALCULATOR = 'calculator',
  SYSTEM = 'system',
}

/**
 * 搜索配置
 */
export interface SearchConfig {
  threshold: number // 搜索阈值
  maxResults: number // 最大结果数
  includeScore: boolean // 是否包含分数
  keys: string[] // 搜索字段
}

/**
 * 应用状态
 */
export interface AppState {
  isVisible: boolean
  query: string
  results: SearchResultItem[]
  selectedIndex: number
  isLoading: boolean
}

/**
 * 应用程序信息
 */
export interface ApplicationInfo {
  name: string
  path: string
  icon?: string
  type: 'application'
}

/**
 * 文件信息
 */
export interface FileInfo {
  name: string
  path: string
  type: 'file' | 'folder'
  size?: number
  modified?: Date
}

/**
 * 扩展清单
 */
export interface ExtensionManifest {
  id: string
  name: string
  description: string
  version: string
  author: string
  icon: string
  category: string
  permissions: string[]
  commands: {
    name: string
    description: string
    keywords: string[]
  }[]
  settings: {
    key: string
    name: string
    description: string
    type: 'string' | 'number' | 'boolean' | 'select'
    default: any
    options?: { label: string; value: any }[]
  }[]
  enabled?: boolean  // 扩展是否已启用（运行时添加）
  
  // 可选的扩展属性
  license?: string
  longDescription?: string
  features?: string[]
  tags?: string[]
  homepage?: string
  repository?: string
  changelog?: {
    version: string
    date: string
    changes: string[]
  }[]
}

/**
 * Electron API类型
 */
export interface ElectronAPI {
  quit: () => Promise<void>
  hide: () => Promise<void>
  minimize: () => Promise<void>
  resizeWindow: (options: { isMenuOpen?: boolean; resultCount?: number; installedExtensionCount?: number; targetHeight?: number }) => Promise<void>
  searchApplications: () => Promise<ApplicationInfo[]>
  searchFiles: (query: string, maxResults?: number) => Promise<FileInfo[]>
  getFileIcon: (path: string) => Promise<string | null>
  openApplication: (path: string) => Promise<boolean>
  openFile: (path: string) => Promise<boolean>
  platform: string
  onWindowFocus: (callback: () => void) => void
  onWindowBlur: (callback: () => void) => void
  removeAllListeners: (channel: string) => void
  extensions: {
    getInstalled: () => Promise<ExtensionManifest[]>
    getAvailable: () => Promise<ExtensionManifest[]>
    install: (extensionPath: string) => Promise<{ success: boolean; message: string }>
    uninstall: (extensionId: string) => Promise<{ success: boolean; message: string }>
    enable: (extensionId: string) => Promise<{ success: boolean; message: string }>
    disable: (extensionId: string) => Promise<{ success: boolean; message: string }>
    getInfo: (extensionId: string) => Promise<ExtensionManifest | null>
    selectFolder: () => Promise<{ success: boolean; path?: string; message?: string }>
    replaceFileSearch: (extensionId: string, provider: any) => Promise<{ success: boolean; message: string }>
    restoreFileSearch: (extensionId: string) => Promise<{ success: boolean; message: string }>
  }
}
