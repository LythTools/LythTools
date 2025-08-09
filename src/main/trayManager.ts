import { app, BrowserWindow, Menu, Tray, nativeImage, shell } from 'electron'

export class TrayManager {
  private tray: Tray | null = null
  private mainWindow: BrowserWindow | null = null

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow
    this.createTray()
  }

  private createTray() {
    // 创建托盘图标 - 使用内嵌的SVG图标
    const trayIcon = this.createTrayIcon()
    this.tray = new Tray(trayIcon)

    // 设置托盘提示文本
    this.tray.setToolTip('LythTools - 快速启动器')

    // 创建右键菜单
    this.createContextMenu()

    // 设置托盘图标点击事件
    this.setupTrayEvents()
  }

  private createTrayIcon(): Electron.NativeImage {
    // 创建16x16的SVG图标用于托盘
    const svgIcon = `
      <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="tray-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#667eea" />
            <stop offset="100%" stop-color="#764ba2" />
          </linearGradient>
        </defs>
        <!-- 背景圆形 -->
        <circle cx="8" cy="8" r="7" fill="url(#tray-gradient)" />
        <!-- 闪电图标 -->
        <path d="M9 3L5 9h3l-1 4 4-6H8l1-4z" fill="white" />
      </svg>
    `

    // 将SVG转换为NativeImage
    const buffer = Buffer.from(svgIcon)
    return nativeImage.createFromBuffer(buffer)
  }

  private createContextMenu() {
    const contextMenu = Menu.buildFromTemplate([
      {
        label: '🚀 显示 LythTools',
        type: 'normal',
        click: () => {
          this.showMainWindow()
        }
      },
      {
        type: 'separator'
      },
      {
        type: 'separator'
      },
      {
        label: '📁 打开数据目录',
        type: 'normal',
        click: () => {
          const userDataPath = app.getPath('userData')
          shell.openPath(userDataPath)
        }
      },
      {
        label: '🌐 访问官网',
        type: 'normal',
        click: () => {
          shell.openExternal('https://lythrilla.cn')
        }
      },
      {
        type: 'separator'
      },
      {
        label: '🔄 重启应用',
        type: 'normal',
        click: () => {
          this.restartApp()
        }
      },
      {
        label: '❌ 退出',
        type: 'normal',
        click: () => {
          this.quitApp()
        }
      }
    ])

    this.tray?.setContextMenu(contextMenu)
  }

  private setupTrayEvents() {
    if (!this.tray) return

    // 左键单击显示/隐藏窗口
    this.tray.on('click', () => {
      if (this.mainWindow?.isVisible()) {
        this.hideMainWindow()
      } else {
        this.showMainWindow()
      }
    })

    // 双击显示窗口
    this.tray.on('double-click', () => {
      this.showMainWindow()
    })
  }

  private showMainWindow() {
    if (!this.mainWindow) return

    if (this.mainWindow.isMinimized()) {
      this.mainWindow.restore()
    }

    this.mainWindow.show()
    this.mainWindow.focus()

    // 如果窗口在其他桌面，将其带到前台
    this.mainWindow.setAlwaysOnTop(true)
    this.mainWindow.setAlwaysOnTop(false)
  }

  private hideMainWindow() {
    this.mainWindow?.hide()
  }

  private restartApp() {
    // 重启应用
    app.relaunch()
    app.exit(0)
  }

  private quitApp() {
    // 完全退出应用
    app.quit()
  }

  // 更新托盘图标状态
  public updateTrayIcon(isActive: boolean = true) {
    if (!this.tray) return

    const svgIcon = isActive ? this.createActiveTrayIcon() : this.createInactiveTrayIcon()
    this.tray.setImage(svgIcon)
  }

  private createActiveTrayIcon(): Electron.NativeImage {
    const svgIcon = `
      <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="active-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#667eea" />
            <stop offset="100%" stop-color="#764ba2" />
          </linearGradient>
        </defs>
        <circle cx="8" cy="8" r="7" fill="url(#active-gradient)" />
        <path d="M9 3L5 9h3l-1 4 4-6H8l1-4z" fill="white" />
        <!-- 活跃状态指示点 -->
        <circle cx="12" cy="4" r="2" fill="#10B981" stroke="white" stroke-width="0.5" />
      </svg>
    `
    return nativeImage.createFromBuffer(Buffer.from(svgIcon))
  }

  private createInactiveTrayIcon(): Electron.NativeImage {
    const svgIcon = `
      <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
        <circle cx="8" cy="8" r="7" fill="#6B7280" />
        <path d="M9 3L5 9h3l-1 4 4-6H8l1-4z" fill="white" opacity="0.7" />
      </svg>
    `
    return nativeImage.createFromBuffer(Buffer.from(svgIcon))
  }

  // 显示托盘通知
  public showNotification(title: string, body: string) {
    if (!this.tray) return

    this.tray.displayBalloon({
      title,
      content: body,
      icon: this.createTrayIcon()
    })
  }

  // 销毁托盘
  public destroy() {
    if (this.tray) {
      this.tray.destroy()
      this.tray = null
    }
  }

  // 获取托盘实例
  public getTray(): Tray | null {
    return this.tray
  }
}
