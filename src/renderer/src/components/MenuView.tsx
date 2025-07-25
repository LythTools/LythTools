import React, { useState } from 'react'
import { motion } from 'framer-motion'

interface MenuViewProps { }

// 插件数据类型定义
interface Plugin {
  id: string
  name: string
  description: string
  version: string
  author: string
  icon: string
  installed: boolean
  enabled: boolean
  category: 'productivity' | 'system' | 'entertainment' | 'development'
  downloads: number
  rating: number
}

// 模拟插件数据
const mockPlugins: Plugin[] = [
  {
    id: 'calculator-plus',
    name: '高级计算器',
    description: '支持科学计算、单位转换和历史记录的强大计算器插件',
    version: '2.1.0',
    author: 'LythTools Team',
    icon: '🧮',
    installed: true,
    enabled: true,
    category: 'productivity',
    downloads: 15420,
    rating: 4.8
  },
  {
    id: 'weather-widget',
    name: '天气小组件',
    description: '实时天气信息显示，支持多城市和天气预报',
    version: '1.5.2',
    author: 'WeatherDev',
    icon: '🌤️',
    installed: true,
    enabled: false,
    category: 'productivity',
    downloads: 8930,
    rating: 4.5
  },
  {
    id: 'system-monitor',
    name: '系统监控',
    description: '实时显示CPU、内存、磁盘使用情况',
    version: '3.0.1',
    author: 'SysTools',
    icon: '📊',
    installed: false,
    enabled: false,
    category: 'system',
    downloads: 12350,
    rating: 4.7
  },
  {
    id: 'color-picker',
    name: '颜色选择器',
    description: '屏幕取色工具，支持多种颜色格式',
    version: '1.2.0',
    author: 'ColorStudio',
    icon: '🎨',
    installed: false,
    enabled: false,
    category: 'development',
    downloads: 6780,
    rating: 4.6
  },
  {
    id: 'clipboard-manager',
    name: '剪贴板管理器',
    description: '智能剪贴板历史记录和快速粘贴',
    version: '2.3.1',
    author: 'ClipboardPro',
    icon: '📋',
    installed: true,
    enabled: true,
    category: 'productivity',
    downloads: 23450,
    rating: 4.9
  },
  {
    id: 'music-player',
    name: '音乐播放器',
    description: '轻量级音乐播放器，支持多种音频格式',
    version: '1.8.0',
    author: 'MusicBox',
    icon: '🎵',
    installed: false,
    enabled: false,
    category: 'entertainment',
    downloads: 9870,
    rating: 4.4
  }
]

const MenuView: React.FC<MenuViewProps> = () => {
  const [activeTab, setActiveTab] = useState<'plugins' | 'profile' | 'settings' | 'tools'>('plugins')
  const [pluginSubTab, setPluginSubTab] = useState<'installed' | 'store'>('installed')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // 过滤插件
  const filteredPlugins = mockPlugins.filter(plugin => {
    const matchesTab = pluginSubTab === 'installed' ? plugin.installed : true
    const matchesCategory = selectedCategory === 'all' || plugin.category === selectedCategory
    const matchesSearch = plugin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plugin.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesTab && matchesCategory && matchesSearch
  })

  // 切换插件启用状态
  const togglePlugin = (pluginId: string) => {
    // 这里应该调用实际的插件管理API
    console.log('切换插件状态:', pluginId)
  }

  // 安装/卸载插件
  const handleInstall = (pluginId: string) => {
    // 这里应该调用实际的插件安装API
    console.log('安装插件:', pluginId)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="inline-menu-container"
    >
      <div className="plugin-menu-content">

        {/* 主标签页导航 */}
        <div className="main-tabs">
          <button
            className={`main-tab-button ${activeTab === 'plugins' ? 'active' : ''}`}
            onClick={() => setActiveTab('plugins')}
          >
            <span className="tab-icon">🔌</span>
            插件管理
          </button>
          <button
            className={`main-tab-button ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <span className="tab-icon">👤</span>
            个人信息
          </button>
          <button
            className={`main-tab-button ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <span className="tab-icon">⚙️</span>
            应用设置
          </button>
          <button
            className={`main-tab-button ${activeTab === 'tools' ? 'active' : ''}`}
            onClick={() => setActiveTab('tools')}
          >
            <span className="tab-icon">🎛️</span>
            超级面板
          </button>

        </div>

        {/* 插件管理子标签页 */}
        {activeTab === 'plugins' && (
          <div className="sub-tabs">
            <button
              className={`sub-tab-button ${pluginSubTab === 'installed' ? 'active' : ''}`}
              onClick={() => setPluginSubTab('installed')}
            >
              <span className="tab-icon">📦</span>
              已安装
            </button>
            <button
              className={`sub-tab-button ${pluginSubTab === 'store' ? 'active' : ''}`}
              onClick={() => setPluginSubTab('store')}
            >
              <span className="tab-icon">🛍️</span>
              插件商店
            </button>
          </div>
        )}

        {/* 搜索和过滤栏 */}
        {activeTab === 'plugins' && (
          <div className="plugin-filters">
            <div className="search-box-small">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="search-icon">
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
                <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <input
                type="text"
                placeholder="搜索插件..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input-small"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="category-select"
            >
              <option value="all">所有分类</option>
              <option value="productivity">效率工具</option>
              <option value="system">系统工具</option>
              <option value="development">开发工具</option>
              <option value="entertainment">娱乐工具</option>
            </select>
          </div>
        )}

        {/* 插件列表 */}
        {activeTab === 'plugins' && (
          <div className="plugin-list">
            {filteredPlugins.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">📭</span>
                <p className="empty-text">
                  {pluginSubTab === 'installed' ? '暂无已安装的插件' : '未找到匹配的插件'}
                </p>
              </div>
            ) : (
              filteredPlugins.map(plugin => (
                <motion.div
                  key={plugin.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="plugin-card"
                >
                  <div className="plugin-info">
                    <div className="plugin-icon-large">{plugin.icon}</div>
                    <div className="plugin-details">
                      <div className="plugin-name-row">
                        <h3 className="plugin-name">{plugin.name}</h3>
                        <span className="plugin-version">v{plugin.version}</span>
                      </div>
                      <p className="plugin-description">{plugin.description}</p>
                      <div className="plugin-meta">
                        <span className="plugin-author">by {plugin.author}</span>
                        <span className="plugin-stats">
                          ⭐ {plugin.rating} • 📥 {plugin.downloads.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="plugin-actions">
                    {plugin.installed ? (
                      <>
                        <button
                          onClick={() => togglePlugin(plugin.id)}
                          className={`toggle-button ${plugin.enabled ? 'enabled' : 'disabled'}`}
                        >
                          {plugin.enabled ? '已启用' : '已禁用'}
                        </button>
                        <button
                          onClick={() => handleInstall(plugin.id)}
                          className="uninstall-button"
                        >
                          卸载
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleInstall(plugin.id)}
                        className="install-button"
                      >
                        安装
                      </button>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}

        {/* 个人信息页面 */}
        {activeTab === 'profile' && (
          <div className="content-area">
            <div className="profile-header">
              <div className="avatar-section">
                <div className="avatar">👤</div>
                <button className="change-avatar-btn">更换头像</button>
              </div>
              <div className="user-info">
                <h3 className="username">LythTools 用户</h3>
                <p className="user-email">user@lythtools.com</p>
                <span className="user-status">🟢 在线</span>
              </div>
            </div>

            <div className="content-section">
              <h3 className="section-title">📊 使用统计</h3>
              <div className="stats-grid">
                <div className="stat-card">
                  <span className="stat-icon">🚀</span>
                  <div className="stat-info">
                    <span className="stat-number">1,247</span>
                    <span className="stat-label">启动次数</span>
                  </div>
                </div>
                <div className="stat-card">
                  <span className="stat-icon">⏱️</span>
                  <div className="stat-info">
                    <span className="stat-number">42h</span>
                    <span className="stat-label">使用时长</span>
                  </div>
                </div>
                <div className="stat-card">
                  <span className="stat-icon">🔍</span>
                  <div className="stat-info">
                    <span className="stat-number">8,934</span>
                    <span className="stat-label">搜索次数</span>
                  </div>
                </div>
                <div className="stat-card">
                  <span className="stat-icon">🔌</span>
                  <div className="stat-info">
                    <span className="stat-number">12</span>
                    <span className="stat-label">已安装插件</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="content-section">
              <h3 className="section-title">☁️ 云同步</h3>
              <div className="sync-status">
                <div className="sync-info">
                  <span className="sync-icon">✅</span>
                  <div>
                    <span className="sync-text">同步已启用</span>
                    <span className="sync-time">最后同步: 2分钟前</span>
                  </div>
                </div>
                <button className="sync-button">立即同步</button>
              </div>
            </div>
          </div>
        )}

        {/* 应用设置页面 */}
        {activeTab === 'settings' && (
          <div className="content-area">
            <div className="content-section">
              <h3 className="section-title">🔍 搜索设置</h3>
              <div className="settings-items">
                <div className="setting-item">
                  <div className="setting-info">
                    <span className="setting-name">搜索结果数量</span>
                    <span className="setting-desc">每次搜索显示的最大结果数</span>
                  </div>
                  <select className="setting-select">
                    <option value="8">8个结果</option>
                    <option value="12">12个结果</option>
                    <option value="16">16个结果</option>
                  </select>
                </div>
                <div className="setting-item">
                  <div className="setting-info">
                    <span className="setting-name">模糊搜索</span>
                    <span className="setting-desc">启用智能模糊匹配</span>
                  </div>
                  <label className="toggle-switch">
                    <input type="checkbox" defaultChecked />
                    <span className="slider"></span>
                  </label>
                </div>
                <div className="setting-item">
                  <div className="setting-info">
                    <span className="setting-name">搜索历史</span>
                    <span className="setting-desc">记录搜索历史以便快速访问</span>
                  </div>
                  <label className="toggle-switch">
                    <input type="checkbox" defaultChecked />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>
            </div>

            <div className="content-section">
              <h3 className="section-title">⚡ 快捷键设置</h3>
              <div className="settings-items">
                <div className="setting-item">
                  <div className="setting-info">
                    <span className="setting-name">全局唤起</span>
                    <span className="setting-desc">显示/隐藏搜索窗口</span>
                  </div>
                  <div className="hotkey-display">Alt + Space</div>
                </div>
                <div className="setting-item">
                  <div className="setting-info">
                    <span className="setting-name">快速计算</span>
                    <span className="setting-desc">直接进入计算模式</span>
                  </div>
                  <div className="hotkey-display">Ctrl + =</div>
                </div>
                <div className="setting-item">
                  <div className="setting-info">
                    <span className="setting-name">文件搜索</span>
                    <span className="setting-desc">快速搜索文件</span>
                  </div>
                  <div className="hotkey-display">Ctrl + F</div>
                </div>
              </div>
            </div>

            <div className="content-section">
              <h3 className="section-title">🎨 外观设置</h3>
              <div className="settings-items">
                <div className="setting-item">
                  <div className="setting-info">
                    <span className="setting-name">主题模式</span>
                    <span className="setting-desc">选择界面主题</span>
                  </div>
                  <select className="setting-select">
                    <option value="auto">跟随系统</option>
                    <option value="light">浅色模式</option>
                    <option value="dark">深色模式</option>
                  </select>
                </div>
                <div className="setting-item">
                  <div className="setting-info">
                    <span className="setting-name">透明度</span>
                    <span className="setting-desc">调整窗口透明度</span>
                  </div>
                  <input type="range" min="70" max="100" defaultValue="95" className="setting-slider" />
                </div>
                <div className="setting-item">
                  <div className="setting-info">
                    <span className="setting-name">动画效果</span>
                    <span className="setting-desc">启用界面动画</span>
                  </div>
                  <label className="toggle-switch">
                    <input type="checkbox" defaultChecked />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>
            </div>

            <div className="content-section">
              <h3 className="section-title">🚀 启动设置</h3>
              <div className="settings-items">
                <div className="setting-item">
                  <div className="setting-info">
                    <span className="setting-name">开机启动</span>
                    <span className="setting-desc">系统启动时自动运行</span>
                  </div>
                  <label className="toggle-switch">
                    <input type="checkbox" defaultChecked />
                    <span className="slider"></span>
                  </label>
                </div>
                <div className="setting-item">
                  <div className="setting-info">
                    <span className="setting-name">后台运行</span>
                    <span className="setting-desc">关闭窗口时保持后台运行</span>
                  </div>
                  <label className="toggle-switch">
                    <input type="checkbox" defaultChecked />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 超级面板页面 */}
        {activeTab === 'tools' && (
          <div className="content-area">
            <div className="tools-grid">
              <div className="tool-category">
                <h3 className="category-title">📊 系统监控</h3>
                <div className="tool-cards">
                  <div className="tool-card">
                    <span className="tool-icon">💾</span>
                    <div className="tool-info">
                      <span className="tool-name">内存使用</span>
                      <span className="tool-value">8.2GB / 16GB</span>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: '51%' }}></div>
                      </div>
                    </div>
                  </div>
                  <div className="tool-card">
                    <span className="tool-icon">⚡</span>
                    <div className="tool-info">
                      <span className="tool-name">CPU使用率</span>
                      <span className="tool-value">23%</span>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: '23%' }}></div>
                      </div>
                    </div>
                  </div>
                  <div className="tool-card">
                    <span className="tool-icon">💿</span>
                    <div className="tool-info">
                      <span className="tool-name">磁盘空间</span>
                      <span className="tool-value">456GB / 1TB</span>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: '46%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="tool-category">
                <h3 className="category-title">🔧 系统工具</h3>
                <div className="tool-cards">
                  <div className="tool-card clickable">
                    <span className="tool-icon">🧹</span>
                    <div className="tool-info">
                      <span className="tool-name">系统清理</span>
                      <span className="tool-desc">清理临时文件和缓存</span>
                    </div>
                  </div>
                  <div className="tool-card clickable">
                    <span className="tool-icon">🔄</span>
                    <div className="tool-info">
                      <span className="tool-name">重启服务</span>
                      <span className="tool-desc">重启Windows服务</span>
                    </div>
                  </div>
                  <div className="tool-card clickable">
                    <span className="tool-icon">📋</span>
                    <div className="tool-info">
                      <span className="tool-name">剪贴板历史</span>
                      <span className="tool-desc">查看剪贴板历史记录</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="tool-category">
                <h3 className="category-title">📱 快捷操作</h3>
                <div className="tool-cards">
                  <div className="tool-card clickable">
                    <span className="tool-icon">🌐</span>
                    <div className="tool-info">
                      <span className="tool-name">网络设置</span>
                      <span className="tool-desc">快速访问网络配置</span>
                    </div>
                  </div>
                  <div className="tool-card clickable">
                    <span className="tool-icon">🔊</span>
                    <div className="tool-info">
                      <span className="tool-name">音量控制</span>
                      <span className="tool-desc">调整系统音量</span>
                    </div>
                  </div>
                  <div className="tool-card clickable">
                    <span className="tool-icon">🔆</span>
                    <div className="tool-info">
                      <span className="tool-name">亮度调节</span>
                      <span className="tool-desc">调整屏幕亮度</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default MenuView
