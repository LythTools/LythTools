/**
 * 个人信息区域组件
 */
import React, { useState } from 'react'
import { useSettingsStore } from '../../stores/settingsStore'
import { formatUsageTime } from '../../../../shared/utils/formatUtils'

interface ProfileSectionProps {
  // 可以通过props传递需要的状态和回调
}

export const ProfileSection: React.FC<ProfileSectionProps> = () => {
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [originalUserInfo, setOriginalUserInfo] = useState({})

  const {
    userInfo,
    usageStats,
    updateUserInfo,
  } = useSettingsStore()

  // 处理头像上传
  const handleAvatarUpload = () => {
    // 创建隐藏的文件选择器
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.style.display = 'none'
    
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        // 创建本地URL用于显示图片
        const avatarUrl = URL.createObjectURL(file)
        updateUserInfo({ avatar: avatarUrl })
      }
      // 清理input元素
      document.body.removeChild(input)
    }
    
    // 添加到DOM并触发点击
    document.body.appendChild(input)
    input.click()
  }

  const handleSaveProfile = () => {
    setIsEditingProfile(false)
    // 这里可以添加保存到后端的逻辑
  }

  const handleCancelEdit = () => {
    setIsEditingProfile(false)
    // 恢复原始数据
    updateUserInfo(originalUserInfo)
  }

  const handleStartEdit = () => {
    setOriginalUserInfo(userInfo)
    setIsEditingProfile(true)
  }

  return (
    <div className="content-area">
      <div className="content-section">
        <h3 className="section-title">👤 用户信息</h3>
        <div className="settings-items">
          {/* 头像设置 */}
          <div className="setting-item">
            <div className="setting-info">
              <span className="setting-name">头像</span>
              <span className="setting-desc">点击头像上传自定义图片</span>
            </div>
            <div 
              className="avatar-setting" 
              onClick={handleAvatarUpload}
            >
              <div className="current-avatar">
                {userInfo.avatar.startsWith('blob:') || userInfo.avatar.startsWith('file://') ? (
                  <img src={userInfo.avatar} alt="头像" className="avatar-image" />
                ) : (
                  userInfo.avatar
                )}
              </div>
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
              <div className="setting-value editable" onClick={handleStartEdit}>
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
              <div className="setting-value editable" onClick={handleStartEdit}>
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
                  onClick={handleSaveProfile}
                >
                  保存
                </button>
                <button
                  className="setting-button secondary"
                  onClick={handleCancelEdit}
                >
                  取消
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 使用统计 */}
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
  )
}

