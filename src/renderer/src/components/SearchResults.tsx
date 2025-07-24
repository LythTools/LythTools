import React from 'react'
import { motion } from 'framer-motion'
import { useSearchStore } from '../stores/searchStore'
import { SearchCategory } from '../types'

const SearchResults: React.FC = () => {
  const { results, selectedIndex, setSelectedIndex, executeSelected } = useSearchStore()

  // 获取类别图标
  const getCategoryIcon = (category: SearchCategory): string => {
    switch (category) {
      case SearchCategory.APPLICATION:
        return '🚀'
      case SearchCategory.FILE:
        return '📄'
      case SearchCategory.FOLDER:
        return '📁'
      case SearchCategory.WEB:
        return '🌐'
      case SearchCategory.COMMAND:
        return '⚡'
      case SearchCategory.CALCULATOR:
        return '🧮'
      case SearchCategory.SYSTEM:
        return '⚙️'
      default:
        return '📋'
    }
  }

  // 获取类别颜色
  const getCategoryColor = (category: SearchCategory): string => {
    switch (category) {
      case SearchCategory.APPLICATION:
        return 'text-blue-600'
      case SearchCategory.FILE:
        return 'text-green-600'
      case SearchCategory.FOLDER:
        return 'text-yellow-600'
      case SearchCategory.WEB:
        return 'text-purple-600'
      case SearchCategory.COMMAND:
        return 'text-red-600'
      case SearchCategory.CALCULATOR:
        return 'text-orange-600'
      case SearchCategory.SYSTEM:
        return 'text-gray-600'
      default:
        return 'text-gray-500'
    }
  }

  // 处理点击事件
  const handleItemClick = (index: number) => {
    setSelectedIndex(index)
    executeSelected()
  }

  // 处理鼠标悬停
  const handleItemHover = (index: number) => {
    setSelectedIndex(index)
  }

  return (
    <div className="py-2">
      {results.map((item, index) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2, delay: index * 0.05 }}
          className={`result-item ${index === selectedIndex ? 'selected' : ''}`}
          onClick={() => handleItemClick(index)}
          onMouseEnter={() => handleItemHover(index)}
        >
          <div className="flex items-center space-x-3">
            {/* 图标 */}
            <div className="flex-shrink-0 text-lg">
              {item.icon || getCategoryIcon(item.category)}
            </div>
            
            {/* 内容 */}
            <div className="flex-1 min-w-0">
              <div className="result-title">
                {item.title}
              </div>
              <div className="result-description">
                {item.description}
              </div>
            </div>
            
            {/* 类别标签 */}
            <div className={`flex-shrink-0 text-xs px-2 py-1 rounded-full bg-gray-100 ${getCategoryColor(item.category)}`}>
              {item.category}
            </div>
            
            {/* 分数（开发模式下显示） */}
            {process.env.NODE_ENV === 'development' && item.score !== undefined && (
              <div className="flex-shrink-0 text-xs text-gray-400 font-mono">
                {item.score.toFixed(3)}
              </div>
            )}
          </div>
        </motion.div>
      ))}
      
      {/* 底部提示 */}
      <div className="px-6 py-2 text-xs text-gray-400 border-t border-gray-100">
        <div className="flex justify-between items-center">
          <span>↑↓ 导航</span>
          <span>Enter 执行</span>
          <span>Esc 取消</span>
        </div>
      </div>
    </div>
  )
}

export default SearchResults
