import React, { useEffect } from 'react'
import SearchBox from './components/SearchBox'
import { useSearchStore } from './stores/searchStore'
import { useSettingsStore } from './stores/settingsStore'

const App: React.FC = () => {
  const { initializeSearch, isMenuOpen, setMenuOpen, results, isEverythingOpen, installedExtensionCount } = useSearchStore()
  const { initializeTheme, incrementLaunchCount } = useSettingsStore()

  useEffect(() => {
    // 初始化搜索功能
    initializeSearch()

    // 初始化主题
    initializeTheme()

    // 增加启动次数
    incrementLaunchCount()

    // 监听窗口事件
    const handleKeyDown = (event: KeyboardEvent) => {
      // ESC键处理
      if (event.key === 'Escape') {
        if (isMenuOpen) {
          // 如果菜单打开，关闭菜单
          setMenuOpen(false)
        } else {
          // 如果菜单关闭，隐藏窗口
          window.electronAPI?.hide()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [initializeSearch, isMenuOpen, setMenuOpen])

  // 监听菜单状态和搜索结果变化，动态调整窗口大小
  useEffect(() => {
    if (window.electronAPI?.resizeWindow) {
      // 传递详细的状态信息给主进程，让其动态计算窗口高度
      window.electronAPI.resizeWindow({
        isMenuOpen: isMenuOpen,
        resultCount: results.length,
        isEverythingOpen: isEverythingOpen,
        installedExtensionCount: installedExtensionCount
      })
    }
  }, [isMenuOpen, results.length, isEverythingOpen, installedExtensionCount])

  return (
    <div className="search-container">
      <div className="w-full">
        <SearchBox />
      </div>
    </div>
  )
}

export default App
