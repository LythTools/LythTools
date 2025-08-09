import { useCallback } from 'react'

/**
 * 托盘管理Hook
 */
export const useTray = () => {
  // 显示托盘通知
  const showNotification = useCallback(async (title: string, body: string) => {
    try {
      if (window.electronAPI?.trayShowNotification) {
        await window.electronAPI.trayShowNotification(title, body)
      }
    } catch (error) {
      console.error('显示托盘通知失败:', error)
    }
  }, [])

  // 更新托盘图标状态
  const updateTrayIcon = useCallback(async (isActive: boolean = true) => {
    try {
      if (window.electronAPI?.trayUpdateIcon) {
        await window.electronAPI.trayUpdateIcon(isActive)
      }
    } catch (error) {
      console.error('更新托盘图标失败:', error)
    }
  }, [])

  // 显示成功通知
  const showSuccessNotification = useCallback((message: string) => {
    showNotification('LythTools', `✅ ${message}`)
  }, [showNotification])

  // 显示错误通知
  const showErrorNotification = useCallback((message: string) => {
    showNotification('LythTools', `❌ ${message}`)
  }, [showNotification])

  // 显示信息通知
  const showInfoNotification = useCallback((message: string) => {
    showNotification('LythTools', `ℹ️ ${message}`)
  }, [showNotification])

  return {
    showNotification,
    updateTrayIcon,
    showSuccessNotification,
    showErrorNotification,
    showInfoNotification
  }
}
