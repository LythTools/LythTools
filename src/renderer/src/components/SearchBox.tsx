import React, { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSearchStore } from '../stores/searchStore'
import SearchResults from './SearchResults'

const SearchBox: React.FC = () => {
  const inputRef = useRef<HTMLInputElement>(null)
  const {
    query,
    results,
    isLoading,
    setQuery,
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
    setQuery(event.target.value)
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className="relative"
    >
      {/* 主搜索框 */}
      <div className="search-box">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="搜索应用、文件或执行计算..."
            className="search-input text-select"
            autoComplete="off"
            spellCheck={false}
          />
          
          {/* 加载指示器 */}
          {isLoading && (
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full"
              />
            </div>
          )}
        </div>
      </div>

      {/* 搜索结果 */}
      <AnimatePresence>
        {results.length > 0 && (
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
    </motion.div>
  )
}

export default SearchBox
