/**
 * 插件管理区域组件
 */
import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ExtensionManifest } from '../../types'
import { useSearchStore } from '../../stores/searchStore'
import { useSettingsStore } from '../../stores/settingsStore'

interface PluginManagementProps {
  // 可以通过props传递需要的状态和回调
}

export const PluginManagement: React.FC<PluginManagementProps> = () => {
  const [pluginSubTab, setPluginSubTab] = useState<'installed' | 'store'>('installed')
  const [searchQuery, setSearchQuery] = useState('')
  const [extensions, setExtensions] = useState<ExtensionManifest[]>([])
  const [availableExtensions, setAvailableExtensions] = useState<ExtensionManifest[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingAvailable, setIsLoadingAvailable] = useState(false)
  
  // 扩展设置状态
  const [showExtensionSettings, setShowExtensionSettings] = useState(false)
  const [selectedExtension, setSelectedExtension] = useState<ExtensionManifest | null>(null)
  
  // 扩展详情弹窗状态
  const [showExtensionDetail, setShowExtensionDetail] = useState(false)
  const [selectedExtensionDetail, setSelectedExtensionDetail] = useState<ExtensionManifest | null>(null)

  // 使用搜索存储
  const { setInstalledExtensionCount } = useSearchStore()

  // 加载扩展数据
  useEffect(() => {
    loadExtensions()
    loadAvailableExtensions()
  }, [])

  // 加载扩展数据
  const loadExtensions = async () => {
    try {
      setIsLoading(true)
      const installed = await window.electronAPI?.extensions.getInstalled() || []
      setExtensions(installed)
      // 更新已安装插件数量到搜索store，用于动态窗口大小调整
      setInstalledExtensionCount(installed.length)
      // 同步使用统计中的已安装数量
      useSettingsStore.getState().updateUsageStats({ installedPlugins: installed.length })
    } catch (error) {
      console.error('加载扩展失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 加载可用（商店）扩展，不使用任何模拟数据
  const loadAvailableExtensions = async () => {
    try {
      setIsLoadingAvailable(true)
      const available = await window.electronAPI?.extensions.getAvailable() || []
      setAvailableExtensions(available)
    } catch (error) {
      console.error('加载可用扩展失败:', error)
    } finally {
      setIsLoadingAvailable(false)
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

  // 获取要显示的扩展数据（仅真实已安装）
  const getDisplayExtensions = () => {
    return extensions.filter(extension => {
      const matchesSearch = extension.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        extension.description.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesSearch
    })
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

  // 打开扩展详情
  const openExtensionDetail = (extension: ExtensionManifest) => {
    setSelectedExtensionDetail(extension)
    setShowExtensionDetail(true)
  }

  // 关闭扩展详情
  const closeExtensionDetail = () => {
    setShowExtensionDetail(false)
    setSelectedExtensionDetail(null)
  }

  return (
    <>
      {/* 插件管理子标签页 */}
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

      {/* 搜索栏 */}
      <div className="plugin-filters">
        <div className="search-box-small">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="search-icon">
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
            <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <input
            type="text"
            placeholder={pluginSubTab === 'installed' ? '搜索已安装扩展...' : '搜索商店扩展...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input-small"
          />
        </div>
      </div>

      {/* 扩展列表 */}
      <div className="plugin-list">
        {pluginSubTab === 'installed' ? (
          <>
            <div className="plugins-header">
              <h3 className="plugins-title">已安装扩展</h3>
              <div className="plugins-actions">
                <button
                  className="btn-secondary"
                  onClick={handleInstallExtension}
                >
                  <span className="btn-icon">📦</span>
                  从本地安装
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
                  onClick={() => openExtensionDetail(extension)}
                  style={{ cursor: 'pointer' }}
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
                      onClick={(e) => {
                        e.stopPropagation()
                        handleToggleExtension(extension.id, !extension.enabled)
                      }}
                    >
                      {extension.enabled ? '禁用' : '启用'}
                    </button>
                    <button
                      className="detail-button"
                      onClick={(e) => {
                        e.stopPropagation()
                        openExtensionSettings(extension)
                      }}
                    >
                      设置
                    </button>
                    <button
                      className="uninstall-button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleUninstallExtension(extension.id)
                      }}
                    >
                      卸载
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </>
        ) : (
          <>
            <div className="plugins-header">
              <h3 className="plugins-title">插件商店</h3>
              <div className="plugins-actions">
                <button className="btn-secondary" onClick={loadAvailableExtensions}>
                  <span className="btn-icon">🔄</span>
                  刷新
                </button>
              </div>
            </div>
            {isLoadingAvailable ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>加载商店扩展中...</p>
              </div>
            ) : (
              (() => {
                const filtered = availableExtensions.filter(ext =>
                  ext.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  ext.description.toLowerCase().includes(searchQuery.toLowerCase())
                )
                if (filtered.length === 0) {
                  return (
                    <div className="empty-state">
                      <span className="empty-icon">🛍️</span>
                      <p className="empty-text">暂无可用扩展</p>
                    </div>
                  )
                }
                return filtered.map((ext) => (
                  <motion.div
                    key={ext.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="plugin-card"
                  >
                    <div className="plugin-info">
                      <div className="plugin-icon-large">{ext.icon}</div>
                      <div className="plugin-details">
                        <div className="plugin-name-row">
                          <h3 className="plugin-name">{ext.name}</h3>
                          <span className="plugin-version">v{ext.version}</span>
                        </div>
                        <p className="plugin-description">{ext.description}</p>
                        <div className="plugin-meta">
                          <span className="plugin-author">by {ext.author}</span>
                          <span className="plugin-category">{ext.category}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              })()
            )}
          </>
        )}
      </div>

      {/* 扩展设置页模态框 */}
      {showExtensionSettings && selectedExtension && (
        <div className="menu-modal-overlay" onClick={closeExtensionSettings}>
          <div className="menu-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="plugin-detail-modal">
              <div className="plugin-detail-header">
                <div className="plugin-detail-title">
                  <div className="plugin-detail-icon">{selectedExtension.icon}</div>
                  <h2 className="plugin-detail-name">{selectedExtension.name} - 设置</h2>
                </div>
                <button className="modal-close" onClick={closeExtensionSettings}>✕</button>
              </div>

              <div className="plugin-detail-content">
              {selectedExtension.settings && selectedExtension.settings.length > 0 ? (
                <>
                  {/* 扩展设置 */}
                  <div className="plugin-detail-description">
                    <h3>⚙️ 扩展设置</h3>
                    <div className="settings-list">
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
                                <span className="slider"></span>
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

                  {/* 扩展信息 - 使用与详情模态框相同的样式 */}
                  <div className="plugin-detail-meta">
                    <div className="meta-item">
                      <span className="meta-label">扩展ID</span>
                      <span className="meta-value">{selectedExtension.id}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">版本</span>
                      <span className="meta-value">v{selectedExtension.version}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">作者</span>
                      <span className="meta-value">{selectedExtension.author}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">分类</span>
                      <span className="meta-value">{selectedExtension.category}</span>
                    </div>
                    {selectedExtension.permissions && selectedExtension.permissions.length > 0 && (
                      <div className="meta-item">
                        <span className="meta-label">权限</span>
                        <span className="meta-value">{selectedExtension.permissions.join(', ')}</span>
                      </div>
                    )}
                  </div>

                  {/* 可用命令 */}
                  {selectedExtension.commands && selectedExtension.commands.length > 0 && (
                    <div className="plugin-detail-features">
                      <h3>⌨️ 可用命令</h3>
                      <ul>
                        {selectedExtension.commands.map((command, index) => (
                          <li key={index}>
                            <strong>{command.name}</strong> - {command.description}
                            <div className="command-keywords">
                              {command.keywords.map((keyword, kwIndex) => (
                                <span key={kwIndex} className="keyword-tag">{keyword}</span>
                              ))}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
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
      )}

      {/* 扩展详情模态框 */}
      {showExtensionDetail && selectedExtensionDetail && (
        <div className="menu-modal-overlay" onClick={closeExtensionDetail}>
          <div className="menu-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="plugin-detail-modal">
              <div className="plugin-detail-header">
                <div className="plugin-detail-title">
                  <div className="plugin-detail-icon">{selectedExtensionDetail.icon}</div>
                  <h2 className="plugin-detail-name">{selectedExtensionDetail.name}</h2>
                </div>
                <button className="modal-close" onClick={closeExtensionDetail}>✕</button>
              </div>

              <div className="plugin-detail-content">
              {/* 基本信息 */}
              <div className="plugin-detail-meta">
                <div className="meta-item">
                  <span className="meta-label">版本</span>
                  <span className="meta-value">v{selectedExtensionDetail.version}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">作者</span>
                  <span className="meta-value">{selectedExtensionDetail.author}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">分类</span>
                  <span className="meta-value">{selectedExtensionDetail.category}</span>
                </div>
                {selectedExtensionDetail.license && (
                  <div className="meta-item">
                    <span className="meta-label">许可证</span>
                    <span className="meta-value">{selectedExtensionDetail.license}</span>
                  </div>
                )}
              </div>

              {/* 详细描述 */}
              <div className="plugin-detail-description">
                <h3>描述</h3>
                <p>{selectedExtensionDetail.longDescription || selectedExtensionDetail.description}</p>
              </div>

              {/* 功能特性 */}
              {selectedExtensionDetail.features && selectedExtensionDetail.features.length > 0 && (
                <div className="plugin-detail-features">
                  <h3>功能特性</h3>
                  <ul>
                    {selectedExtensionDetail.features.map((feature, index) => (
                      <li key={index}>{feature}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 标签 */}
              {selectedExtensionDetail.tags && selectedExtensionDetail.tags.length > 0 && (
                <div className="plugin-detail-tags">
                  <h3>标签</h3>
                  <div className="tags-container">
                    {selectedExtensionDetail.tags.map((tag, index) => (
                      <span key={index} className="tag">{tag}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* 更新日志 */}
              {selectedExtensionDetail.changelog && selectedExtensionDetail.changelog.length > 0 && (
                <div className="plugin-detail-changelog">
                  <h3>更新日志</h3>
                  {selectedExtensionDetail.changelog.slice(0, 3).map((entry, index) => (
                    <div key={index} className="changelog-item">
                      <div className="changelog-header">
                        <span className="changelog-version">v{entry.version}</span>
                        <span className="changelog-date">{entry.date}</span>
                      </div>
                      <ul className="changelog-changes">
                        {entry.changes.map((change, changeIndex) => (
                          <li key={changeIndex}>{change}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}

              {/* 链接信息 */}
              {(selectedExtensionDetail.homepage || selectedExtensionDetail.repository) && (
                <div className="plugin-detail-links">
                  <h3>相关链接</h3>
                  <div className="links-container">
                    {selectedExtensionDetail.homepage && (
                      <a 
                        href={selectedExtensionDetail.homepage} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="link-button"
                      >
                        🏠 主页
                      </a>
                    )}
                    {selectedExtensionDetail.repository && (
                      <a 
                        href={selectedExtensionDetail.repository} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="link-button"
                      >
                        📦 源码
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

              <div className="plugin-detail-actions">
                <button 
                  className="action-button primary"
                  onClick={(e) => {
                    e.stopPropagation()
                    closeExtensionDetail()
                    openExtensionSettings(selectedExtensionDetail)
                  }}
                >
                  打开设置
                </button>
                <button className="action-button secondary" onClick={closeExtensionDetail}>
                  关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default PluginManagement
