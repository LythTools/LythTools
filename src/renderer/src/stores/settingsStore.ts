import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// 设置接口定义
interface SearchSettings {
  maxResults: number
  fuzzySearch: boolean
  searchHistory: boolean
}

interface AppearanceSettings {
  theme: 'auto' | 'light' | 'dark'
  transparency: number
  animations: boolean
}

interface StartupSettings {
  autoStart: boolean
  runInBackground: boolean
}

interface UserInfo {
  name: string
  email: string
  avatar: string
}

interface UsageStats {
  launchCount: number
  totalUsageTime: number // 分钟
  searchCount: number
  installedPlugins: number
}

interface SearchHistory {
  query: string
  timestamp: Date
  resultCount: number
}

interface HotkeySettings {
  globalToggle: string
  quickCalculator: string
  fileSearch: string
}

interface SettingsState {
  // 设置数据
  searchSettings: SearchSettings
  appearanceSettings: AppearanceSettings
  startupSettings: StartupSettings
  userInfo: UserInfo
  usageStats: UsageStats
  hotkeySettings: HotkeySettings

  // 云同步相关
  syncEnabled: boolean
  lastSyncTime: Date | null

  // 搜索历史
  searchHistory: SearchHistory[]

  // Actions
  updateSearchSettings: (settings: Partial<SearchSettings>) => void
  updateAppearanceSettings: (settings: Partial<AppearanceSettings>) => void
  updateStartupSettings: (settings: Partial<StartupSettings>) => void
  updateUserInfo: (info: Partial<UserInfo>) => void
  updateUsageStats: (stats: Partial<UsageStats>) => void
  updateHotkeySettings: (hotkeys: Partial<HotkeySettings>) => void

  // 功能方法
  incrementLaunchCount: () => void
  incrementSearchCount: () => void
  addUsageTime: (minutes: number) => void
  addSearchHistory: (query: string, resultCount: number) => void
  clearSearchHistory: () => void
  syncToCloud: () => Promise<void>
  exportSettings: () => Promise<void>
  resetSettings: () => void
  openDataDirectory: () => Promise<void>
  initializeTheme: () => void
}

// 默认设置
const defaultSettings = {
  searchSettings: {
    maxResults: 8,
    fuzzySearch: true,
    searchHistory: true
  },
  appearanceSettings: {
    theme: 'auto' as const,
    transparency: 95,
    animations: true
  },
  startupSettings: {
    autoStart: true,
    runInBackground: true
  },
  userInfo: {
    name: 'LythTools 用户',
    email: 'user@lythtools.cn',
    avatar: '👤'
  },
  usageStats: {
    launchCount: 1247,
    totalUsageTime: 2520, // 42小时
    searchCount: 8934,
    installedPlugins: 12
  },
  hotkeySettings: {
    globalToggle: 'Alt+Space',
    quickCalculator: 'Ctrl+=',
    fileSearch: 'Ctrl+F'
  },
  syncEnabled: true,
  lastSyncTime: new Date(Date.now() - 2 * 60 * 1000), // 2分钟前
  searchHistory: []
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      ...defaultSettings,

      updateSearchSettings: (settings) => {
        set((state) => ({
          searchSettings: { ...state.searchSettings, ...settings }
        }))
      },

      updateAppearanceSettings: (settings) => {
        set((state) => ({
          appearanceSettings: { ...state.appearanceSettings, ...settings }
        }))

        // 应用主题变化
        const { theme, transparency } = { ...get().appearanceSettings, ...settings }

        // 应用主题到DOM
        if (settings.theme !== undefined) {
          const root = document.documentElement
          if (theme === 'dark') {
            root.classList.add('dark')
            root.classList.remove('light')
          } else if (theme === 'light') {
            root.classList.add('light')
            root.classList.remove('dark')
          } else {
            // 跟随系统
            root.classList.remove('dark', 'light')
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
            root.classList.add(prefersDark ? 'dark' : 'light')
          }
        }

        // 应用透明度
        if (settings.transparency !== undefined) {
          const opacityValue = (transparency / 100).toString()
          document.documentElement.style.setProperty('--window-opacity', opacityValue)

          // 更新动态背景颜色
          const root = document.documentElement
          const isDark = root.classList.contains('dark')

          if (isDark) {
            root.style.setProperty('--bg-primary', `rgba(var(--bg-primary-rgb), ${opacityValue})`)
            root.style.setProperty('--bg-secondary', `rgba(var(--bg-secondary-rgb), ${transparency * 0.8 / 100})`)
          } else {
            root.style.setProperty('--bg-primary', `rgba(var(--bg-primary-rgb), ${opacityValue})`)
            root.style.setProperty('--bg-secondary', `rgba(var(--bg-secondary-rgb), ${transparency * 0.8 / 100})`)
          }
        }

        // 应用动画设置
        if (settings.animations !== undefined) {
          if (settings.animations) {
            document.documentElement.classList.remove('animations-disabled')
          } else {
            document.documentElement.classList.add('animations-disabled')
          }
        }

        // 调用 Electron API
        if (window.electronAPI?.setTheme) {
          window.electronAPI.setTheme(theme)
        }
        if (window.electronAPI?.setTransparency && settings.transparency !== undefined) {
          window.electronAPI.setTransparency(transparency / 100)
        }
      },

      updateStartupSettings: (settings) => {
        set((state) => ({
          startupSettings: { ...state.startupSettings, ...settings }
        }))

        // 应用开机启动设置
        if (settings.autoStart !== undefined && window.electronAPI?.setAutoStart) {
          window.electronAPI.setAutoStart(settings.autoStart)
        }
      },

      updateUserInfo: (info) => {
        set((state) => ({
          userInfo: { ...state.userInfo, ...info }
        }))
      },

      updateUsageStats: (stats) => {
        set((state) => ({
          usageStats: { ...state.usageStats, ...stats }
        }))
      },

      updateHotkeySettings: (hotkeys) => {
        set((state) => ({
          hotkeySettings: { ...state.hotkeySettings, ...hotkeys }
        }))

        // 更新全局快捷键
        if (window.electronAPI?.updateHotkeys) {
          window.electronAPI.updateHotkeys(get().hotkeySettings)
        }
      },

      incrementLaunchCount: () => {
        set((state) => ({
          usageStats: {
            ...state.usageStats,
            launchCount: state.usageStats.launchCount + 1
          }
        }))
      },

      incrementSearchCount: () => {
        set((state) => ({
          usageStats: {
            ...state.usageStats,
            searchCount: state.usageStats.searchCount + 1
          }
        }))
      },

      addUsageTime: (minutes) => {
        set((state) => ({
          usageStats: {
            ...state.usageStats,
            totalUsageTime: state.usageStats.totalUsageTime + minutes
          }
        }))
      },

      addSearchHistory: (query, resultCount) => {
        const { searchSettings } = get()
        if (!searchSettings.searchHistory) return

        set((state) => {
          const newHistory = [
            {
              query,
              timestamp: new Date(),
              resultCount
            },
            ...state.searchHistory.filter(item => item.query !== query) // 去重
          ].slice(0, 50) // 最多保存50条历史

          return {
            searchHistory: newHistory
          }
        })
      },

      clearSearchHistory: () => {
        set({ searchHistory: [] })
      },

      syncToCloud: async () => {
        try {
          // 模拟云同步
          await new Promise(resolve => setTimeout(resolve, 1000))
          set({ lastSyncTime: new Date() })

          if (window.electronAPI?.showNotification) {
            window.electronAPI.showNotification('设置已同步到云端')
          }
        } catch (error) {
          console.error('云同步失败:', error)
          if (window.electronAPI?.showNotification) {
            window.electronAPI.showNotification('云同步失败，请稍后重试')
          }
        }
      },

      exportSettings: async () => {
        try {
          const settings = get()
          const exportData = {
            searchSettings: settings.searchSettings,
            appearanceSettings: settings.appearanceSettings,
            startupSettings: settings.startupSettings,
            userInfo: settings.userInfo,
            hotkeySettings: settings.hotkeySettings,
            exportTime: new Date().toISOString()
          }

          if (window.electronAPI?.exportSettings) {
            await window.electronAPI.exportSettings(exportData)
            window.electronAPI.showNotification('设置已导出成功')
          }
        } catch (error) {
          console.error('导出设置失败:', error)
          if (window.electronAPI?.showNotification) {
            window.electronAPI.showNotification('导出设置失败')
          }
        }
      },

      resetSettings: () => {
        set(defaultSettings)
        if (window.electronAPI?.showNotification) {
          window.electronAPI.showNotification('设置已重置为默认值')
        }
      },

      openDataDirectory: async () => {
        try {
          if (window.electronAPI?.openDataDirectory) {
            await window.electronAPI.openDataDirectory()
          }
        } catch (error) {
          console.error('打开数据目录失败:', error)
        }
      },

      // 初始化主题
      initializeTheme: () => {
        const { appearanceSettings } = get()
        const root = document.documentElement

        if (appearanceSettings.theme === 'dark') {
          root.classList.add('dark')
          root.classList.remove('light')
        } else if (appearanceSettings.theme === 'light') {
          root.classList.add('light')
          root.classList.remove('dark')
        } else {
          // 跟随系统
          root.classList.remove('dark', 'light')
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
          root.classList.add(prefersDark ? 'dark' : 'light')
        }

        // 应用透明度
        const opacityValue = (appearanceSettings.transparency / 100).toString()
        document.documentElement.style.setProperty('--window-opacity', opacityValue)

        // 更新动态背景颜色
        const isDark = root.classList.contains('dark')
        if (isDark) {
          root.style.setProperty('--bg-primary', `rgba(var(--bg-primary-rgb), ${opacityValue})`)
          root.style.setProperty('--bg-secondary', `rgba(var(--bg-secondary-rgb), ${appearanceSettings.transparency * 0.8 / 100})`)
        } else {
          root.style.setProperty('--bg-primary', `rgba(var(--bg-primary-rgb), ${opacityValue})`)
          root.style.setProperty('--bg-secondary', `rgba(var(--bg-secondary-rgb), ${appearanceSettings.transparency * 0.8 / 100})`)
        }

        // 应用动画设置
        if (appearanceSettings.animations) {
          document.documentElement.classList.remove('animations-disabled')
        } else {
          document.documentElement.classList.add('animations-disabled')
        }
      }
    }),
    {
      name: 'lythtools-settings',
      // 只持久化设置数据，不持久化方法
      partialize: (state) => ({
        searchSettings: state.searchSettings,
        appearanceSettings: state.appearanceSettings,
        startupSettings: state.startupSettings,
        userInfo: state.userInfo,
        usageStats: state.usageStats,
        hotkeySettings: state.hotkeySettings,
        syncEnabled: state.syncEnabled,
        lastSyncTime: state.lastSyncTime,
        searchHistory: state.searchHistory
      }),
      // 自定义序列化和反序列化来处理日期
      serialize: (state) => {
        return JSON.stringify({
          ...state,
          lastSyncTime: state.lastSyncTime ? state.lastSyncTime.toISOString() : null,
          searchHistory: state.searchHistory?.map(item => ({
            ...item,
            timestamp: item.timestamp.toISOString()
          })) || []
        })
      },
      deserialize: (str) => {
        const parsed = JSON.parse(str)
        return {
          ...parsed,
          lastSyncTime: parsed.lastSyncTime ? new Date(parsed.lastSyncTime) : null,
          searchHistory: parsed.searchHistory?.map((item: any) => ({
            ...item,
            timestamp: new Date(item.timestamp)
          })) || []
        }
      }
    }
  )
)
