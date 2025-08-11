import { create } from 'zustand'
import { SearchResultItem, SearchCategory, ApplicationInfo } from '../types'
import { useSettingsStore } from './settingsStore'
import { isCalculatorQuery, safeEvaluate } from '../../../shared/utils/searchUtils'
import { SEARCH_CONFIG } from '../../../shared/constants/appConstants'
import { searchApplicationsWithPinyin } from '../../../shared/utils/pinyinUtils'

// 使用设置中的 maxResults 配置，避免无用的顶层常量

interface SearchState {
  query: string
  results: SearchResultItem[]
  selectedIndex: number
  isLoading: boolean
  isMenuOpen: boolean
  applications: ApplicationInfo[]
  installedExtensionCount: number

  // Actions
  setQuery: (query: string) => void
  setResults: (results: SearchResultItem[]) => void
  setSelectedIndex: (index: number) => void
  setLoading: (loading: boolean) => void
  setMenuOpen: (open: boolean) => void
  setInstalledExtensionCount: (count: number) => void
  search: (query: string) => void
  executeSelected: () => void
  navigateUp: () => void
  navigateDown: () => void
  clearResults: () => void
  initializeSearch: () => void
  loadApplications: () => Promise<void>
}

// 保持结果来源一致（主进程）

export const useSearchStore = create<SearchState>((set, get) => ({
  query: '',
  results: [],
  selectedIndex: 0,
  isLoading: false,
  isMenuOpen: false,
  applications: [],
  installedExtensionCount: 0,


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
    console.log(`设置菜单状态: ${open}`)
    set({ isMenuOpen: open })
    // 窗口大小调整由App.tsx中的useEffect处理，避免重复调用
  },

  setInstalledExtensionCount: (count: number) => {
    console.log(`设置已安装插件数量: ${count}`)
    set({ installedExtensionCount: count })
  },



  search: async (query: string) => {
    const { applications } = get()

    // 获取设置中的搜索配置
    const settings = useSettingsStore.getState().searchSettings
    const maxResults = settings.maxResults || 8

    if (!query.trim()) {
      set({ results: [], selectedIndex: 0 })
      return
    }

    set({ isLoading: true })

    try {
      const results: SearchResultItem[] = []

      // 1. 计算器功能 - 优先级最高
      if (isCalculatorQuery(query)) {
        const result = safeEvaluate(query)
        if (result !== null) {
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
              // 增加搜索计数
              useSettingsStore.getState().incrementSearchCount()
            }
          })
        }
      }

      // 2. 搜索应用程序 - 使用拼音增强搜索
      let appResults: ApplicationInfo[] = []

      if (settings.fuzzySearch) {
        // 使用拼音增强的智能搜索
        const pinyinResults = searchApplicationsWithPinyin(
          applications,
          query,
          {
            maxResults: 5,
            threshold: SEARCH_CONFIG.PINYIN_THRESHOLD_FUZZY
          }
        )
        appResults = pinyinResults.map(result => result.item)
        
        console.log(`拼音搜索结果: ${pinyinResults.length}个，查询: "${query}"`)
      } else {
        // 传统的精确匹配 + 拼音匹配作为补充
        const exactMatches = applications
          .filter(app => app.name.toLowerCase().includes(query.toLowerCase()))
          .slice(0, 3)
          
        // 如果精确匹配结果不足，用拼音匹配补充
        if (exactMatches.length < 5) {
          const pinyinResults = searchApplicationsWithPinyin(
            applications,
            query,
            {
              maxResults: 5 - exactMatches.length,
              threshold: SEARCH_CONFIG.PINYIN_THRESHOLD_EXACT
            }
          )
          
          // 去重 - 避免精确匹配和拼音匹配重复
          const exactPaths = new Set(exactMatches.map(app => app.path))
          const uniquePinyinResults = pinyinResults
            .map(result => result.item)
            .filter(app => !exactPaths.has(app.path))
            
          appResults = [...exactMatches, ...uniquePinyinResults].slice(0, 5)
        } else {
          appResults = exactMatches
        }
      }

      const mappedAppResults = appResults.map(app => ({
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
            // 增加搜索计数
            useSettingsStore.getState().incrementSearchCount()
          }
        }
      }))

      results.push(...mappedAppResults)

      // 3. 搜索文件
      if (window.electronAPI.searchFiles) {
        const files = await window.electronAPI.searchFiles(query, Math.max(maxResults - results.length, 3))
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
              // 增加搜索计数
              useSettingsStore.getState().incrementSearchCount()
            }
          }
        }))

        results.push(...fileResults)
      }

      // 5. 网络搜索建议
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
            // 增加搜索计数
            useSettingsStore.getState().incrementSearchCount()
          }
        })
      }

      // 保存搜索历史（如果启用）
      if (settings.searchHistory && results.length > 0) {
        useSettingsStore.getState().addSearchHistory(query, results.length)
      }

      set({ results: results.slice(0, maxResults), selectedIndex: 0, isLoading: false })
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
      // 只有在没有preventHide标记时才隐藏窗口
      if (!selectedItem.preventHide) {
        window.electronAPI?.hide()
      }
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
