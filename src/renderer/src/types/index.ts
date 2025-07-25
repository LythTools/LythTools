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
 * Electron API类型
 */
export interface ElectronAPI {
  quit: () => Promise<void>
  hide: () => Promise<void>
  minimize: () => Promise<void>
  resizeWindow: (isMenuOpen: boolean) => Promise<void>
  searchApplications: () => Promise<ApplicationInfo[]>
  searchFiles: (query: string, maxResults?: number) => Promise<FileInfo[]>
  getFileIcon: (path: string) => string | null
  openApplication: (path: string) => Promise<boolean>
  openFile: (path: string) => Promise<boolean>
  platform: string
  onWindowFocus: (callback: () => void) => void
  onWindowBlur: (callback: () => void) => void
  onIconUpdated: (callback: (data: { path: string; icon: string }) => void) => void
  removeAllListeners: (channel: string) => void
}
