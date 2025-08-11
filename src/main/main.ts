import { app, ipcMain, shell, dialog } from 'electron'
import { exec } from 'child_process'
import { promisify } from 'util'
import { TrayManager } from './trayManager.js'
import { ExtensionManager } from './extensionManager.js'
import { WindowManager } from './managers/WindowManager.js'
import { IconManager } from './managers/IconManager.js'
import { HotkeyManager } from './managers/HotkeyManager.js'
import { SearchManager } from './managers/SearchManager.js'

const execAsync = promisify(exec)

// 管理器实例
let windowManager: WindowManager | null = null
let iconManager: IconManager | null = null
let hotkeyManager: HotkeyManager | null = null
let searchManager: SearchManager | null = null
let trayManager: TrayManager | null = null
let extensionManager: ExtensionManager | null = null

/**
 * 初始化所有管理器
 */
function initializeManagers(): void {
  console.log('主进程: 初始化管理器...')
  
  // 创建窗口管理器
  windowManager = new WindowManager()
  
  // 创建图标管理器
  iconManager = new IconManager()
  
  // 创建快捷键管理器
  hotkeyManager = new HotkeyManager(windowManager)
  
  // 创建搜索管理器
  searchManager = new SearchManager()
  
  // 创建系统托盘
  const mainWindow = windowManager.createWindow()
    if (mainWindow) {
    trayManager = new TrayManager(mainWindow)
    
    // 设置窗口关闭事件处理
  mainWindow.on('close', (event) => {
    if (trayManager) {
      event.preventDefault()
        mainWindow.hide()
        
        if (app.isReady()) {
      trayManager.showNotification(
        'LythTools',
        '应用已最小化到系统托盘，点击托盘图标可重新打开'
      )
    }
      }
    })
  }
}

/**
 * 应用程序入口
 */
app.whenReady().then(async () => {
  console.log('主进程: 应用程序启动...')

  // 初始化所有管理器
  initializeManagers()

  // 注册全局快捷键
  if (hotkeyManager) {
    hotkeyManager.registerDefaultHotkeys()
  }

  // 初始化扩展管理器
  extensionManager = new ExtensionManager()
  await extensionManager.initialize()

  // 将扩展贡献变更转发到渲染进程
  extensionManager.onContributionsChanged((extId, contributions) => {
    const mainWindow = windowManager?.getMainWindow()
    if (mainWindow) {
      mainWindow.webContents.send('extensions-contributions-changed', { extensionId: extId, contributions })
    }
  })

  // 针对macOS的特殊处理
  app.on('activate', () => {
    console.log('主进程: 激活应用...')
    if (!windowManager?.getMainWindow()) {
      initializeManagers()
    }
  })

  console.log('主进程: 应用程序就绪')
})

/**
 * 所有窗口关闭时的处理
 */
app.on('window-all-closed', () => {
  // macOS和其他平台的处理
  if (process.platform !== 'darwin') {
  if (!trayManager) {
      app.quit()
    }
  }
  // 如果有托盘，什么都不做，让应用继续在后台运行
})

/**
 * 应用即将退出时的处理
 */
app.on('will-quit', () => {
  // 清理所有管理器
  hotkeyManager?.destroy()
  windowManager?.destroy()
  iconManager?.clearCache()
  searchManager?.clearApplicationCache()
  trayManager?.destroy()
  
  console.log('主进程: 应用程序清理完成')
})

/**
 * IPC通信处理
 */
ipcMain.handle('app-quit', () => {
  app.quit()
})

ipcMain.handle('window-hide', () => {
  windowManager?.hideWindow()
})

ipcMain.handle('window-minimize', () => {
  windowManager?.minimizeWindow()
})

// 窗口大小调整
ipcMain.handle('window-resize', (_event, options: { 
  isMenuOpen?: boolean
  resultCount?: number
  targetHeight?: number
  installedExtensionCount?: number
}) => {
  windowManager?.resizeWindow(options)
})

// 搜索已安装的应用程序
ipcMain.handle('search-applications', async () => {
  return await searchManager?.searchApplications() || []
})

// 搜索文件
ipcMain.handle('search-files', async (_event, query: string) => {
  return await searchManager?.searchFiles(query) || []
})

// 获取文件图标
ipcMain.handle('get-file-icon', async (_event, filePath: string) => {
  try {
    // 先尝试缓存/系统图标
    const icon = await iconManager?.getFileIcon(filePath)
    if (icon) return icon
    // 若仍失败，尝试用 shell.showItemInFolder 触发系统解析（不会阻塞等待结果）
    try { shell.showItemInFolder(filePath) } catch {}
    return null
  } catch {
    return null
  }
})

// 打开应用程序/文件/URL
ipcMain.handle('open-application', async (_event, pathOrUrl: string) => {
  try {
    // 优先用 shell.openPath 打开本地可执行/文件，否则尝试外部URL
    const openResult = await shell.openPath(pathOrUrl)
    if (openResult) {
      // 非空字符串表示错误，回退到 openExternal（URL 场景）
      await shell.openExternal(pathOrUrl)
    }
    return true
  } catch {
    try {
      await shell.openExternal(pathOrUrl)
      return true
    } catch {
      return false
    }
  }
})

ipcMain.handle('open-file', async (_event, pathOrUrl: string) => {
  try {
    const openResult = await shell.openPath(pathOrUrl)
    if (openResult) {
      // 如果 openPath 失败，尝试外部（浏览器URL）
      await shell.openExternal(pathOrUrl)
    }
    return true
  } catch {
    try {
      await shell.openExternal(pathOrUrl)
      return true
    } catch {
      return false
    }
  }
})

// 快捷键管理
ipcMain.handle('hotkeys-update', (_event, hotkeys: any) => {
  return hotkeyManager?.updateHotkeys(hotkeys) || false
})

ipcMain.handle('hotkeys-get-current', () => {
  return hotkeyManager?.getCurrentHotkeys() || {}
})

// 系统操作
ipcMain.handle('open-external', (_event, url: string) => {
  shell.openExternal(url)
})

ipcMain.handle('show-item-in-folder', (_event, path: string) => {
  shell.showItemInFolder(path)
})

ipcMain.handle('open-path', (_event, path: string) => {
  shell.openPath(path)
})

ipcMain.handle('select-directory', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
    title: '选择文件夹'
  })
  
  if (result.canceled || result.filePaths.length === 0) {
    return { success: false, path: null }
  }
  
  return { success: true, path: result.filePaths[0] }
})

ipcMain.handle('select-avatar-image', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    title: '选择头像图片',
    filters: [
      { name: '图片文件', extensions: ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'] },
      { name: '所有文件', extensions: ['*'] }
    ]
  })
  
  if (result.canceled || result.filePaths.length === 0) {
    return { success: false, path: null }
  }
  
  return { success: true, path: result.filePaths[0] }
})

ipcMain.handle('execute-command', async (_event, command: string) => {
  try {
    const { stdout, stderr } = await execAsync(command)
    return { success: true, output: stdout, error: stderr }
  } catch (error: any) {
    return { success: false, output: '', error: error.message }
  }
})

// 扩展管理IPC处理会在extensionManager.ts中设置