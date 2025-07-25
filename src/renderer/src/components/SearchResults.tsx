import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useSearchStore } from '../stores/searchStore'
import { SearchCategory } from '../types'

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
    if (item.type === 'application' && item.path && window.electronAPI.getFileIcon) {
      console.log('前端：同步获取图标，路径:', item.path)

      try {
        // 同步获取图标
        const icon = window.electronAPI.getFileIcon(item.path)

        if (icon) {
          console.log('前端：同步获取图标成功，数据长度:', icon.length)
          setIconSrc(icon)
          setIconError(false)
        } else {
          console.log('前端：同步获取图标失败，使用降级方案')
          setIconError(true)
        }
      } catch (error) {
        console.error('前端：同步获取图标异常:', error)
        setIconError(true)
      }
    }

    // 监听图标更新事件（异步获取的真实图标）
    const handleIconUpdate = (data: { path: string; icon: string }) => {
      if (data.path === item.path) {
        console.log('前端：收到图标更新事件')
        setIconSrc(data.icon)
        setIconError(false)
      }
    }

    if (window.electronAPI.onIconUpdated) {
      window.electronAPI.onIconUpdated(handleIconUpdate)
    }

    return () => {
      // 清理事件监听器
      if (window.electronAPI.removeAllListeners) {
        window.electronAPI.removeAllListeners('icon-updated')
      }
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
  const getAppIcon = (item: any) => {
    if (item.type === 'application') {
      const appName = item.title.toLowerCase()

      // 常见应用程序的图标映射
      const iconMap: { [key: string]: string } = {
        'notepad': '📝',
        'calculator': '🧮',
        'chrome': '🌐',
        'firefox': '🦊',
        'edge': '🌐',
        'word': '📄',
        'excel': '📊',
        'powerpoint': '📊',
        'outlook': '📧',
        'vscode': '💻',
        'visual studio': '💻',
        'photoshop': '🎨',
        'steam': '🎮',
        'discord': '💬',
        'spotify': '🎵',
        'vlc': '🎬',
        'winrar': '📦',
        '7zip': '📦',
        'git': '📂'
      }

      // 查找匹配的图标
      for (const [key, icon] of Object.entries(iconMap)) {
        if (appName.includes(key)) {
          return icon
        }
      }

      // 默认应用程序图标
      return '🚀'
    }
    return item.icon || getCategoryIcon(item.category)
  }

  return <span>{getAppIcon(item)}</span>
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

  // 获取应用程序图标
  const getAppIcon = (item: any) => {
    if (item.type === 'application') {
      // 根据应用程序名称返回对应的图标
      const appName = item.title.toLowerCase()

      // 常见应用程序的图标映射
      const iconMap: { [key: string]: string } = {
        'notepad': '📝',
        'calculator': '🧮',
        'chrome': '🌐',
        'firefox': '🦊',
        'edge': '🌐',
        'word': '📄',
        'excel': '📊',
        'powerpoint': '📊',
        'outlook': '📧',
        'vscode': '💻',
        'visual studio': '💻',
        'photoshop': '🎨',
        'steam': '🎮',
        'discord': '💬',
        'spotify': '🎵',
        'vlc': '🎬',
        'winrar': '📦',
        '7zip': '📦',
        'git': '📂'
      }

      // 查找匹配的图标
      for (const [key, icon] of Object.entries(iconMap)) {
        if (appName.includes(key)) {
          return icon
        }
      }

      // 默认应用程序图标
      return '🚀'
    }
    return item.icon || getCategoryIcon(item.category)
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
