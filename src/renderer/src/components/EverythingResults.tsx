import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useSearchStore } from '../stores/searchStore'

// 文件类型过滤器
const FILE_FILTERS = [
  {
    id: 'all',
    name: '全部文件',
    icon: '📄',
    extensions: []
  },
  {
    id: 'documents',
    name: '文档',
    icon: '📝',
    extensions: ['.txt', '.doc', '.docx', '.pdf', '.rtf', '.odt', '.xls', '.xlsx', '.ppt', '.pptx']
  },
  {
    id: 'images',
    name: '图片',
    icon: '🖼️',
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp', '.ico', '.tiff']
  },
  {
    id: 'videos',
    name: '视频',
    icon: '🎬',
    extensions: ['.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv', '.webm', '.m4v', '.3gp']
  },
  {
    id: 'audio',
    name: '音频',
    icon: '🎵',
    extensions: ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.wma', '.m4a', '.opus']
  },
  {
    id: 'archives',
    name: '压缩包',
    icon: '📦',
    extensions: ['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.xz', '.cab']
  },
  {
    id: 'executables',
    name: '程序',
    icon: '⚙️',
    extensions: ['.exe', '.msi', '.app', '.deb', '.dmg', '.pkg', '.run']
  },
  {
    id: 'code',
    name: '代码',
    icon: '💻',
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.html', '.css', '.scss', '.py', '.java', '.cpp', '.c', '.cs', '.php', '.rb', '.go', '.rs']
  },
  {
    id: 'folders',
    name: '文件夹',
    icon: '📁',
    type: 'folder'
  }
]

// 获取文件图标
const getFileIcon = (fileName: string, fileType: string): string => {
  if (fileType === 'folder') return '📁'

  const ext = fileName.toLowerCase().split('.').pop() || ''

  // 文档
  if (['txt', 'doc', 'docx', 'pdf', 'rtf', 'odt'].includes(ext)) return '📄'
  if (['xls', 'xlsx', 'csv'].includes(ext)) return '📊'
  if (['ppt', 'pptx'].includes(ext)) return '📈'
  // 图片
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp', 'ico'].includes(ext)) return '🖼️'
  // 视频
  if (['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm'].includes(ext)) return '🎬'
  // 音频
  if (['mp3', 'wav', 'flac', 'aac', 'ogg', 'wma', 'm4a'].includes(ext)) return '🎵'
  // 压缩包
  if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(ext)) return '📦'
  // 程序
  if (['exe', 'msi', 'app', 'deb', 'dmg'].includes(ext)) return '⚙️'
  // 代码
  if (['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'py', 'java', 'cpp'].includes(ext)) return '💻'

  return '📄'
}

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (!bytes) return '--'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

// 格式化日期
const formatDate = (dateStr: string): string => {
  if (!dateStr) return '--'
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN') + ' ' + date.toLocaleTimeString('zh-CN', { hour12: false })
}

const EverythingResults: React.FC = () => {
  const {
    everythingResults,
    everythingSelectedIndex,
    everythingQuery,
    isEverythingOpen,
    setEverythingSelectedIndex,
    executeEverythingSelected,
    clearEverythingResults,
    setEverythingQuery,
    setEverythingResults
  } = useSearchStore()

  // 本地状态
  const [isSearching, setIsSearching] = useState(false)
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null)
  const [activeFilter, setActiveFilter] = useState('all')
  const [allResults, setAllResults] = useState<any[]>([]) // 存储所有搜索结果

  // 应用过滤器
  const applyFilter = useCallback((results: any[], filterId: string) => {
    let filteredResults = results

    if (filterId !== 'all') {
      const filter = FILE_FILTERS.find(f => f.id === filterId)
      if (filter) {
        if (filter.type === 'folder') {
          filteredResults = results.filter(item => item.type === 'folder')
        } else if (filter.extensions && filter.extensions.length > 0) {
          filteredResults = results.filter(item => {
            const fileName = item.title.toLowerCase()
            return filter.extensions!.some(ext => fileName.endsWith(ext.toLowerCase()))
          })
        }
      }
    }

    // 更新搜索存储中的结果
    setEverythingResults(filteredResults)
  }, [setEverythingResults])

  // 执行搜索
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setAllResults([])
      return
    }

    setIsSearching(true)
    try {
      // 优先使用专用 Everything API，降级到基础文件搜索
      if (window.electronAPI?.searchEverything) {
        console.log('Everything 专用搜索:', query)
        const files = await window.electronAPI.searchEverything(query, 500)

        // 转换为统一格式
        const formattedResults = files.map(file => ({
          id: `file-${file.path}`,
          title: file.name,
          description: file.path,
          type: file.type,
          path: file.path,
          size: file.size || 0,
          modified: file.modified || new Date().toISOString(),
          icon: getFileIcon(file.name, file.type),
          action: async () => {
            try {
              await window.electronAPI.openFile(file.path)
              console.log('打开成功:', file.path)
            } catch (error) {
              console.error('打开失败:', error)
            }
          }
        }))

        setAllResults(formattedResults)
        applyFilter(formattedResults, activeFilter)
        console.log(`找到 ${files.length} 个文件`)
      } else if (window.electronAPI?.searchFiles) {
        console.log('Everything API 不可用，基础搜索:', query)
        const files = await window.electronAPI.searchFiles(query, 500)

        const formattedResults = files.map(file => ({
          id: `file-${file.path}`,
          title: file.name,
          description: file.path,
          type: file.type,
          path: file.path,
          size: file.size || 0,
          modified: file.modified || new Date().toISOString(),
          icon: getFileIcon(file.name, file.type),
          action: async () => {
            try {
              await window.electronAPI.openFile(file.path)
              console.log('打开成功:', file.path)
            } catch (error) {
              console.error('打开失败:', error)
            }
          }
        }))

        setAllResults(formattedResults)
        applyFilter(formattedResults, activeFilter)
        console.log(`找到 ${files.length} 个文件`)
      }
    } catch (error) {
      console.error('搜索失败:', error)
    } finally {
      setIsSearching(false)
    }
  }, [activeFilter, applyFilter])

  // 监听搜索查询变化
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }

    const timeout = setTimeout(() => {
      if (everythingQuery.trim()) {
        performSearch(everythingQuery)
      } else {
        setAllResults([])
        setEverythingResults([])
      }
    }, 300)

    setSearchTimeout(timeout)

    return () => {
      if (timeout) {
        clearTimeout(timeout)
      }
    }
  }, [everythingQuery, performSearch])

  // 清理函数
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout)
      }
    }
  }, [searchTimeout])



  // 如果没有打开Everything搜索，不渲染
  if (!isEverythingOpen) {
    return null
  }

  // 处理点击事件
  const handleItemClick = (index: number) => {
    setEverythingSelectedIndex(index)
    executeEverythingSelected()
  }

  // 处理鼠标悬停
  const handleItemHover = (index: number) => {
    setEverythingSelectedIndex(index)
  }

  // 处理关闭
  const handleClose = () => {
    clearEverythingResults()
  }







  // 处理过滤器点击
  const handleFilterClick = (filterId: string) => {
    setActiveFilter(filterId)
    applyFilter(allResults, filterId)
  }

  // 计算过滤器数量
  const getFilterCount = (filterId: string) => {
    if (filterId === 'all') return allResults.length

    const filter = FILE_FILTERS.find(f => f.id === filterId)
    if (!filter) return 0

    if (filter.type === 'folder') {
      return allResults.filter(item => item.type === 'folder').length
    } else if (filter.extensions && filter.extensions.length > 0) {
      return allResults.filter(item => {
        const fileName = item.title.toLowerCase()
        return filter.extensions!.some(ext => fileName.endsWith(ext.toLowerCase()))
      }).length
    }

    return 0
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="everything-container"
    >
      {/* 顶部状态栏 */}
      <div className="everything-header">
        <div className="everything-status-bar">
          <span className="status-text">Everything 文件搜索</span>
          <div className="status-actions">
            {isSearching && <span className="search-loading">搜索中...</span>}
            <button className="close-btn" onClick={handleClose} title="关闭">
              ✕
            </button>
          </div>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="everything-main">
        {/* 左侧筛选栏 */}
        <div className="everything-sidebar">
          <div className="sidebar-section">
            <h3 className="sidebar-title">文件类型</h3>
            <div className="sidebar-items">
              {FILE_FILTERS.map(filter => (
                <button
                  key={filter.id}
                  className={`sidebar-item ${activeFilter === filter.id ? 'active' : ''}`}
                  onClick={() => handleFilterClick(filter.id)}
                  title={filter.name}
                >
                  <span className="sidebar-icon">{filter.icon}</span>
                  <span className="sidebar-name">{filter.name}</span>
                  <span className="sidebar-count">
                    {getFilterCount(filter.id)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 右侧文件列表 */}
        <div className="everything-content">
          {/* 状态栏 */}
          <div className="content-header">
            <span className="result-count">
              {everythingResults.length} 个对象
              {activeFilter !== 'all' && ` (已筛选)`}
            </span>
            <span className="result-selection">
              {everythingSelectedIndex >= 0 && everythingResults.length > 0 &&
                `${everythingSelectedIndex + 1} / ${everythingResults.length}`
              }
            </span>
          </div>

          {/* 文件列表 */}
          <div className="file-list">
            {everythingResults.length === 0 ? (
              <div className="empty-state">
                {everythingQuery ? (
                  <>
                    <div className="empty-icon">🔍</div>
                    <div className="empty-text">
                      {isSearching ? '正在搜索...' : '未找到匹配的文件'}
                    </div>
                    <div className="empty-hint">
                      {isSearching ? '请稍候' : '尝试使用不同的关键词或调整筛选条件'}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="empty-icon">📁</div>
                    <div className="empty-text">输入关键词搜索全盘文件</div>
                    <div className="empty-hint">支持文件名、路径、扩展名搜索</div>
                  </>
                )}
              </div>
            ) : (
              <>
                {/* 列表头部 */}
                <div className="file-list-header">
                  <div className="header-icon"></div>
                  <div className="header-name">名称</div>
                  <div className="header-path">路径</div>
                  <div className="header-size">大小</div>
                  <div className="header-date">修改时间</div>
                </div>

                {/* 文件项 */}
                {everythingResults.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.1, delay: index * 0.01 }}
                    className={`file-item ${index === everythingSelectedIndex ? 'selected' : ''}`}
                    onClick={() => handleItemClick(index)}
                    onMouseEnter={() => handleItemHover(index)}
                  >
                    <div className="file-icon">
                      {getFileIcon(item.title, item.type || 'file')}
                    </div>
                    <div className="file-name" title={item.title}>
                      {item.title}
                    </div>
                    <div className="file-path" title={item.description}>
                      {item.description}
                    </div>
                    <div className="file-size">
                      {item.type === 'folder' ? '--' : formatFileSize(item.size || Math.random() * 10000000)}
                    </div>
                    <div className="file-date">
                      {formatDate(item.modified || new Date().toISOString())}
                    </div>
                  </motion.div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default EverythingResults
