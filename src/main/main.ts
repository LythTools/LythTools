import { app, BrowserWindow, globalShortcut, screen, ipcMain } from 'electron'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { isDev } from './utils.js'

// ES模块中获取__dirname的替代方案
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 保持对窗口对象的全局引用，避免被垃圾回收
let mainWindow: BrowserWindow | null = null

/**
 * 创建主窗口
 */
function createWindow(): void {
  // 获取主显示器信息
  const primaryDisplay = screen.getPrimaryDisplay()
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize

  // 创建浏览器窗口
  mainWindow = new BrowserWindow({
    width: 800,
    height: 60,
    x: Math.round((screenWidth - 800) / 2), // 居中显示
    y: Math.round(screenHeight * 0.3), // 距离顶部30%的位置
    frame: false, // 无边框
    titleBarStyle: 'hidden', // 隐藏标题栏（macOS）
    transparent: true, // 透明背景
    alwaysOnTop: true, // 始终置顶
    resizable: false, // 不可调整大小
    movable: true, // 可移动
    minimizable: false, // 不可最小化
    maximizable: false, // 不可最大化
    closable: true, // 可关闭
    skipTaskbar: true, // 不显示在任务栏
    show: false, // 初始不显示，等待ready-to-show事件
    hasShadow: false, // 禁用窗口阴影
    thickFrame: false, // 禁用厚边框
    webPreferences: {
      nodeIntegration: false, // 安全考虑，禁用node集成
      contextIsolation: true, // 启用上下文隔离
      preload: join(__dirname, '../preload/preload.js'), // 预加载脚本
    },
  })

  // 加载应用
  if (isDev) {
    // 开发环境加载本地服务器
    mainWindow.loadURL('http://localhost:5173')
    // 开发环境可以按F12打开开发者工具，但不自动打开
    // mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    // 生产环境加载打包后的文件
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // 窗口准备显示时显示窗口
  mainWindow.once('ready-to-show', () => {
    if (mainWindow) {
      mainWindow.show()
      mainWindow.focus()
      // 确保窗口保持无边框状态
      mainWindow.setMenuBarVisibility(false)
    }
  })

  // 窗口关闭时的处理
  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // 失去焦点时隐藏窗口（类似Wox行为）
  mainWindow.on('blur', () => {
    if (mainWindow && !isDev) {
      mainWindow.hide()
    }
  })

  // 确保窗口始终保持正确的状态
  mainWindow.on('focus', () => {
    if (mainWindow) {
      mainWindow.setMenuBarVisibility(false)
    }
  })

  // 防止窗口被意外修改
  mainWindow.on('show', () => {
    if (mainWindow) {
      mainWindow.setMenuBarVisibility(false)
    }
  })
}

/**
 * 显示/隐藏窗口
 */
function toggleWindow(): void {
  if (!mainWindow) {
    createWindow()
    return
  }

  if (mainWindow.isVisible()) {
    mainWindow.hide()
  } else {
    mainWindow.show()
    mainWindow.focus()
  }
}

/**
 * 应用准备就绪时的处理
 */
app.whenReady().then(() => {
  createWindow()

  // 注册全局快捷键 Alt+Space（类似Wox）
  const ret = globalShortcut.register('Alt+Space', () => {
    toggleWindow()
  })

  if (!ret) {
    console.log('全局快捷键注册失败')
  }

  // macOS特殊处理
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

/**
 * 所有窗口关闭时的处理
 */
app.on('window-all-closed', () => {
  // macOS上除非用户明确退出，否则应用和菜单栏保持活跃
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

/**
 * 应用即将退出时的处理
 */
app.on('will-quit', () => {
  // 注销所有快捷键
  globalShortcut.unregisterAll()
})

/**
 * IPC通信处理
 */
ipcMain.handle('app-quit', () => {
  app.quit()
})

ipcMain.handle('window-hide', () => {
  if (mainWindow) {
    mainWindow.hide()
  }
})

ipcMain.handle('window-minimize', () => {
  if (mainWindow) {
    mainWindow.minimize()
  }
})
