import { app, BrowserWindow, globalShortcut, screen, ipcMain, shell, nativeImage, dialog } from 'electron'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { promises as fs, existsSync } from 'fs'
import { exec } from 'child_process'
import { promisify } from 'util'
import { isDev } from './utils.js'
import { TrayManager } from './trayManager.js'
import { ExtensionManager } from './extensionManager.js'

const execAsync = promisify(exec)

// 图标缓存
const iconCache = new Map<string, string>()

// ES模块中获取__dirname的替代方案
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 保持对窗口对象的全局引用，避免被垃圾回收
let mainWindow: BrowserWindow | null = null
let trayManager: TrayManager | null = null
let extensionManager: ExtensionManager | null = null

// 当前注册的全局快捷键（用于管理更新）
let currentHotkeys: {
  globalToggle?: string
  quickCalculator?: string
  fileSearch?: string
} = {}



// 标志位，用于区分程序化调整和用户手动调整
let isResizing = false

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
    height: 80, // 默认只显示搜索框的高度
    x: Math.round((screenWidth - 800) / 2), // 居中显示
    y: Math.round(screenHeight * 0.3), // 距离顶部30%的位置
    frame: false, // 无边框
    titleBarStyle: 'hidden', // 隐藏标题栏（macOS）
    transparent: true, // 透明背景
    alwaysOnTop: true, // 始终置顶
    resizable: true, // 允许程序化调整大小，但会通过其他方式限制用户手动调整
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
    mainWindow.loadURL('http://localhost:5174')
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

  // 窗口关闭时隐藏到托盘而不是退出
  mainWindow.on('close', (event) => {
    if (trayManager) {
      event.preventDefault()
      mainWindow?.hide()
      // 首次隐藏到托盘时显示提示
      if (!app.isReady()) return
      trayManager.showNotification(
        'LythTools',
        '应用已最小化到系统托盘，点击托盘图标可重新打开'
      )
    }
  })

  // 防止用户手动调整窗口大小，但允许程序化调整和拖动
  mainWindow.on('will-resize', (event, newBounds) => {
    if (!isResizing && mainWindow) {
      // 获取当前窗口大小
      const [currentWidth, currentHeight] = mainWindow.getSize()

      // 如果只是位置改变（拖动），允许操作
      if (newBounds.width === currentWidth && newBounds.height === currentHeight) {
        return // 允许拖动
      }

      // 如果是大小改变，阻止用户手动调整
      event.preventDefault()
    }
  })

  // 初始化系统托盘
  if (!trayManager) {
    trayManager = new TrayManager(mainWindow)
  }
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
 * 应用程序入口
 */
app.whenReady().then(async () => {
  console.log('主进程: 应用程序启动...')

  // 创建主窗口
  createWindow()

  // 注册全局快捷键 Alt+Space（类似Wox）
  // 先尝试从 settingsStore 读取用户设置的快捷键
  const initialToggle = currentHotkeys.globalToggle || 'Alt+Space'
  const ret = globalShortcut.register(initialToggle, () => {
    toggleWindow()
  })

  if (!ret) {
    console.log('全局快捷键注册失败')
  }

  // 记录默认快捷键
  currentHotkeys.globalToggle = initialToggle

  // 创建系统托盘
  if (mainWindow) {
    trayManager = new TrayManager(mainWindow)
  }

  // 初始化扩展管理器
  extensionManager = new ExtensionManager()
  // 设置原始文件搜索提供者
  extensionManager.setOriginalFileSearchProvider(originalFileSearch)
  await extensionManager.initialize()

  // 将扩展贡献变更转发到渲染进程
  extensionManager.onContributionsChanged((extId, contributions) => {
    if (mainWindow) {
      mainWindow.webContents.send('extensions-contributions-changed', { extensionId: extId, contributions })
    }
  })

  // 针对macOS的特殊处理
  app.on('activate', () => {
    console.log('主进程: 激活应用...')
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })

  console.log('主进程: 应用程序就绪')
})

/**
 * 所有窗口关闭时的处理
 */
app.on('window-all-closed', () => {
  // 有托盘时不退出应用，让应用在后台运行
  if (!trayManager) {
    // 如果没有托盘，按原来的逻辑处理
    if (process.platform !== 'darwin') {
      app.quit()
    }
  }
  // 如果有托盘，什么都不做，让应用继续在后台运行
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

// 窗口大小调整
ipcMain.handle('window-resize', (_event, options: { 
  isMenuOpen?: boolean
  resultCount?: number
  targetHeight?: number
  installedExtensionCount?: number
}) => {
  if (mainWindow) {
    let newHeight = 80 // 默认搜索框高度

    if (options.targetHeight) {
      // 如果指定了具体高度，直接使用
      newHeight = options.targetHeight
    } else if (options.isMenuOpen) {
      // 菜单打开时使用固定高度
      newHeight = 800
    } else if (options.resultCount && options.resultCount > 0) {
      // 根据搜索结果数量动态计算高度（网格布局）
      const baseHeight = 80 // 搜索框基础高度
      const containerMargin = 8 // results-container margin-top: 0.5rem = 8px
      const containerPadding = 32 // results-grid padding: 1rem * 2 = 32px
      const gridGap = 10 // gap: 0.625rem = 10px
      const itemMinHeight = 90 // result-item min-height: 85px + 实际间距
      // 动态计算每行项目数：窗口宽度800px - padding 32px = 768px可用
      // 每个项目：minmax(100px, 1fr) + gap 10px ≈ 110px
      const availableWidth = 800 - 32 // 减去容器padding
      const itemWidth = 100 + 10 // 最小宽度 + gap
      const itemsPerRow = Math.floor(availableWidth / itemWidth) // 实际每行项目数
      const maxVisibleResults = 18 // 最多显示3行，每行6个 = 18个结果
      const borderAndRadius = 4 // 容器边框和圆角占用的额外空间
      const extraBuffer = 18 // 额外的缓冲高度，确保内容完全显示
      
      const visibleResults = Math.min(options.resultCount, maxVisibleResults)
      const rows = Math.ceil(visibleResults / itemsPerRow)
      
      // 根据行数调整项目高度（不同行数有不同的实际表现）
      let adjustedItemHeight = itemMinHeight
      if (rows === 1) {
        adjustedItemHeight = 95 // 1行时增加5px
      } else if (rows === 2) {
        adjustedItemHeight = 92 // 2行时增加5px（87+5）
      } else if (rows === 3) {
        adjustedItemHeight = 101 // 3行时再增加1px（100+1）
      }
      
      // 计算网格高度：行数 * (项目高度 + 间距) - 最后一行不需要间距
      const gridContentHeight = rows * adjustedItemHeight + (rows - 1) * gridGap
      newHeight = baseHeight + containerMargin + containerPadding + gridContentHeight + borderAndRadius + extraBuffer
      
      console.log(`主进程: 网格计算 - 结果数:${options.resultCount}, 每行:${itemsPerRow}, 行数:${rows}, 调整高度:${adjustedItemHeight}, 网格高度:${gridContentHeight}, 最终高度:${newHeight}`)
      
      // 限制最大高度
      const maxHeight = 520
      newHeight = Math.min(newHeight, maxHeight)
    }

    const [currentWidth] = mainWindow.getSize()

    // 设置标志表示这是程序化调整
    isResizing = true
    mainWindow.setSize(currentWidth, newHeight, true) // 第三个参数为true表示动画调整

    // 短暂延迟后重置标志
    setTimeout(() => {
      isResizing = false
    }, 100)

     console.log(`主进程: 窗口大小调整为 ${currentWidth}x${newHeight}`, {
       resultCount: options.resultCount,
       isMenuOpen: options.isMenuOpen,
       installedExtensionCount: options.installedExtensionCount
     })
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
        const name = item.name.replace(/\.(exe|lnk)$/i, '')

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

// 原始文件搜索函数
async function originalFileSearch(query: string, maxResults = 50): Promise<FileInfo[]> {
  const files: FileInfo[] = []

  try {
    if (process.platform === 'win32') {
      // Windows: 在常见用户目录中搜索
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
}

// 搜索文件
ipcMain.handle('search-files', async (_event, query: string, maxResults = 50) => {
  try {
    // 检查是否有扩展替换了文件搜索功能
    const currentProvider = extensionManager?.getCurrentFileSearchProvider()

    if (currentProvider) {
      // 使用扩展提供的搜索功能
      console.log('使用扩展文件搜索提供者')
      return await currentProvider(query, maxResults)
    } else {
      // 使用原始文件搜索
      console.log('使用原始文件搜索')
      return await originalFileSearch(query, maxResults)
    }
  } catch (error) {
    console.error('文件搜索失败:', error)
    // 降级到原始搜索
    return await originalFileSearch(query, maxResults)
  }
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
  console.log('主进程: 尝试打开文件或文件夹/URL:', path)
  try {
    // 如果是 URL，使用 openExternal
    if (/^https?:\/\//i.test(path)) {
      await shell.openExternal(path)
      return true
    }

    // 本地路径
    const result = await shell.openPath(path)
    if (result) {
      // 当 openPath 返回非空字符串时表示错误信息
      console.warn('openPath 返回信息:', result)
      return false
    }
    return true
  } catch (error) {
    console.error('打开文件/URL失败:', error)
    return false
  }
})

// 托盘相关IPC处理
ipcMain.handle('tray-show-notification', (_event, title: string, body: string) => {
  console.log('主进程: 显示托盘通知')
  trayManager?.showNotification(title, body)
})

ipcMain.handle('tray-update-icon', (_event, isActive: boolean) => {
  console.log('主进程: 更新托盘图标')
  trayManager?.updateTrayIcon(isActive)
})

// 显示通知
ipcMain.handle('showNotification', (_event, message: string) => {
  console.log('主进程: 显示通知:', message)
  if (!mainWindow) return false

  try {
    // 通过向渲染进程发送事件来显示通知
    mainWindow.webContents.send('show-notification', {
      title: 'LythTools',
      body: message
    })
    return true
  } catch (error) {
    console.error('通知发送失败:', error)
    return false
  }
})


// 设置与系统相关 IPC（简实现占位，可逐步完善）
ipcMain.handle('set-theme', (_event, theme: 'auto' | 'light' | 'dark') => {
  console.log('主进程: 设置主题(占位):', theme)
  // 主题应用主要在渲染端，通过 CSS 变量处理，此处保留占位以满足 API 调用
  return true
})

ipcMain.handle('set-transparency', (_event, opacity: number) => {
  console.log('主进程: 设置透明度(占位):', opacity)
  // 透明度在渲染端通过 CSS 变量控制，此处保留占位
  return true
})

ipcMain.handle('set-auto-start', async (_event, enabled: boolean) => {
  console.log('主进程: 设置开机自启(占位):', enabled)
  try {
    app.setLoginItemSettings({ openAtLogin: enabled })
    return true
  } catch (e) {
    console.error('设置开机自启失败:', e)
    return false
  }
})

ipcMain.handle('update-hotkeys', (_event, hotkeys: { globalToggle?: string; quickCalculator?: string; fileSearch?: string }) => {
  console.log('主进程: 更新快捷键:', hotkeys)
  try {
    // 先注销所有
    globalShortcut.unregisterAll()

    // 全局唤起
    const toggle = hotkeys.globalToggle || currentHotkeys.globalToggle || 'Alt+Space'
    const toggleOk = globalShortcut.register(toggle, () => {
      toggleWindow()
    })
    if (!toggleOk) console.warn('注册全局唤起快捷键失败:', toggle)

    // 这里预留其它快捷键位（根据实际需求绑定功能）
    if (hotkeys.quickCalculator) {
      const ok = globalShortcut.register(hotkeys.quickCalculator, () => {
        if (!mainWindow) return
        mainWindow.show()
        mainWindow.focus()
        // 可在此向渲染进程发送进入计算模式事件
      })
      if (!ok) console.warn('注册快速计算快捷键失败:', hotkeys.quickCalculator)
    }

    if (hotkeys.fileSearch) {
      const ok = globalShortcut.register(hotkeys.fileSearch, () => {
        if (!mainWindow) return
        mainWindow.show()
        mainWindow.focus()
        // 可在此向渲染进程发送进入文件搜索/Everything 事件
      })
      if (!ok) console.warn('注册文件搜索快捷键失败:', hotkeys.fileSearch)
    }

    currentHotkeys = { ...currentHotkeys, ...hotkeys }
    return true
  } catch (e) {
    console.error('更新快捷键失败:', e)
    return false
  }
})

ipcMain.handle('export-settings', async (_event, settings: any) => {
  console.log('主进程: 导出设置')
  try {
    const savePath = join(app.getPath('documents'), `lythtools-settings-${Date.now()}.json`)
    await fs.writeFile(savePath, JSON.stringify(settings, null, 2), 'utf-8')
    return { success: true, path: savePath }
  } catch (error) {
    console.error('导出设置失败:', error)
    return { success: false, message: error instanceof Error ? error.message : String(error) }
  }
})

ipcMain.handle('open-data-directory', async () => {
  const userDataPath = app.getPath('userData')
  await shell.openPath(userDataPath)
  return true
})

// 已删除设置 Everything 路径相关 API







// 扩展管理相关IPC处理
ipcMain.handle('extensions-get-installed', () => {
  return extensionManager?.getInstalledExtensions() || []
})

ipcMain.handle('extensions-get-available', () => {
  // TODO: 从扩展商店获取可用扩展
  return []
})

ipcMain.handle('extensions-install', async (_event, extensionPath: string) => {
  if (!extensionManager) {
    return { success: false, message: '扩展管理器未初始化' }
  }
  return await extensionManager.installExtension(extensionPath)
})

ipcMain.handle('extensions-uninstall', async (_event, extensionId: string) => {
  if (!extensionManager) {
    return { success: false, message: '扩展管理器未初始化' }
  }
  return await extensionManager.uninstallExtension(extensionId)
})

ipcMain.handle('extensions-enable', async (_event, extensionId: string) => {
  if (!extensionManager) {
    return { success: false, message: '扩展管理器未初始化' }
  }
  return await extensionManager.enableExtension(extensionId)
})

ipcMain.handle('extensions-disable', async (_event, extensionId: string) => {
  if (!extensionManager) {
    return { success: false, message: '扩展管理器未初始化' }
  }
  return await extensionManager.disableExtension(extensionId)
})

ipcMain.handle('extensions-get-info', (_event, extensionId: string) => {
  return extensionManager?.getExtensionInfo(extensionId) || null
})

// 新增：获取所有扩展贡献（列表项、菜单、窗口）
ipcMain.handle('extensions-get-contributions', () => {
  return extensionManager?.getContributions() || {}
})

// 新增：执行扩展命令
ipcMain.handle('extensions-execute-command', async (_event, extensionId: string, command: string, args?: any) => {
  if (!extensionManager) return false
  return await extensionManager.executeCommand(extensionId, command, args)
})

// 新增：打开扩展窗口
ipcMain.handle('extensions-open-window', async (_event, extensionId: string, windowId: string) => {
  if (!extensionManager) return false
  return await extensionManager.openExtensionWindow(extensionId, windowId)
})

// 扩展文件搜索替换
ipcMain.handle('extensions-replace-file-search', (_event, extensionId: string, provider: any) => {
  if (!extensionManager) {
    return { success: false, message: '扩展管理器未初始化' }
  }

  const success = extensionManager.replaceFileSearchProvider(extensionId, provider)
  return {
    success,
    message: success ? '文件搜索提供者替换成功' : '文件搜索提供者替换失败'
  }
})

ipcMain.handle('extensions-restore-file-search', (_event, extensionId: string) => {
  if (!extensionManager) {
    return { success: false, message: '扩展管理器未初始化' }
  }

  const success = extensionManager.restoreFileSearchProvider(extensionId)
  return {
    success,
    message: success ? '文件搜索提供者恢复成功' : '文件搜索提供者恢复失败'
  }
})

// 选择扩展文件夹
ipcMain.handle('extensions-select-folder', async () => {
  if (!mainWindow) {
    return { success: false, message: '主窗口未找到' }
  }

  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: '选择扩展文件夹',
      properties: ['openDirectory'],
      message: '请选择包含扩展的文件夹'
    })

    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, message: '用户取消选择' }
    }

    return { success: true, path: result.filePaths[0] }
  } catch (error) {
    console.error('选择扩展文件夹失败:', error)
    return { success: false, message: `选择失败: ${error instanceof Error ? error.message : String(error)}` }
  }
})

// 应用退出时清理托盘
app.on('before-quit', () => {
  trayManager?.destroy()
  trayManager = null
})
