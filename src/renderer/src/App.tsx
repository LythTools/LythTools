import React, { useEffect } from 'react'
import SearchBox from './components/SearchBox'
import { useSearchStore } from './stores/searchStore'

const App: React.FC = () => {
  const { initializeSearch, isMenuOpen, setMenuOpen } = useSearchStore()

  useEffect(() => {
    // 初始化搜索功能
    initializeSearch()

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

  return (
    <div className="search-container">
      <div className="w-full max-w-2xl mx-auto px-4">
        <SearchBox />
      </div>
    </div>
  )
}

export default App
