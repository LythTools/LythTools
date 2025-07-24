import { create } from 'zustand'
import Fuse from 'fuse.js'
import { SearchResultItem, SearchConfig, SearchCategory } from '../types'

interface SearchState {
  query: string
  results: SearchResultItem[]
  selectedIndex: number
  isLoading: boolean
  fuse: Fuse<SearchResultItem> | null
  
  // Actions
  setQuery: (query: string) => void
  setResults: (results: SearchResultItem[]) => void
  setSelectedIndex: (index: number) => void
  setLoading: (loading: boolean) => void
  search: (query: string) => void
  executeSelected: () => void
  navigateUp: () => void
  navigateDown: () => void
  clearResults: () => void
  initializeSearch: () => void
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

  search: (query: string) => {
    const { fuse } = get()
    
    if (!query.trim()) {
      set({ results: [], selectedIndex: 0 })
      return
    }

    if (!fuse) {
      console.warn('Fuse实例未初始化')
      return
    }

    set({ isLoading: true })

    // 模拟异步搜索
    setTimeout(() => {
      try {
        // 检查是否为数学表达式
        if (/^[\d+\-*/().\s]+$/.test(query)) {
          try {
            const result = eval(query)
            const calcResult: SearchResultItem = {
              id: `calc-${Date.now()}`,
              title: `${query} = ${result}`,
              description: '数学计算结果',
              category: SearchCategory.CALCULATOR,
              action: () => {
                navigator.clipboard?.writeText(result.toString())
                console.log('计算结果已复制到剪贴板')
              }
            }
            set({ results: [calcResult], selectedIndex: 0, isLoading: false })
            return
          } catch {
            // 如果不是有效的数学表达式，继续正常搜索
          }
        }

        const searchResults = fuse.search(query, { limit: defaultConfig.maxResults })
        const results = searchResults.map(result => ({
          ...result.item,
          score: result.score
        }))

        set({ results, selectedIndex: 0, isLoading: false })
      } catch (error) {
        console.error('搜索出错:', error)
        set({ results: [], selectedIndex: 0, isLoading: false })
      }
    }, 100) // 添加轻微延迟以提供更好的用户体验
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

  initializeSearch: () => {
    const fuse = new Fuse(mockSearchData, {
      ...defaultConfig,
      keys: defaultConfig.keys
    })
    set({ fuse })
  }
}))
