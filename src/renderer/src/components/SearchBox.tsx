import React, { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSearchStore } from '../stores/searchStore'
import { useTray } from '../hooks/useTray'
import SearchResults from './SearchResults'
import EverythingResults from './EverythingResults'
import MenuView from './MenuView'

const SearchBox: React.FC = () => {
  const inputRef = useRef<HTMLInputElement>(null)
  const {
    query,
    results,
    isLoading,
    isMenuOpen,
    isEverythingOpen,
    everythingQuery,
    setQuery,
    setMenuOpen,
    setEverythingQuery,
    executeSelected,
    executeEverythingSelected,
    navigateUp,
    navigateDown,
    navigateEverythingUp,
    navigateEverythingDown,
    clearResults,
    clearEverythingResults
  } = useSearchStore()

  // 托盘功能
  const { showSuccessNotification, updateTrayIcon } = useTray()

  // 自动聚焦输入框
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
    // 更新托盘图标为活跃状态
    updateTrayIcon(true)
  }, [updateTrayIcon])

  // 处理键盘事件
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    // 如果Everything搜索打开，优先处理Everything的键盘事件
    if (isEverythingOpen) {
      switch (event.key) {
        case 'Enter':
          event.preventDefault()
          executeEverythingSelected()
          break
        case 'ArrowUp':
          event.preventDefault()
          navigateEverythingUp()
          break
        case 'ArrowDown':
          event.preventDefault()
          navigateEverythingDown()
          break
        case 'Escape':
          event.preventDefault()
          clearEverythingResults()
          break
      }
      return
    }

    // 普通搜索的键盘事件
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
        if (isMenuOpen) {
          // 如果菜单打开，关闭菜单
          setMenuOpen(false)
        } else if (query) {
          // 如果有查询内容，清空结果
          clearResults()
        } else {
          // 否则隐藏窗口
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

    // 如果Everything搜索打开，设置everythingQuery
    if (isEverythingOpen) {
      setEverythingQuery(newQuery)
    } else {
      setQuery(newQuery)
    }

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
      {/* 主搜索框 - 整个区域可拖动 */}
      <div className="search-box">
        <div className="flex items-center">
          {/* Logo */}
          <div className="flex-shrink-0 pl-3 pr-2">
            <div
              className="w-6 h-6 cursor-pointer hover:opacity-80 transition-opacity duration-200 app-logo"
              onClick={handleLogoClick}
            >
              <svg width="24" height="24" viewBox="0 0 233 233" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M126.208 19.4166L29.125 135.917H116.5L106.792 213.583L203.875 97.0833H116.5L126.208 19.4166Z" fill="#8C7AD7"/>
              <path opacity="0.3" d="M129.287 42.6219L59.6708 119.342H111.054L106.2 177.592L169.304 109.633H120.762L129.287 42.6219Z" fill="#E7E2FF"/>
              <path d="M126.208 25.5258C130.498 25.5258 133.975 22.0485 133.975 17.7591C133.975 13.4697 130.498 9.99243 126.208 9.99243C121.919 9.99243 118.442 13.4697 118.442 17.7591C118.442 22.0485 121.919 25.5258 126.208 25.5258Z" fill="white"/>
              <path d="M107.218 220.119C111.507 220.119 114.985 216.641 114.985 212.352C114.985 208.063 111.507 204.585 107.218 204.585C102.928 204.585 99.4512 208.063 99.4512 212.352C99.4512 216.641 102.928 220.119 107.218 220.119Z" fill="white"/>
              <path opacity="0.8" d="M30.309 141.742C33.5261 141.742 36.134 139.134 36.134 135.917C36.134 132.7 33.5261 130.092 30.309 130.092C27.0919 130.092 24.484 132.7 24.484 135.917C24.484 139.134 27.0919 141.742 30.309 141.742Z" fill="white"/>
              <path opacity="0.8" d="M202.691 102.908C205.908 102.908 208.516 100.3 208.516 97.0833C208.516 93.8662 205.908 91.2583 202.691 91.2583C199.474 91.2583 196.866 93.8662 196.866 97.0833C196.866 100.3 199.474 102.908 202.691 102.908Z" fill="white"/>
              <rect x="107.976" y="102.293" width="17.0488" height="28.4146" fill="#D9D9D9"/>
              </svg>


            </div>
          </div>

          {/* 搜索输入框 */}
          <input
            ref={inputRef}
            type="text"
            value={isEverythingOpen ? everythingQuery : query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={isEverythingOpen ? "Everything 搜索全盘文件..." : "搜索应用、文件或执行计算..."}
            className="search-input-with-logo text-select"
            autoComplete="off"
            spellCheck={false}
          />

          {/* 右侧提示标签和加载指示器 */}
          <div className="flex-shrink-0 pr-3 flex items-center space-x-2">
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
        {results.length > 0 && !isMenuOpen && !isEverythingOpen && (
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

      {/* Everything搜索结果 */}
      <AnimatePresence>
        {isEverythingOpen && (
          <EverythingResults />
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
