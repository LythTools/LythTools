import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plugin, getAllPlugins } from '../data/plugins'
import { useSettingsStore } from '../stores/settingsStore'
import { useSearchStore } from '../stores/searchStore'
import { ExtensionManifest } from '../types'

interface MenuViewProps { }

const MenuView: React.FC<MenuViewProps> = () => {
  const [activeTab, setActiveTab] = useState<'plugins' | 'profile' | 'settings' | 'tools'>('plugins')
  const [pluginSubTab, setPluginSubTab] = useState<'installed' | 'store'>('installed')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [plugins, setPlugins] = useState<Plugin[]>([])
  const [extensions, setExtensions] = useState<ExtensionManifest[]>([])
  const [selectedPlugin, setSelectedPlugin] = useState<Plugin | null>(null)
  const [showPluginDetail, setShowPluginDetail] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // 扩展设置状态
  const [showExtensionSettings, setShowExtensionSettings] = useState(false)
  const [selectedExtension, setSelectedExtension] = useState<ExtensionManifest | null>(null)



  // 用户信息相关状态
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [showAvatarSelector, setShowAvatarSelector] = useState(false)

  // 使用设置存储
  const {
    searchSettings,
    appearanceSettings,
    startupSettings,
    userInfo,
    usageStats,
    hotkeySettings,
    searchHistory,
    updateSearchSettings,
    updateAppearanceSettings,
    updateStartupSettings,
    updateUserInfo,
    updateHotkeySettings,
    exportSettings,
    resetSettings,
    openDataDirectory,
    clearSearchHistory
  } = useSettingsStore()

  // 使用搜索存储
  const { setInstalledExtensionCount } = useSearchStore()

  // 快捷键编辑状态
  const [editingHotkey, setEditingHotkey] = useState<string | null>(null)
  const [tempHotkey, setTempHotkey] = useState('')

  // 编辑时的原始数据备份
  const [originalUserInfo, setOriginalUserInfo] = useState(userInfo)

  // 加载插件数据
  useEffect(() => {
    setPlugins(getAllPlugins())
    loadExtensions()
  }, [])



  // 加载扩展数据
  const loadExtensions = async () => {
    try {
      setIsLoading(true)
      const installed = await window.electronAPI?.extensions.getInstalled() || []
      setExtensions(installed)
      // 更新已安装插件数量到搜索store，用于动态窗口大小调整
      setInstalledExtensionCount(installed.length)
    } catch (error) {
      console.error('加载扩展失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 安装扩展
  const handleInstallExtension = async () => {
    try {
      // 打开文件选择对话框
      const folderResult = await window.electronAPI?.extensions.selectFolder()
      if (!folderResult?.success || !folderResult.path) {
        if (folderResult?.message !== '用户取消选择') {
          console.error('选择扩展文件夹失败:', folderResult?.message)
        }
        return
      }

      // 安装扩展
      const installResult = await window.electronAPI?.extensions.install(folderResult.path)
      if (installResult?.success) {
        console.log('扩展安装成功:', installResult.message)
        await loadExtensions() // 重新加载扩展列表
      } else {
        console.error('扩展安装失败:', installResult?.message)
      }
    } catch (error) {
      console.error('安装扩展时出错:', error)
    }
  }

  // 卸载扩展
  const handleUninstallExtension = async (extensionId: string) => {
    try {
      const result = await window.electronAPI?.extensions.uninstall(extensionId)
      if (result?.success) {
        console.log('扩展卸载成功:', result.message)
        await loadExtensions() // 重新加载扩展列表
      } else {
        console.error('扩展卸载失败:', result?.message)
      }
    } catch (error) {
      console.error('卸载扩展时出错:', error)
    }
  }

  // 启用/禁用扩展
  const handleToggleExtension = async (extensionId: string, enabled: boolean) => {
    try {
      const result = enabled
        ? await window.electronAPI?.extensions.enable(extensionId)
        : await window.electronAPI?.extensions.disable(extensionId)

      if (result?.success) {
        console.log(`扩展${enabled ? '启用' : '禁用'}成功:`, result.message)
        await loadExtensions() // 重新加载扩展列表
      } else {
        console.error(`扩展${enabled ? '启用' : '禁用'}失败:`, result?.message)
      }
    } catch (error) {
      console.error(`${enabled ? '启用' : '禁用'}扩展时出错:`, error)
    }
  }

  // 格式化使用时长
  const formatUsageTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    return `${hours}h`
  }

  // 快捷键编辑功能
  const startEditingHotkey = (key: string, currentValue: string) => {
    setEditingHotkey(key)
    setTempHotkey(currentValue)
  }

  const saveHotkey = (key: string) => {
    if (tempHotkey.trim()) {
      updateHotkeySettings({ [key]: tempHotkey })
    }
    setEditingHotkey(null)
    setTempHotkey('')
  }

  const cancelHotkeyEdit = () => {
    setEditingHotkey(null)
    setTempHotkey('')
  }

  // 处理快捷键输入
  const handleHotkeyKeyDown = (e: React.KeyboardEvent) => {
    e.preventDefault()
    const keys = []
    if (e.ctrlKey) keys.push('Ctrl')
    if (e.altKey) keys.push('Alt')
    if (e.shiftKey) keys.push('Shift')
    if (e.metaKey) keys.push('Meta')

    const key = e.key
    if (key !== 'Control' && key !== 'Alt' && key !== 'Shift' && key !== 'Meta') {
      keys.push(key === ' ' ? 'Space' : key)
    }

    if (keys.length > 0) {
      setTempHotkey(keys.join('+'))
    }
  }

  // 过滤插件
  const filteredPlugins = plugins.filter(plugin => {
    const matchesTab = pluginSubTab === 'installed' ? plugin.status === 'installed' : true
    const matchesCategory = selectedCategory === 'all' || plugin.category === selectedCategory
    const matchesSearch = plugin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plugin.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesTab && matchesCategory && matchesSearch
  })

  // 获取要显示的扩展数据
  const getDisplayExtensions = () => {
    return extensions.filter(extension => {
      const matchesSearch = extension.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        extension.description.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = selectedCategory === 'all' || extension.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }

  // 打开插件详情
  const openPluginDetail = (plugin: Plugin) => {
    setSelectedPlugin(plugin)
    setShowPluginDetail(true)
  }

  // 关闭插件详情
  const closePluginDetail = () => {
    setShowPluginDetail(false)
    setSelectedPlugin(null)
  }

  // 打开扩展设置
  const openExtensionSettings = (extension: ExtensionManifest) => {
    setSelectedExtension(extension)
    setShowExtensionSettings(true)
  }

  // 关闭扩展设置
  const closeExtensionSettings = () => {
    setShowExtensionSettings(false)
    setSelectedExtension(null)
  }

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
    <>
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
              {pluginSubTab === 'installed' ? (
                // 显示已安装的扩展
                <>
                  <div className="plugins-header">
                    <h3 className="plugins-title">已安装扩展</h3>
                    <div className="plugins-actions">
                      <button
                        className="btn-secondary"
                        onClick={handleInstallExtension}
                      >
                        <span className="btn-icon">📦</span>
                        安装扩展
                      </button>
                    </div>
                  </div>

                  {isLoading ? (
                    <div className="loading-state">
                      <div className="loading-spinner"></div>
                      <p>加载扩展中...</p>
                    </div>
                  ) : getDisplayExtensions().length === 0 ? (
                    <div className="empty-state">
                      <span className="empty-icon">📦</span>
                      <p className="empty-text">暂无已安装的扩展</p>
                    </div>
                  ) : (
                    getDisplayExtensions().map((extension: ExtensionManifest) => (
                      <motion.div
                        key={extension.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="plugin-card extension-card"
                      >
                        <div className="plugin-info">
                          <div className="plugin-icon-large">{extension.icon}</div>
                          <div className="plugin-details">
                            <div className="plugin-name-row">
                              <h3 className="plugin-name">{extension.name}</h3>
                              <span className="plugin-version">v{extension.version}</span>
                              <span className={`status-badge ${extension.enabled ? 'enabled' : 'disabled'}`}>
                                {extension.enabled ? '已启用' : '已禁用'}
                              </span>
                            </div>
                            <p className="plugin-description">{extension.description}</p>
                            <div className="plugin-meta">
                              <span className="plugin-author">by {extension.author}</span>
                              <span className="plugin-category">{extension.category}</span>
                              {extension.permissions && extension.permissions.length > 0 && (
                                <span className="plugin-permissions">
                                  权限: {extension.permissions.join(', ')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="plugin-actions">
                          <button
                            className={`toggle-button ${extension.enabled ? 'enabled' : 'disabled'}`}
                            onClick={() => handleToggleExtension(extension.id, !extension.enabled)}
                          >
                            {extension.enabled ? '禁用' : '启用'}
                          </button>
                          <button
                            className="detail-button"
                            onClick={() => openExtensionSettings(extension)}
                          >
                            设置
                          </button>
                          <button
                            className="uninstall-button"
                            onClick={() => handleUninstallExtension(extension.id)}
                          >
                            卸载
                          </button>
                        </div>
                      </motion.div>
                    ))
                  )}
                </>
              ) : (
                // 显示插件商店
                <>
                  {filteredPlugins.length === 0 ? (
                    <div className="empty-state">
                      <span className="empty-icon">📭</span>
                      <p className="empty-text">未找到匹配的插件</p>
                    </div>
                  ) : (
                    filteredPlugins.map(plugin => (
                      <motion.div
                        key={plugin.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="plugin-card"
                        onClick={() => openPluginDetail(plugin)}
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
                        <div className="plugin-actions" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => openPluginDetail(plugin)}
                            className="detail-button"
                          >
                            详情
                          </button>
                          {plugin.status === 'installed' ? (
                            <>
                              <button
                                onClick={() => togglePlugin(plugin.id)}
                                className="toggle-button enabled"
                              >
                                已安装
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
                </>
              )}
            </div>
          )}

          {/* 个人信息页面 */}
          {activeTab === 'profile' && (
            <div className="content-area">
              <div className="content-section">
                <h3 className="section-title">👤 用户信息</h3>
                <div className="settings-items">
                  {/* 头像设置 */}
                  <div className="setting-item">
                    <div className="setting-info">
                      <span className="setting-name">头像</span>
                      <span className="setting-desc">点击更换个人头像</span>
                    </div>
                    <div className="avatar-setting" onClick={() => setShowAvatarSelector(!showAvatarSelector)}>
                      <div className="current-avatar">{userInfo.avatar}</div>
                      {showAvatarSelector && (
                        <div className="avatar-selector">
                          {['👤', '😊', '🚀', '⚡', '🎯', '💡', '🔥', '⭐', '🌟', '💎'].map(emoji => (
                            <div
                              key={emoji}
                              className="avatar-option"
                              onClick={() => {
                                updateUserInfo({ avatar: emoji });
                                setShowAvatarSelector(false);
                              }}
                            >
                              {emoji}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 用户名设置 */}
                  <div className="setting-item">
                    <div className="setting-info">
                      <span className="setting-name">用户名</span>
                      <span className="setting-desc">显示名称</span>
                    </div>
                    {isEditingProfile ? (
                      <input
                        type="text"
                        value={userInfo.name}
                        onChange={(e) => updateUserInfo({ name: e.target.value })}
                        className="setting-input"
                        placeholder="输入用户名"
                        autoFocus
                      />
                    ) : (
                      <div className="setting-value editable" onClick={() => {
                        setOriginalUserInfo(userInfo);
                        setIsEditingProfile(true);
                      }}>
                        {userInfo.name}
                      </div>
                    )}
                  </div>

                  {/* 邮箱设置 */}
                  <div className="setting-item">
                    <div className="setting-info">
                      <span className="setting-name">邮箱地址</span>
                      <span className="setting-desc">账户绑定邮箱</span>
                    </div>
                    {isEditingProfile ? (
                      <input
                        type="email"
                        value={userInfo.email}
                        onChange={(e) => updateUserInfo({ email: e.target.value })}
                        className="setting-input"
                        placeholder="输入邮箱地址"
                      />
                    ) : (
                      <div className="setting-value editable" onClick={() => {
                        setOriginalUserInfo(userInfo);
                        setIsEditingProfile(true);
                      }}>
                        {userInfo.email}
                      </div>
                    )}
                  </div>

                  {/* 在线状态 */}
                  <div className="setting-item">
                    <div className="setting-info">
                      <span className="setting-name">在线状态</span>
                      <span className="setting-desc">当前连接状态</span>
                    </div>
                    <div className="sync-status-indicator">
                      <span className="sync-status-text">在线</span>
                    </div>
                  </div>

                  {/* 编辑操作 */}
                  {isEditingProfile && (
                    <div className="setting-item">
                      <div className="setting-info">
                        <span className="setting-name">保存更改</span>
                        <span className="setting-desc">确认或取消修改</span>
                      </div>
                      <div className="edit-actions">
                        <button
                          className="setting-button"
                          onClick={() => {
                            setIsEditingProfile(false);
                            // 这里可以添加保存到后端的逻辑
                          }}
                        >
                          保存
                        </button>
                        <button
                          className="setting-button secondary"
                          onClick={() => {
                            setIsEditingProfile(false);
                            // 恢复原始数据
                            updateUserInfo(originalUserInfo);
                          }}
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="content-section">
                <h3 className="section-title">📊 使用统计</h3>
                <div className="settings-items">
                  <div className="setting-item">
                    <div className="setting-info">
                      <span className="setting-name">🚀 启动次数</span>
                      <span className="setting-desc">应用总启动次数</span>
                    </div>
                    <div className="setting-value">{usageStats.launchCount.toLocaleString()}</div>
                  </div>
                  <div className="setting-item">
                    <div className="setting-info">
                      <span className="setting-name">⏱️ 使用时长</span>
                      <span className="setting-desc">累计使用时间</span>
                    </div>
                    <div className="setting-value">{formatUsageTime(usageStats.totalUsageTime)}</div>
                  </div>
                  <div className="setting-item">
                    <div className="setting-info">
                      <span className="setting-name">🔍 搜索次数</span>
                      <span className="setting-desc">总搜索操作次数</span>
                    </div>
                    <div className="setting-value">{usageStats.searchCount.toLocaleString()}</div>
                  </div>
                  <div className="setting-item">
                    <div className="setting-info">
                      <span className="setting-name">🔌 已安装插件</span>
                      <span className="setting-desc">当前安装的插件数量</span>
                    </div>
                    <div className="setting-value">{usageStats.installedPlugins}</div>
                  </div>
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
                    <select
                      className="setting-select"
                      value={searchSettings.maxResults}
                      onChange={(e) => updateSearchSettings({ maxResults: parseInt(e.target.value) })}
                    >
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
                      <input
                        type="checkbox"
                        checked={searchSettings.fuzzySearch}
                        onChange={(e) => updateSearchSettings({ fuzzySearch: e.target.checked })}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>
                  <div className="setting-item">
                    <div className="setting-info">
                      <span className="setting-name">搜索历史</span>
                      <span className="setting-desc">记录搜索历史以便快速访问 ({searchHistory.length}条记录)</span>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={searchSettings.searchHistory}
                        onChange={(e) => updateSearchSettings({ searchHistory: e.target.checked })}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>
                  {searchSettings.searchHistory && searchHistory.length > 0 && (
                    <div className="setting-item">
                      <div className="setting-info">
                        <span className="setting-name">清空搜索历史</span>
                        <span className="setting-desc">删除所有搜索历史记录</span>
                      </div>
                      <button
                        className="setting-button danger"
                        onClick={() => {
                          if (window.confirm('确定要清空所有搜索历史吗？')) {
                            clearSearchHistory()
                          }
                        }}
                      >
                        清空
                      </button>
                    </div>
                  )}
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
                    {editingHotkey === 'globalToggle' ? (
                      <div className="edit-actions">
                        <input
                          type="text"
                          value={tempHotkey}
                          onChange={(e) => setTempHotkey(e.target.value)}
                          onKeyDown={handleHotkeyKeyDown}
                          className="setting-input"
                          placeholder="按下快捷键组合"
                          autoFocus
                        />
                        <button
                          className="setting-button"
                          onClick={() => saveHotkey('globalToggle')}
                        >
                          保存
                        </button>
                        <button
                          className="setting-button secondary"
                          onClick={cancelHotkeyEdit}
                        >
                          取消
                        </button>
                      </div>
                    ) : (
                      <div
                        className="hotkey-display editable"
                        onClick={() => startEditingHotkey('globalToggle', hotkeySettings.globalToggle)}
                        style={{ cursor: 'pointer' }}
                      >
                        {hotkeySettings.globalToggle}
                      </div>
                    )}
                  </div>
                  <div className="setting-item">
                    <div className="setting-info">
                      <span className="setting-name">快速计算</span>
                      <span className="setting-desc">直接进入计算模式</span>
                    </div>
                    {editingHotkey === 'quickCalculator' ? (
                      <div className="edit-actions">
                        <input
                          type="text"
                          value={tempHotkey}
                          onChange={(e) => setTempHotkey(e.target.value)}
                          onKeyDown={handleHotkeyKeyDown}
                          className="setting-input"
                          placeholder="按下快捷键组合"
                          autoFocus
                        />
                        <button
                          className="setting-button"
                          onClick={() => saveHotkey('quickCalculator')}
                        >
                          保存
                        </button>
                        <button
                          className="setting-button secondary"
                          onClick={cancelHotkeyEdit}
                        >
                          取消
                        </button>
                      </div>
                    ) : (
                      <div
                        className="hotkey-display editable"
                        onClick={() => startEditingHotkey('quickCalculator', hotkeySettings.quickCalculator)}
                        style={{ cursor: 'pointer' }}
                      >
                        {hotkeySettings.quickCalculator}
                      </div>
                    )}
                  </div>
                  <div className="setting-item">
                    <div className="setting-info">
                      <span className="setting-name">文件搜索</span>
                      <span className="setting-desc">快速搜索文件</span>
                    </div>
                    {editingHotkey === 'fileSearch' ? (
                      <div className="edit-actions">
                        <input
                          type="text"
                          value={tempHotkey}
                          onChange={(e) => setTempHotkey(e.target.value)}
                          onKeyDown={handleHotkeyKeyDown}
                          className="setting-input"
                          placeholder="按下快捷键组合"
                          autoFocus
                        />
                        <button
                          className="setting-button"
                          onClick={() => saveHotkey('fileSearch')}
                        >
                          保存
                        </button>
                        <button
                          className="setting-button secondary"
                          onClick={cancelHotkeyEdit}
                        >
                          取消
                        </button>
                      </div>
                    ) : (
                      <div
                        className="hotkey-display editable"
                        onClick={() => startEditingHotkey('fileSearch', hotkeySettings.fileSearch)}
                        style={{ cursor: 'pointer' }}
                      >
                        {hotkeySettings.fileSearch}
                      </div>
                    )}
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
                    <select
                      className="setting-select"
                      value={appearanceSettings.theme}
                      onChange={(e) => {
                        const newTheme = e.target.value as 'auto' | 'light' | 'dark'
                        console.log('切换主题到:', newTheme)
                        updateAppearanceSettings({ theme: newTheme })
                      }}
                    >
                      <option value="auto">跟随系统</option>
                      <option value="light">浅色模式</option>
                      <option value="dark">深色模式</option>
                    </select>
                  </div>
                  <div className="setting-item">
                    <div className="setting-info">
                      <span className="setting-name">透明度</span>
                      <span className="setting-desc">调整窗口透明度 ({appearanceSettings.transparency}%)</span>
                    </div>
                    <input
                      type="range"
                      min="70"
                      max="100"
                      value={appearanceSettings.transparency}
                      onChange={(e) => {
                        const newTransparency = parseInt(e.target.value)
                        console.log('调整透明度到:', newTransparency)
                        updateAppearanceSettings({ transparency: newTransparency })
                      }}
                      className="setting-slider"
                    />
                  </div>
                  <div className="setting-item">
                    <div className="setting-info">
                      <span className="setting-name">动画效果</span>
                      <span className="setting-desc">启用界面动画</span>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={appearanceSettings.animations}
                        onChange={(e) => {
                          const newAnimations = e.target.checked
                          console.log('切换动画效果到:', newAnimations)
                          updateAppearanceSettings({ animations: newAnimations })
                        }}
                      />
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
                      <input
                        type="checkbox"
                        checked={startupSettings.autoStart}
                        onChange={(e) => updateStartupSettings({ autoStart: e.target.checked })}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>
                  <div className="setting-item">
                    <div className="setting-info">
                      <span className="setting-name">后台运行</span>
                      <span className="setting-desc">关闭窗口时保持后台运行</span>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={startupSettings.runInBackground}
                        onChange={(e) => updateStartupSettings({ runInBackground: e.target.checked })}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>
                </div>
              </div>

              {/* 设置管理 */}
              <div className="content-section">
                <h3 className="section-title">🛠️ 设置管理</h3>
                <div className="settings-items">
                  <div className="setting-item">
                    <div className="setting-info">
                      <span className="setting-name">📁 打开数据目录</span>
                      <span className="setting-desc">打开应用数据存储目录</span>
                    </div>
                    <button className="setting-button" onClick={openDataDirectory}>
                      打开
                    </button>
                  </div>
                  <div className="setting-item">
                    <div className="setting-info">
                      <span className="setting-name">📤 导出设置</span>
                      <span className="setting-desc">导出当前应用配置</span>
                    </div>
                    <button className="setting-button" onClick={exportSettings}>
                      导出
                    </button>
                  </div>
                  <div className="setting-item">
                    <div className="setting-info">
                      <span className="setting-name">🔄 重置设置</span>
                      <span className="setting-desc">恢复所有设置到默认值</span>
                    </div>
                    <button
                      className="setting-button danger"
                      onClick={() => {
                        if (window.confirm('确定要重置所有设置吗？此操作不可撤销。')) {
                          resetSettings()
                        }
                      }}
                    >
                      重置
                    </button>
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
                  <h3 className="category-title">🛠️ 工具面板</h3>
                  <div className="feature-card">
                    <div className="feature-icon">🔧</div>
                    <div className="feature-content">
                      <h4 className="feature-title">工具功能</h4>
                      <p className="feature-desc">此页面用于展示工具功能，目前处于开发中...</p>
                    </div>
                  </div>
                </div>

                <div className="tool-category">
                  <h3 className="category-title">💡 使用提示</h3>
                  <div className="tip-card">
                    <p className="tip-text">
                      按下 <kbd>Alt</kbd>+<kbd>Space</kbd> 可随时呼出搜索框
                    </p>
                  </div>
                  <div className="tip-card">
                    <p className="tip-text">
                      使用方向键 <kbd>↑</kbd><kbd>↓</kbd> 可在搜索结果中导航
                    </p>
                  </div>
                </div>

              </div>
            </div>
          )}


        </div>

        {/* 插件详情页模态框 - 在菜单容器内部 */}
        {showPluginDetail && selectedPlugin && (
          <div className="menu-modal-overlay" onClick={closePluginDetail}>
            <div className="menu-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="plugin-detail-modal">
                <div className="plugin-detail-header">
                  <div className="plugin-detail-title">
                    <span className="plugin-detail-icon">{selectedPlugin.icon}</span>
                    <div>
                      <h2 className="plugin-detail-name">{selectedPlugin.name}</h2>
                      <p className="plugin-detail-author">by {selectedPlugin.author}</p>
                    </div>
                  </div>
                  <button className="close-button" onClick={closePluginDetail}>✕</button>
                </div>

                <div className="plugin-detail-content">
                  <div className="plugin-detail-info">
                    <div className="plugin-detail-meta">
                      <div className="meta-item">
                        <span className="meta-label">版本</span>
                        <span className="meta-value">v{selectedPlugin.version}</span>
                      </div>
                      <div className="meta-item">
                        <span className="meta-label">大小</span>
                        <span className="meta-value">{selectedPlugin.size}</span>
                      </div>
                      <div className="meta-item">
                        <span className="meta-label">下载量</span>
                        <span className="meta-value">{selectedPlugin.downloads.toLocaleString()}</span>
                      </div>
                      <div className="meta-item">
                        <span className="meta-label">评分</span>
                        <span className="meta-value">⭐ {selectedPlugin.rating}</span>
                      </div>
                      <div className="meta-item">
                        <span className="meta-label">更新时间</span>
                        <span className="meta-value">{selectedPlugin.lastUpdated}</span>
                      </div>
                    </div>

                    <div className="plugin-detail-description">
                      <h3>插件描述</h3>
                      <p>{selectedPlugin.description}</p>
                    </div>

                    <div className="plugin-detail-features">
                      <h3>主要功能</h3>
                      <ul>
                        {selectedPlugin.features.map((feature, index) => (
                          <li key={index}>{feature}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="plugin-detail-changelog">
                      <h3>更新日志</h3>
                      {selectedPlugin.changelog.map((log, index) => (
                        <div key={index} className="changelog-item">
                          <div className="changelog-header">
                            <span className="changelog-version">v{log.version}</span>
                            <span className="changelog-date">{log.date}</span>
                          </div>
                          <ul className="changelog-changes">
                            {log.changes.map((change, changeIndex) => (
                              <li key={changeIndex}>{change}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="plugin-detail-actions">
                    {selectedPlugin.status === 'installed' ? (
                      <button className="action-button uninstall">卸载插件</button>
                    ) : (
                      <button className="action-button install">安装插件</button>
                    )}
                    <button className="action-button secondary" onClick={closePluginDetail}>
                      关闭
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 扩展设置页模态框 - 在菜单容器内部 */}
        {showExtensionSettings && selectedExtension && (
          <div className="menu-modal-overlay" onClick={closeExtensionSettings}>
            <div className="menu-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="plugin-detail-modal extension-settings-modal">
                <div className="plugin-detail-header">
                  <div className="plugin-detail-title">
                    <span className="plugin-detail-icon">{selectedExtension.icon}</span>
                    <div>
                      <h2 className="plugin-detail-name">{selectedExtension.name} - 设置</h2>
                      <p className="plugin-detail-author">v{selectedExtension.version} by {selectedExtension.author}</p>
                    </div>
                  </div>
                  <button className="close-button" onClick={closeExtensionSettings}>✕</button>
                </div>

                <div className="plugin-detail-content">
                  <div className="plugin-detail-info">
                    {selectedExtension.settings && selectedExtension.settings.length > 0 ? (
                      <div className="settings-sections">
                        <div className="content-section">
                          <h3 className="section-title">⚙️ 扩展设置</h3>
                          <div className="settings-items">
                            {selectedExtension.settings.map((setting, index) => (
                              <div key={index} className="setting-item">
                                <div className="setting-info">
                                  <span className="setting-name">{setting.name}</span>
                                  <span className="setting-desc">{setting.description}</span>
                                </div>
                                <div className="setting-control">
                                  {setting.type === 'boolean' ? (
                                    <label className="toggle-switch">
                                      <input
                                        type="checkbox"
                                        defaultChecked={setting.default}
                                      />
                                      <span className="toggle-slider"></span>
                                    </label>
                                  ) : setting.type === 'select' ? (
                                    <select className="setting-select" defaultValue={setting.default}>
                                      {setting.options?.map((option, optIndex) => (
                                        <option key={optIndex} value={option.value}>
                                          {option.label}
                                        </option>
                                      ))}
                                    </select>
                                  ) : setting.type === 'number' ? (
                                    <input
                                      type="number"
                                      className="setting-input"
                                      defaultValue={setting.default}
                                    />
                                  ) : (
                                    <input
                                      type="text"
                                      className="setting-input"
                                      defaultValue={setting.default}
                                    />
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="content-section">
                          <h3 className="section-title">📋 扩展信息</h3>
                          <div className="extension-info-grid">
                            <div className="info-item">
                              <span className="info-label">扩展ID</span>
                              <span className="info-value">{selectedExtension.id}</span>
                            </div>
                            <div className="info-item">
                              <span className="info-label">版本</span>
                              <span className="info-value">v{selectedExtension.version}</span>
                            </div>
                            <div className="info-item">
                              <span className="info-label">作者</span>
                              <span className="info-value">{selectedExtension.author}</span>
                            </div>
                            <div className="info-item">
                              <span className="info-label">分类</span>
                              <span className="info-value">{selectedExtension.category}</span>
                            </div>
                            {selectedExtension.permissions && selectedExtension.permissions.length > 0 && (
                              <div className="info-item">
                                <span className="info-label">权限</span>
                                <span className="info-value">{selectedExtension.permissions.join(', ')}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {selectedExtension.commands && selectedExtension.commands.length > 0 && (
                          <div className="content-section">
                            <h3 className="section-title">⌨️ 可用命令</h3>
                            <div className="commands-list">
                              {selectedExtension.commands.map((command, index) => (
                                <div key={index} className="command-item">
                                  <div className="command-info">
                                    <span className="command-name">{command.name}</span>
                                    <span className="command-desc">{command.description}</span>
                                  </div>
                                  <div className="command-keywords">
                                    {command.keywords.map((keyword, kwIndex) => (
                                      <span key={kwIndex} className="keyword-tag">{keyword}</span>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="empty-state">
                        <span className="empty-icon">⚙️</span>
                        <p className="empty-text">此扩展暂无可配置的设置项</p>
                      </div>
                    )}
                  </div>

                  <div className="plugin-detail-actions">
                    <button className="action-button primary">保存设置</button>
                    <button className="action-button secondary" onClick={closeExtensionSettings}>
                      关闭
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </motion.div>
    </>
  )
}

export default MenuView
