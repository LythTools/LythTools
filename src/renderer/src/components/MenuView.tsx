import React, { useState } from 'react'
import { ProfileSection } from './sections/ProfileSection'
import { SettingsSection } from './sections/SettingsSection'
import { PluginManagement } from './sections/PluginManagement'
import { ToolsSection } from './sections/ToolsSection'

interface MenuViewProps { }

const MenuView: React.FC<MenuViewProps> = () => {
  const [activeTab, setActiveTab] = useState<'plugins' | 'profile' | 'settings' | 'tools'>('plugins')

  return (
    <>
      <div className="inline-menu-container">
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

          {/* 根据活跃标签页渲染对应的内容区域 */}
          {activeTab === 'plugins' && <PluginManagement />}
          {activeTab === 'profile' && <ProfileSection />}
          {activeTab === 'settings' && <SettingsSection />}
          {activeTab === 'tools' && <ToolsSection />}

        </div>
      </div>
    </>
  )
}

export default MenuView