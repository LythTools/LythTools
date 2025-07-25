import { app, BrowserWindow, globalShortcut, screen, ipcMain, shell, nativeImage } from 'electron'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { promises as fs, existsSync } from 'fs'
import { exec } from 'child_process'
import { promisify } from 'util'
import { isDev } from './utils.js'

const execAsync = promisify(exec)

// 图标缓存
const iconCache = new Map<string, string>()

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
    height: 600, // 增加高度以适应设置页面内容
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
    center: false, // 禁用自动居中
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
    // 开发环境自动打开开发者工具
    mainWindow.webContents.openDevTools({ mode: 'detach' })
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

// 系统搜索功能
interface ApplicationInfo {
  name: string
  path: string
  icon?: string
  type: 'application'
}

interface FileInfo {
  name: string
  path: string
  type: 'file' | 'folder'
  size?: number
  modified?: Date
}

// 搜索已安装的应用程序
ipcMain.handle('search-applications', async () => {
  const applications: ApplicationInfo[] = []

  try {
    if (process.platform === 'win32') {
      // Windows: 搜索开始菜单和程序文件夹
      const commonPaths = [
        'C:\\ProgramData\\Microsoft\\Windows\\Start Menu\\Programs',
        'C:\\Users\\' + process.env.USERNAME + '\\AppData\\Roaming\\Microsoft\\Windows\\Start Menu\\Programs',
        'C:\\Program Files',
        'C:\\Program Files (x86)'
      ]

      for (const basePath of commonPaths) {
        if (existsSync(basePath)) {
          await searchApplicationsInPath(basePath, applications)
        }
      }
    }
  } catch (error) {
    console.error('搜索应用程序时出错:', error)
  }

  return applications
})

async function searchApplicationsInPath(dirPath: string, applications: ApplicationInfo[]) {
  try {
    const items = await fs.readdir(dirPath, { withFileTypes: true })

    for (const item of items) {
      const fullPath = join(dirPath, item.name)

      if (item.isFile() && (item.name.endsWith('.exe') || item.name.endsWith('.lnk'))) {
        const name = item.name.replace(/\.(exe|lnk)$/, '')

        // 尝试获取应用程序图标
        let iconPath: string | undefined = undefined
        try {
          if (item.name.endsWith('.exe')) {
            // 对于exe文件，图标就是文件本身
            iconPath = fullPath
          }
        } catch (error) {
          // 忽略图标获取错误
        }

        applications.push({
          name,
          path: fullPath,
          icon: iconPath,
          type: 'application'
        })
      } else if (item.isDirectory() && applications.length < 200) {
        // 递归搜索子目录，但限制数量避免过多结果
        await searchApplicationsInPath(fullPath, applications)
      }
    }
  } catch (error) {
    // 忽略权限错误等
  }
}

// 搜索文件
ipcMain.handle('search-files', async (_event, query: string, maxResults = 50) => {
  const files: FileInfo[] = []

  try {
    if (process.platform === 'win32') {
      // Windows: 使用dir命令搜索
      const searchPaths = [
        process.env.USERPROFILE + '\\Desktop',
        process.env.USERPROFILE + '\\Documents',
        process.env.USERPROFILE + '\\Downloads'
      ]

      for (const searchPath of searchPaths) {
        if (existsSync(searchPath)) {
          await searchFilesInPath(searchPath, query, files, maxResults)
          if (files.length >= maxResults) break
        }
      }
    }
  } catch (error) {
    console.error('搜索文件时出错:', error)
  }

  return files.slice(0, maxResults)
})

async function searchFilesInPath(dirPath: string, query: string, files: FileInfo[], maxResults: number) {
  try {
    const items = await fs.readdir(dirPath, { withFileTypes: true })

    for (const item of items) {
      if (files.length >= maxResults) break

      const fullPath = join(dirPath, item.name)

      // 模糊匹配文件名
      if (item.name.toLowerCase().includes(query.toLowerCase())) {
        const stats = await fs.stat(fullPath)
        files.push({
          name: item.name,
          path: fullPath,
          type: item.isDirectory() ? 'folder' : 'file',
          size: item.isFile() ? stats.size : undefined,
          modified: stats.mtime
        })
      }
    }
  } catch (error) {
    // 忽略权限错误等
  }
}

// 快速跨平台图标数据库
const iconDatabase: { [key: string]: string } = {
  // 浏览器
  'chrome': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjQiIGN5PSIyNCIgcj0iMjAiIGZpbGw9IiM0Mjg1RjQiLz4KPGNpcmNsZSBjeD0iMjQiIGN5PSIyNCIgcj0iMTAiIGZpbGw9IndoaXRlIi8+CjxjaXJjbGUgY3g9IjI0IiBjeT0iMjQiIHI9IjYiIGZpbGw9IiM0Mjg1RjQiLz4KPC9zdmc+',
  'firefox': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjQiIGN5PSIyNCIgcj0iMjAiIGZpbGw9IiNGRjk1MDAiLz4KPHBhdGggZD0iTTEyIDI0QzEyIDE3LjM3MjYgMTcuMzcyNiAxMiAyNCAxMkMzMC42Mjc0IDEyIDM2IDE3LjM3MjYgMzYgMjQiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMyIvPgo8L3N2Zz4=',
  'edge': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjQiIGN5PSIyNCIgcj0iMjAiIGZpbGw9IiMwMDc4RDQiLz4KPHBhdGggZD0iTTEwIDI0SDM4IiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjMiLz4KPC9zdmc+',

  // 开发工具
  'vscode': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiByeD0iNCIgZmlsbD0iIzAwN0FDQyIvPgo8cGF0aCBkPSJNMTIgMTJIMzZWMzZIMTJWMTJaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4=',
  'code': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiByeD0iNCIgZmlsbD0iIzAwN0FDQyIvPgo8cGF0aCBkPSJNMTIgMTJIMzZWMzZIMTJWMTJaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4=',
  'visual studio': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiByeD0iNCIgZmlsbD0iIzY4MjE3QSIvPgo8cGF0aCBkPSJNMTIgMTJIMzZWMzZIMTJWMTJaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4=',

  // 系统工具
  'notepad': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3QgeD0iOCIgeT0iOCIgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iNCIgZmlsbD0iIzAwN0FDQyIvPgo8cGF0aCBkPSJNMTQgMTZIMzRNMTQgMjJIMzRNMTQgMjhIMjgiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMiIvPgo8L3N2Zz4=',
  'calculator': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiByeD0iNCIgZmlsbD0iIzMzMzMzMyIvPgo8cmVjdCB4PSI4IiB5PSI4IiB3aWR0aD0iMzIiIGhlaWdodD0iOCIgcng9IjIiIGZpbGw9IndoaXRlIi8+CjxyZWN0IHg9IjEwIiB5PSIyMCIgd2lkdGg9IjYiIGhlaWdodD0iNiIgcng9IjEiIGZpbGw9IndoaXRlIi8+CjxyZWN0IHg9IjIxIiB5PSIyMCIgd2lkdGg9IjYiIGhlaWdodD0iNiIgcng9IjEiIGZpbGw9IndoaXRlIi8+CjxyZWN0IHg9IjMyIiB5PSIyMCIgd2lkdGg9IjYiIGhlaWdodD0iNiIgcng9IjEiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPg==',
  'explorer': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiByeD0iNCIgZmlsbD0iI0ZGQzEwNyIvPgo8cGF0aCBkPSJNMTIgMTZIMzZWMzJIMTJWMTZaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4=',

  // Office应用
  'word': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiByeD0iNCIgZmlsbD0iIzI5NTJBMyIvPgo8cGF0aCBkPSJNMTQgMTZIMzRWMzJIMTRWMTZaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4=',
  'excel': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiByeD0iNCIgZmlsbD0iIzIxN0M0NiIvPgo8cGF0aCBkPSJNMTQgMTZIMzRWMzJIMTRWMTZaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4=',

  // 默认图标
  'default': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiByeD0iNCIgZmlsbD0iIzY2NjY2NiIvPgo8cGF0aCBkPSJNMTYgMTZIMzJWMzJIMTZWMTZaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4='
}

// 快速智能图标匹配
const getSmartIcon = (filePath: string): string => {
  const fileName = filePath.toLowerCase()
  const appName = filePath.split(/[\\\/]/).pop()?.toLowerCase() || ''

  // 移除文件扩展名
  const baseName = appName.replace(/\.(exe|lnk)$/, '')

  // 精确匹配
  if (iconDatabase[baseName]) {
    return iconDatabase[baseName]
  }

  // 模糊匹配
  for (const [key, icon] of Object.entries(iconDatabase)) {
    if (key === 'default') continue

    if (fileName.includes(key) || baseName.includes(key)) {
      return icon
    }
  }

  // 特殊匹配规则
  if (fileName.includes('chrome') || baseName.includes('chrome')) {
    return iconDatabase.chrome
  }
  if (fileName.includes('firefox') || baseName.includes('firefox')) {
    return iconDatabase.firefox
  }
  if (fileName.includes('edge') || baseName.includes('edge')) {
    return iconDatabase.edge
  }
  if (fileName.includes('vscode') || fileName.includes('code') || baseName.includes('code')) {
    return iconDatabase.vscode
  }
  if (fileName.includes('notepad') || baseName.includes('notepad')) {
    return iconDatabase.notepad
  }
  if (fileName.includes('calc') || baseName.includes('calc')) {
    return iconDatabase.calculator
  }
  if (fileName.includes('explorer') || baseName.includes('explorer')) {
    return iconDatabase.explorer
  }
  if (fileName.includes('word') || baseName.includes('word')) {
    return iconDatabase.word
  }
  if (fileName.includes('excel') || baseName.includes('excel')) {
    return iconDatabase.excel
  }

  // 返回默认图标
  return iconDatabase.default
}

/**
 * 使用Electron的app.getFileIcon获取文件图标
 */
async function getFileIcon(filePath: string): Promise<string | null> {
  try {
    console.log('获取文件图标:', filePath)

    // 检查缓存
    if (iconCache.has(filePath)) {
      console.log('从缓存返回图标')
      return iconCache.get(filePath)!
    }

    // 使用Electron的app.getFileIcon方法获取系统图标
    const nativeImage = await app.getFileIcon(filePath, { size: 'normal' })

    if (nativeImage && !nativeImage.isEmpty()) {
      // 将NativeImage转换为base64数据URL
      const dataUrl = nativeImage.toDataURL()
      console.log('成功获取系统图标，数据长度:', dataUrl.length)

      // 缓存图标
      iconCache.set(filePath, dataUrl)
      return dataUrl
    } else {
      console.log('系统图标为空，使用智能匹配')
      // 降级到智能图标匹配
      const smartIcon = getSmartIcon(filePath)
      if (smartIcon) {
        iconCache.set(filePath, smartIcon)
        return smartIcon
      }
    }

    return null
  } catch (error) {
    console.error('获取文件图标失败:', error)

    // 错误时降级到智能图标匹配
    try {
      const smartIcon = getSmartIcon(filePath)
      if (smartIcon) {
        iconCache.set(filePath, smartIcon)
        return smartIcon
      }
    } catch (fallbackError) {
      console.error('智能图标匹配也失败:', fallbackError)
    }

    return null
  }
}

/**
 * 同步IPC消息处理器
 */
ipcMain.on('sync-message', (event, message) => {
  const { type, ...params } = message

  try {
    switch (type) {
      case 'getFileIcon':
        // 由于同步IPC不支持Promise，我们需要使用同步方式
        // 先检查缓存
        if (iconCache.has(params.path)) {
          event.returnValue = { success: true, data: iconCache.get(params.path) }
          return
        }

        // 对于同步调用，我们优先使用智能图标匹配
        const smartIcon = getSmartIcon(params.path)
        if (smartIcon) {
          iconCache.set(params.path, smartIcon)
          event.returnValue = { success: true, data: smartIcon }
          return
        }

        // 如果智能匹配失败，返回null，前端会使用emoji降级
        event.returnValue = { success: false, data: null }

        // 异步获取真实图标并更新缓存（不阻塞同步调用）
        getFileIcon(params.path).then(icon => {
          if (icon) {
            // 通知前端图标已更新（可选）
            event.sender.send('icon-updated', { path: params.path, icon })
          }
        }).catch(error => {
          console.error('异步获取图标失败:', error)
        })
        break

      default:
        event.returnValue = { success: false, error: 'Unknown message type' }
    }
  } catch (error) {
    console.error('同步IPC处理失败:', error)
    event.returnValue = { success: false, error: error instanceof Error ? error.message : String(error) }
  }
})

// 打开应用程序
ipcMain.handle('open-application', async (_event, path: string) => {
  try {
    if (path.endsWith('.lnk')) {
      // 快捷方式
      await shell.openPath(path)
    } else {
      // 可执行文件
      await execAsync(`"${path}"`)
    }
    return true
  } catch (error) {
    console.error('打开应用程序失败:', error)
    return false
  }
})

// 打开文件或文件夹
ipcMain.handle('open-file', async (_event, path: string) => {
  try {
    await shell.openPath(path)
    return true
  } catch (error) {
    console.error('打开文件失败:', error)
    return false
  }
})
