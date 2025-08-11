/**
 * 设置区域组件
 */
import React, { useState } from 'react'
import { useSettingsStore } from '../../stores/settingsStore'

interface SettingsSectionProps {
  // 可以通过props传递需要的状态和回调
}

export const SettingsSection: React.FC<SettingsSectionProps> = () => {
  const [editingHotkey, setEditingHotkey] = useState<string | null>(null)
  const [tempHotkey, setTempHotkey] = useState('')

  const {
    searchSettings,
    appearanceSettings, 
    startupSettings,
    hotkeySettings,
    searchHistory,
    updateSearchSettings,
    updateAppearanceSettings,
    updateStartupSettings,
    updateHotkeySettings,
    exportSettings,
    resetSettings,
    openDataDirectory,
    clearSearchHistory
  } = useSettingsStore()

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

  return (
    <div className="content-area">
      {/* 搜索设置 */}
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

      {/* 快捷键设置 */}
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

      {/* 外观设置 */}
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

      {/* 启动设置 */}
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
  )
}

