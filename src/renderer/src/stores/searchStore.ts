import { create } from 'zustand'
import Fuse from 'fuse.js'
import { SearchResultItem, SearchConfig, SearchCategory, ApplicationInfo, FileInfo } from '../types'

interface SearchState {
  query: string
  results: SearchResultItem[]
  selectedIndex: number
  isLoading: boolean
  fuse: Fuse<SearchResultItem> | null
  isMenuOpen: boolean
  applications: ApplicationInfo[]

  // Actions
  setQuery: (query: string) => void
  setResults: (results: SearchResultItem[]) => void
  setSelectedIndex: (index: number) => void
  setLoading: (loading: boolean) => void
  setMenuOpen: (open: boolean) => void
  search: (query: string) => void
  executeSelected: () => void
  navigateUp: () => void
  navigateDown: () => void
  clearResults: () => void
  initializeSearch: () => void
  loadApplications: () => Promise<void>
}

// 默认搜索配置
const defaultConfig: SearchConfig = {
  threshold: 0.3,
  maxResults: 10,
  includeScore: true,
  keys: ['title', 'description', 'category']
}

// 模拟搜索数据（实际项目中可以从文件系统、应用列表等获取）
const mockSearchData: SearchResultItem[] = [
  {
    id: '1',
    title: '计算器',
    description: '打开系统计算器',
    category: SearchCategory.APPLICATION,
    action: () => {
      console.log('打开计算器')
      // 这里可以调用系统API打开计算器
    }
  },
  {
    id: '2',
    title: '记事本',
    description: '打开记事本应用',
    category: SearchCategory.APPLICATION,
    action: () => {
      console.log('打开记事本')
    }
  },
  {
    id: '3',
    title: '文件资源管理器',
    description: '打开文件管理器',
    category: SearchCategory.APPLICATION,
    action: () => {
      console.log('打开文件管理器')
    }
  },
  {
    id: '4',
    title: '设置',
    description: '打开系统设置',
    category: SearchCategory.SYSTEM,
    action: () => {
      console.log('打开系统设置')
    }
  },
  {
    id: '5',
    title: '控制面板',
    description: '打开控制面板',
    category: SearchCategory.SYSTEM,
    action: () => {
      console.log('打开控制面板')
    }
  },
  {
    id: 'calc',
    title: '计算',
    description: '执行数学计算',
    category: SearchCategory.CALCULATOR,
    action: () => {
      console.log('执行计算')
    }
  }
]

export const useSearchStore = create<SearchState>((set, get) => ({
  query: '',
  results: [],
  selectedIndex: 0,
  isLoading: false,
  fuse: null,
  isMenuOpen: false,
  applications: [],

  setQuery: (query: string) => {
    set({ query })
    get().search(query)
  },

  setResults: (results: SearchResultItem[]) => {
    set({ results, selectedIndex: 0 })
  },

  setSelectedIndex: (index: number) => {
    const { results } = get()
    if (index >= 0 && index < results.length) {
      set({ selectedIndex: index })
    }
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading })
  },

  setMenuOpen: (open: boolean) => {
    set({ isMenuOpen: open })
    // 不再调整窗口大小，使用固定窗口
  },

  search: async (query: string) => {
    const { applications } = get()

    if (!query.trim()) {
      set({ results: [], selectedIndex: 0 })
      return
    }

    set({ isLoading: true })

    try {
      const results: SearchResultItem[] = []

      // 1. 计算器功能 - 优先级最高
      if (/^[\d+\-*/().\s]+$/.test(query)) {
        try {
          const result = Function('"use strict"; return (' + query + ')')()
          if (typeof result === 'number' && !isNaN(result)) {
            results.push({
              id: 'calculator',
              title: `${query} = ${result}`,
              description: '计算结果 - 点击复制',
              category: SearchCategory.CALCULATOR,
              type: 'calculator',
              icon: '🧮',
              action: () => {
                navigator.clipboard.writeText(result.toString())
                window.electronAPI.hide()
              }
            })
          }
        } catch (e) {
          // 忽略计算错误
        }
      }

      // 2. 搜索应用程序
      const appResults = applications
        .filter(app => app.name.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 5)
        .map(app => ({
          id: `app-${app.path}`,
          title: app.name,
          description: `应用程序`,
          category: SearchCategory.APPLICATION,
          type: 'application' as const,
          path: app.path,
          icon: '🚀',
          action: async () => {
            const success = await window.electronAPI.openApplication(app.path)
            if (success) {
              window.electronAPI.hide()
            }
          }
        }))

      results.push(...appResults)

      // 3. 搜索文件
      if (window.electronAPI.searchFiles) {
        const files = await window.electronAPI.searchFiles(query, 8)
        const fileResults = files.map(file => ({
          id: `file-${file.path}`,
          title: file.name,
          description: `${file.type === 'folder' ? '文件夹' : '文件'}`,
          category: file.type === 'folder' ? SearchCategory.FOLDER : SearchCategory.FILE,
          type: file.type,
          path: file.path,
          icon: file.type === 'folder' ? '📁' : '📄',
          action: async () => {
            const success = await window.electronAPI.openFile(file.path)
            if (success) {
              window.electronAPI.hide()
            }
          }
        }))

        results.push(...fileResults)
      }

      // 4. 网络搜索建议
      if (results.length < 3) {
        results.push({
          id: 'web-search',
          title: `在网络上搜索 "${query}"`,
          description: '使用默认浏览器搜索',
          category: SearchCategory.WEB,
          type: 'web',
          icon: '🌐',
          action: () => {
            const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`
            window.electronAPI.openFile(searchUrl)
            window.electronAPI.hide()
          }
        })
      }

      set({ results: results.slice(0, 8), selectedIndex: 0, isLoading: false })
    } catch (error) {
      console.error('搜索出错:', error)
      set({ results: [], selectedIndex: 0, isLoading: false })
    }
  },

  executeSelected: () => {
    const { results, selectedIndex } = get()
    const selectedItem = results[selectedIndex]

    if (selectedItem) {
      selectedItem.action()
      // 执行后隐藏窗口
      window.electronAPI?.hide()
    }
  },

  navigateUp: () => {
    const { selectedIndex, results } = get()
    if (results.length > 0) {
      const newIndex = selectedIndex > 0 ? selectedIndex - 1 : results.length - 1
      set({ selectedIndex: newIndex })
    }
  },

  navigateDown: () => {
    const { selectedIndex, results } = get()
    if (results.length > 0) {
      const newIndex = selectedIndex < results.length - 1 ? selectedIndex + 1 : 0
      set({ selectedIndex: newIndex })
    }
  },

  clearResults: () => {
    set({ results: [], selectedIndex: 0, query: '' })
  },

  initializeSearch: async () => {
    // 加载应用程序列表
    await get().loadApplications()
    console.log('搜索功能已初始化')
  },

  loadApplications: async () => {
    try {
      if (window.electronAPI.searchApplications) {
        const apps = await window.electronAPI.searchApplications()
        set({ applications: apps })
        console.log(`已加载 ${apps.length} 个应用程序`)
      }
    } catch (error) {
      console.error('加载应用程序失败:', error)
    }
  }
}))
