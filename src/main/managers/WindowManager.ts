/**
 * 窗口管理器
 */
import { BrowserWindow, screen } from 'electron'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { isDev } from '../utils.js'
import { WINDOW_CONFIG } from '../../shared/constants/appConstants.js'

// ES模块中获取__dirname的替代方案
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export class WindowManager {
  private mainWindow: BrowserWindow | null = null
  private isResizing = false

  /**
   * 创建主窗口
   */
  createWindow(): BrowserWindow {
    // 获取主显示器信息
    const primaryDisplay = screen.getPrimaryDisplay()
    const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize

    // 创建浏览器窗口
    this.mainWindow = new BrowserWindow({
      width: WINDOW_CONFIG.DEFAULT_WIDTH,
      height: WINDOW_CONFIG.DEFAULT_HEIGHT,
      x: Math.round((screenWidth - WINDOW_CONFIG.DEFAULT_WIDTH) / 2),
      y: Math.round(screenHeight * 0.3),
      frame: false,
      titleBarStyle: 'hidden',
      transparent: true,
      alwaysOnTop: true,
      resizable: true,
      movable: true,
      minimizable: false,
      maximizable: false,
      closable: true,
      skipTaskbar: true,
      show: false,
      hasShadow: false,
      thickFrame: false,
      center: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        // 运行于 dist/main/managers，需回退两级到 dist，再进入 preload
        preload: join(__dirname, '../../preload/preload.js'),
      },
    })

    this.setupWindowEvents()
    this.loadContent()

    return this.mainWindow
  }

  /**
   * 设置窗口事件
   */
  private setupWindowEvents(): void {
    if (!this.mainWindow) return

    // 窗口准备显示时显示窗口
    this.mainWindow.once('ready-to-show', () => {
      if (this.mainWindow) {
        this.mainWindow.show()
        this.mainWindow.focus()
        this.mainWindow.setMenuBarVisibility(false)
      }
    })

    // 窗口关闭时的处理
    this.mainWindow.on('closed', () => {
      this.mainWindow = null
    })

    // 失去焦点时隐藏窗口
    this.mainWindow.on('blur', () => {
      if (this.mainWindow && !isDev) {
        this.mainWindow.hide()
      }
    })

    // 确保窗口始终保持正确的状态
    this.mainWindow.on('focus', () => {
      if (this.mainWindow) {
        this.mainWindow.setMenuBarVisibility(false)
      }
    })

    this.mainWindow.on('show', () => {
      if (this.mainWindow) {
        this.mainWindow.setMenuBarVisibility(false)
      }
    })

    // 防止用户手动调整窗口大小
    this.mainWindow.on('will-resize', (event, newBounds) => {
      if (!this.isResizing && this.mainWindow) {
        const [currentWidth, currentHeight] = this.mainWindow.getSize()

        // 如果只是位置改变（拖动），允许操作
        if (newBounds.width === currentWidth && newBounds.height === currentHeight) {
          return // 允许拖动
        }

        // 如果是大小改变，阻止用户手动调整
        event.preventDefault()
      }
    })
  }

  /**
   * 加载内容
   */
  private loadContent(): void {
    if (!this.mainWindow) return

    if (isDev) {
      // 开发环境加载本地服务器
      this.mainWindow.loadURL('http://localhost:5174')
      // 开发环境自动打开开发者工具
      this.mainWindow.webContents.openDevTools({ mode: 'detach' })
    } else {
      // 生产环境加载打包后的文件
      this.mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
    }
  }

  /**
   * 显示/隐藏窗口
   */
  toggleWindow(): void {
    if (!this.mainWindow) {
      this.createWindow()
      return
    }

    if (this.mainWindow.isVisible()) {
      this.mainWindow.hide()
    } else {
      this.mainWindow.show()
      this.mainWindow.focus()
    }
  }

  /**
   * 调整窗口大小
   */
  resizeWindow(options: { 
    isMenuOpen?: boolean
    resultCount?: number
    targetHeight?: number
    installedExtensionCount?: number
  }): void {
    if (!this.mainWindow) return

    let newHeight: number = WINDOW_CONFIG.DEFAULT_HEIGHT

    if (options.targetHeight) {
      newHeight = options.targetHeight
    } else if (options.isMenuOpen) {
      newHeight = 672
    } else if (options.resultCount && options.resultCount > 0) {
      // 计算网格高度的逻辑
      const baseHeight = WINDOW_CONFIG.DEFAULT_HEIGHT
      const containerMargin = 8
      const containerPadding = 32
      const gridGap = 10
      const itemMinHeight = 90
      const availableWidth = WINDOW_CONFIG.DEFAULT_WIDTH - 32
      const itemWidth = 100 + 10
      const itemsPerRow = Math.floor(availableWidth / itemWidth)
      const maxVisibleResults = 18
      const borderAndRadius = 4
      const extraBuffer = 18
      
      const visibleResults = Math.min(options.resultCount, maxVisibleResults)
      const rows = Math.ceil(visibleResults / itemsPerRow)
      
      let adjustedItemHeight = itemMinHeight
      if (rows === 1) {
        adjustedItemHeight = 95
      } else if (rows === 2) {
        adjustedItemHeight = 92
      } else if (rows === 3) {
        adjustedItemHeight = 101
      }
      
      const gridContentHeight = rows * adjustedItemHeight + (rows - 1) * gridGap
      newHeight = baseHeight + containerMargin + containerPadding + gridContentHeight + borderAndRadius + extraBuffer
      
      console.log(`窗口管理器: 网格计算 - 结果数:${options.resultCount}, 每行:${itemsPerRow}, 行数:${rows}, 最终高度:${newHeight}`)
      
      // 限制最大高度
      const maxHeight = 520
      newHeight = Math.min(newHeight, maxHeight)
    }

    const [currentWidth] = this.mainWindow.getSize()

    // 设置标志表示这是程序化调整
    this.isResizing = true
    this.mainWindow.setSize(currentWidth, newHeight, true)

    // 短暂延迟后重置标志
    setTimeout(() => {
      this.isResizing = false
    }, 100)

    console.log(`窗口管理器: 窗口大小调整为 ${currentWidth}x${newHeight}`)
  }

  /**
   * 获取主窗口
   */
  getMainWindow(): BrowserWindow | null {
    return this.mainWindow
  }

  /**
   * 隐藏窗口
   */
  hideWindow(): void {
    if (this.mainWindow) {
      this.mainWindow.hide()
    }
  }

  /**
   * 最小化窗口
   */
  minimizeWindow(): void {
    if (this.mainWindow) {
      this.mainWindow.minimize()
    }
  }

  /**
   * 销毁窗口
   */
  destroy(): void {
    if (this.mainWindow) {
      this.mainWindow.destroy()
      this.mainWindow = null
    }
  }
}
