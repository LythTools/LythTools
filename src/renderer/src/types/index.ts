/**
 * 搜索结果项接口
 */
export interface SearchResultItem {
  id: string
  title: string
  description: string
  icon?: string
  category: string
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
 * Electron API类型
 */
export interface ElectronAPI {
  quit: () => Promise<void>
  hide: () => Promise<void>
  minimize: () => Promise<void>
  platform: string
  onWindowFocus: (callback: () => void) => void
  onWindowBlur: (callback: () => void) => void
  removeAllListeners: (channel: string) => void
}
