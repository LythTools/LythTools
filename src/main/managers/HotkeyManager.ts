/**
 * 快捷键管理器
 */
import { globalShortcut } from 'electron'
import { HOTKEY_CONFIG } from '../../shared/constants/appConstants.js'
import { WindowManager } from './WindowManager.js'

export class HotkeyManager {
  private windowManager: WindowManager
  private currentHotkeys: {
    globalToggle?: string
    quickCalculator?: string
    fileSearch?: string
  } = {}

  constructor(windowManager: WindowManager) {
    this.windowManager = windowManager
  }

  /**
   * 注册默认快捷键
   */
  registerDefaultHotkeys(): boolean {
    console.log('快捷键管理器: 注册默认快捷键')

    // 注册全局唤起快捷键
    const initialToggle = this.currentHotkeys.globalToggle || HOTKEY_CONFIG.GLOBAL_TOGGLE
    const success = globalShortcut.register(initialToggle, () => {
      this.windowManager.toggleWindow()
    })

    if (success) {
      this.currentHotkeys.globalToggle = initialToggle
      console.log(`快捷键管理器: 成功注册全局唤起快捷键: ${initialToggle}`)
      return true
    } else {
      console.error('快捷键管理器: 全局快捷键注册失败')
      return false
    }
  }

  /**
   * 更新快捷键配置
   */
  updateHotkeys(hotkeys: { 
    globalToggle?: string
    quickCalculator?: string
    fileSearch?: string 
  }): boolean {
    try {
      console.log('快捷键管理器: 更新快捷键:', hotkeys)

      // 先注销所有快捷键
      this.unregisterAll()

      // 全局唤起快捷键
      const toggle = hotkeys.globalToggle || this.currentHotkeys.globalToggle || HOTKEY_CONFIG.GLOBAL_TOGGLE
      const toggleSuccess = globalShortcut.register(toggle, () => {
        this.windowManager.toggleWindow()
      })
      
      if (!toggleSuccess) {
        console.warn(`快捷键管理器: 注册全局唤起快捷键失败: ${toggle}`)
      } else {
        this.currentHotkeys.globalToggle = toggle
      }

      // 快速计算器快捷键
      if (hotkeys.quickCalculator) {
        const calcSuccess = globalShortcut.register(hotkeys.quickCalculator, () => {
          const mainWindow = this.windowManager.getMainWindow()
          if (!mainWindow) return
          
          mainWindow.show()
          mainWindow.focus()
          
          // 向渲染进程发送进入计算模式事件
          mainWindow.webContents.send('enter-calculator-mode')
        })
        
        if (!calcSuccess) {
          console.warn(`快捷键管理器: 注册快速计算快捷键失败: ${hotkeys.quickCalculator}`)
        } else {
          this.currentHotkeys.quickCalculator = hotkeys.quickCalculator
        }
      }

      // 文件搜索快捷键
      if (hotkeys.fileSearch) {
        const fileSuccess = globalShortcut.register(hotkeys.fileSearch, () => {
          const mainWindow = this.windowManager.getMainWindow()
          if (!mainWindow) return
          
          mainWindow.show()
          mainWindow.focus()
          
          // 向渲染进程发送进入文件搜索模式事件
          mainWindow.webContents.send('enter-file-search-mode')
        })
        
        if (!fileSuccess) {
          console.warn(`快捷键管理器: 注册文件搜索快捷键失败: ${hotkeys.fileSearch}`)
        } else {
          this.currentHotkeys.fileSearch = hotkeys.fileSearch
        }
      }

      return true
    } catch (error) {
      console.error('快捷键管理器: 更新快捷键失败:', error)
      return false
    }
  }

  /**
   * 检查快捷键是否已被占用
   */
  isHotkeyRegistered(hotkey: string): boolean {
    return globalShortcut.isRegistered(hotkey)
  }

  /**
   * 获取当前注册的快捷键
   */
  getCurrentHotkeys(): typeof this.currentHotkeys {
    return { ...this.currentHotkeys }
  }

  /**
   * 验证快捷键格式
   */
  validateHotkey(hotkey: string): boolean {
    // 简单的快捷键格式验证
    const validModifiers = ['Ctrl', 'Alt', 'Shift', 'Meta', 'Command', 'Cmd']
    const parts = hotkey.split('+').map(part => part.trim())
    
    if (parts.length < 2) {
      return false
    }
    
    // 至少需要一个修饰键
    const hasModifier = parts.some(part => validModifiers.includes(part))
    if (!hasModifier) {
      return false
    }
    
    // 最后一个应该是按键
    const lastPart = parts[parts.length - 1]
    if (validModifiers.includes(lastPart)) {
      return false
    }
    
    return true
  }

  /**
   * 获取快捷键建议
   */
  getHotkeySuggestions(): string[] {
    return [
      'Alt+Space',
      'Ctrl+Alt+L',
      'Ctrl+Shift+F',
      'Alt+Q',
      'Ctrl+`',
      'Alt+`',
      'F1',
      'F12'
    ]
  }

  /**
   * 注销所有快捷键
   */
  unregisterAll(): void {
    try {
      globalShortcut.unregisterAll()
      console.log('快捷键管理器: 已注销所有快捷键')
    } catch (error) {
      console.error('快捷键管理器: 注销快捷键失败:', error)
    }
  }

  /**
   * 销毁快捷键管理器
   */
  destroy(): void {
    this.unregisterAll()
    this.currentHotkeys = {}
  }

  /**
   * 获取系统平台特定的快捷键映射
   */
  getPlatformHotkeys(): Record<string, string> {
    const platform = process.platform
    
    switch (platform) {
      case 'darwin': // macOS
        return {
          'Ctrl+Space': 'Cmd+Space',
          'Ctrl+Alt+L': 'Cmd+Option+L',
          'Ctrl+Shift+F': 'Cmd+Shift+F'
        }
      case 'win32': // Windows
        return {
          'Cmd+Space': 'Ctrl+Space',
          'Cmd+Option+L': 'Ctrl+Alt+L',
          'Cmd+Shift+F': 'Ctrl+Shift+F'
        }
      default: // Linux等
        return {}
    }
  }

  /**
   * 转换快捷键为平台特定格式
   */
  convertToPlatformHotkey(hotkey: string): string {
    const mappings = this.getPlatformHotkeys()
    return mappings[hotkey] || hotkey
  }
}

