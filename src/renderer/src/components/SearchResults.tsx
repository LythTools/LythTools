import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useSearchStore } from '../stores/searchStore'
import { SearchCategory } from '../types'
import { getAppIcon, getFileIcon } from '../../../shared/utils/iconUtils'

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
    case SearchCategory.CALCULATOR:
      return '🧮'
    case SearchCategory.SYSTEM:
      return '⚙️'
    default:
      return '📄'
  }
}

// 应用程序图标组件
const AppIcon: React.FC<{ item: any }> = ({ item }) => {
  const [iconSrc, setIconSrc] = useState<string | null>(null)
  const [iconError, setIconError] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (item.type === 'application' && item.path && window.electronAPI.getFileIcon) {
        try {
          const icon = await window.electronAPI.getFileIcon(item.path)
          if (!cancelled && icon) {
            setIconSrc(icon)
            setIconError(false)
          } else if (!cancelled) {
            setIconError(true)
          }
        } catch (error) {
          if (!cancelled) setIconError(true)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [item.path, item.type])

  // 如果是应用程序且有图标，显示真实图标
  if (item.type === 'application' && iconSrc && !iconError) {
    return (
      <img
        src={iconSrc}
        alt={item.title}
        onError={() => {
          console.log('前端：图标加载失败，切换到降级方案')
          setIconError(true)
        }}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          borderRadius: '0.25rem'
        }}
      />
    )
  }

  // 降级到emoji图标
  const getFallbackIcon = (item: any) => {
    if (item.type === 'application') {
      return getAppIcon(item.title)
    } else if (item.type === 'file' || item.type === 'folder') {
      return getFileIcon(item.title, item.type)
    }
    return item.icon || getCategoryIcon(item.category)
  }

  return <span>{getFallbackIcon(item)}</span>
}

const SearchResults: React.FC = () => {
  const { results, selectedIndex, setSelectedIndex, executeSelected } = useSearchStore()



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
    <div className="results-grid">
      {results.map((item, index) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2, delay: index * 0.03 }}
          className={`result-item ${index === selectedIndex ? 'selected' : ''}`}
          onClick={() => handleItemClick(index)}
          onMouseEnter={() => handleItemHover(index)}
        >
          {/* 图标 */}
          <div className="result-icon">
            <AppIcon item={item} />
          </div>

          {/* 内容 */}
          <div className="result-content">
            <div className="result-title">
              {item.title}
            </div>
            <div className="result-description">
              {item.description}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

export default SearchResults
