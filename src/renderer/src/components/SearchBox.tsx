import React, { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSearchStore } from '../stores/searchStore'
import SearchResults from './SearchResults'
import MenuView from './MenuView'

const SearchBox: React.FC = () => {
  const inputRef = useRef<HTMLInputElement>(null)
  const {
    query,
    results,
    isLoading,
    isMenuOpen,
    setQuery,
    setMenuOpen,
    executeSelected,
    navigateUp,
    navigateDown,
    clearResults
  } = useSearchStore()

  // 自动聚焦输入框
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  // 处理键盘事件
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    switch (event.key) {
      case 'Enter':
        event.preventDefault()
        executeSelected()
        break
      case 'ArrowUp':
        event.preventDefault()
        navigateUp()
        break
      case 'ArrowDown':
        event.preventDefault()
        navigateDown()
        break
      case 'Escape':
        event.preventDefault()
        if (query) {
          clearResults()
        } else {
          window.electronAPI?.hide()
        }
        break
      default:
        break
    }
  }

  // 处理输入变化
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = event.target.value
    setQuery(newQuery)

    // 如果用户开始输入，自动关闭设置菜单
    if (newQuery.length > 0 && isMenuOpen) {
      setMenuOpen(false)
    }
  }

  // 处理logo点击
  const handleLogoClick = () => {
    setMenuOpen(!isMenuOpen)
  }

  return (
    <div className="relative">
      {/* 主搜索框 */}
      <div className="search-box">
        <div className="relative flex items-center">
          {/* Logo */}
          <div className="flex-shrink-0 pl-4 pr-2">
            <div
              className="w-6 h-6 cursor-pointer hover:opacity-80 transition-opacity duration-200"
              onClick={handleLogoClick}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <defs>
                  <linearGradient id="modern-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#667eea" />
                    <stop offset="100%" stopColor="#764ba2" />
                  </linearGradient>
                </defs>
                {/* 主体闪电 */}
                <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" fill="url(#modern-gradient)" />
                {/* 内部装饰闪电 */}
                <path d="M13 4L6 12H11L10.5 18L17 11H12L13 4Z" fill="white" opacity="0.3" />
                {/* 中心装饰线 */}
                <rect x="11" y="10" width="2" height="4" fill="white" />
                {/* 装饰点 */}
                <circle cx="13" cy="3" r="0.8" fill="white" />
                <circle cx="11" cy="21" r="0.8" fill="white" />
                <circle cx="4" cy="14" r="0.6" fill="white" opacity="0.8" />
                <circle cx="20" cy="10" r="0.6" fill="white" opacity="0.8" />
              </svg>
            </div>
          </div>

          {/* 搜索输入框 */}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="搜索应用、文件或执行计算..."
            className="search-input-with-logo text-select"
            autoComplete="off"
            spellCheck={false}
          />

          {/* 右侧提示标签和加载指示器 */}
          <div className="flex-shrink-0 pr-4 flex items-center space-x-2">
            {/* 加载指示器 */}
            {isLoading && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"
              />
            )}

            {/* Alt+Space 提示标签 */}
            {!isLoading && !query && (
              <div className="shortcut-hint">
                <span className="shortcut-key">Alt</span>
                <span className="shortcut-plus">+</span>
                <span className="shortcut-key">Space</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 搜索结果 */}
      <AnimatePresence>
        {results.length > 0 && !isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="results-container"
          >
            <SearchResults />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 设置菜单 */}
      <AnimatePresence>
        {isMenuOpen && (
          <MenuView />
        )}
      </AnimatePresence>
    </div>
  )
}

export default SearchBox
