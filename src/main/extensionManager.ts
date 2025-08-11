import { join } from 'path'
import { promises as fs, existsSync } from 'fs'
import { app, BrowserWindow } from 'electron'
import { promisify } from 'util'
import { exec, spawn, ChildProcessWithoutNullStreams } from 'child_process'
import { EventEmitter } from 'events'

const execAsync = promisify(exec)

/**
 * 扩展清单接口
 */
export interface ExtensionManifest {
  id: string
  name: string
  description: string
  version: string
  author: string
  icon: string
  category: string
  permissions: string[]
  
  // 详细介绍信息
  longDescription?: string
  features?: string[]
  changelog?: Array<{
    version: string
    date: string
    changes: string[]
  }>
  screenshots?: string[]
  homepage?: string
  repository?: string
  license?: string
  tags?: string[]
  
  commands: {
    name: string
    description: string
    keywords: string[]
  }[]
  settings: {
    key: string
    name: string
    description: string
    type: 'string' | 'number' | 'boolean' | 'select'
    default: any
    options?: { label: string; value: any }[]
  }[]
  main?: string
  engines?: {
    lythtools: string
  }
  // 新增：外部进程入口（多语言支持）
  entry?: {
    type: 'process'
    command: string
    args?: string[]
    cwd?: string
    env?: Record<string, string>
  }
}

/**
 * 已安装扩展信息
 */
export interface InstalledExtension {
  manifest: ExtensionManifest
  path: string
  enabled: boolean
}

// 扩展贡献（供渲染端展示/交互）
export interface ExtensionContributions {
  listItems?: Array<{
    id: string
    title: string
    description?: string
    icon?: string
    command?: string
    args?: any
  }>
  menus?: Array<{
    id: string
    label: string
    parent?: string // e.g. 'root' | 'search-dropdown'
    command?: string
    args?: any
  }>
  windows?: Array<{
    id: string
    title: string
    // 扩展可以提供文件路径(相对扩展目录)或URL
    url?: string
    file?: string
    width?: number
    height?: number
  }>
}

interface ExternalProcessState {
  child: ChildProcessWithoutNullStreams
  ready: boolean
  buffer: string
  contributions: ExtensionContributions
  lastHeartbeatAt: number
}

/**
 * 扩展管理器
 */
export class ExtensionManager {
  private extensionsDir: string
  private installedExtensions = new Map<string, InstalledExtension>()
  private enabledExtensions = new Set<string>()
  private processes = new Map<string, ExternalProcessState>()
  private events = new EventEmitter()

  constructor() {
    // 扩展安装目录
    this.extensionsDir = join(app.getPath('userData'), 'extensions')
    this.ensureExtensionsDir()
  }

  /**
   * 确保扩展目录存在
   */
  private async ensureExtensionsDir(): Promise<void> {
    try {
      if (!existsSync(this.extensionsDir)) {
        await fs.mkdir(this.extensionsDir, { recursive: true })
      }
    } catch (error) {
      console.error('创建扩展目录失败:', error)
    }
  }

  /**
   * 初始化扩展管理器
   */
  async initialize(): Promise<void> {
    console.log('初始化扩展管理器...')
    await this.loadInstalledExtensions()
    await this.loadEnabledExtensions()
    await this.activateEnabledExtensions()
    console.log(`已加载 ${this.installedExtensions.size} 个扩展`)
  }

  /**
   * 加载已安装的扩展
   */
  private async loadInstalledExtensions(): Promise<void> {
    try {
      const entries = await fs.readdir(this.extensionsDir, { withFileTypes: true })

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const extensionPath = join(this.extensionsDir, entry.name)
          await this.loadExtension(extensionPath)
        }
      }
    } catch (error) {
      console.error('加载已安装扩展失败:', error)
    }
  }

  /**
   * 加载单个扩展
   */
  private async loadExtension(extensionPath: string): Promise<void> {
    try {
      // 仅支持 manifest.json（进程型扩展），兼容 package.json -> lythtools 作为降级读取清单
      const manifestJsonPath = join(extensionPath, 'manifest.json')
      let manifest: ExtensionManifest | null = null
      if (existsSync(manifestJsonPath)) {
        manifest = JSON.parse(await fs.readFile(manifestJsonPath, 'utf-8'))
      } else {
        const packageJsonPath = join(extensionPath, 'package.json')
        if (!existsSync(packageJsonPath)) {
          console.warn(`扩展目录缺少 manifest.json（或兼容的 package.json）: ${extensionPath}`)
          return
        }
        const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'))
        if (!packageJson.lythtools) {
          console.warn(`无效的LythTools扩展: ${extensionPath}`)
          return
        }
        manifest = {
          ...packageJson.lythtools,
          main: packageJson.main || undefined
        }
      }

      const extension: InstalledExtension = {
        manifest: manifest!,
        path: extensionPath,
        enabled: false
      }

      this.installedExtensions.set(manifest!.id, extension)
      console.log(`已加载扩展: ${manifest!.name} (${manifest!.id})`)
    } catch (error) {
      console.error(`加载扩展失败 ${extensionPath}:`, error)
    }
  }

  /**
   * 加载已启用的扩展列表
   */
  private async loadEnabledExtensions(): Promise<void> {
    try {
      const configPath = join(this.extensionsDir, 'enabled.json')

      if (existsSync(configPath)) {
        const enabledList = JSON.parse(await fs.readFile(configPath, 'utf-8'))
        this.enabledExtensions = new Set(enabledList)
      }
    } catch (error) {
      console.error('加载已启用扩展列表失败:', error)
    }
  }

  /**
   * 保存已启用的扩展列表
   */
  private async saveEnabledExtensions(): Promise<void> {
    try {
      const configPath = join(this.extensionsDir, 'enabled.json')
      await fs.writeFile(configPath, JSON.stringify([...this.enabledExtensions], null, 2))
    } catch (error) {
      console.error('保存已启用扩展列表失败:', error)
    }
  }

  /**
   * 获取已安装的扩展列表
   */
  getInstalledExtensions(): ExtensionManifest[] {
    return Array.from(this.installedExtensions.values()).map(ext => ({
      ...ext.manifest,
      enabled: this.enabledExtensions.has(ext.manifest.id)
    }))
  }

  /**
   * 安装扩展
   */
  async installExtension(extensionPath: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`开始安装扩展: ${extensionPath}`)

      // 优先使用 manifest.json
      let id: string | null = null
      const manifestJsonPath = join(extensionPath, 'manifest.json')
      if (existsSync(manifestJsonPath)) {
        const manifest = JSON.parse(await fs.readFile(manifestJsonPath, 'utf-8'))
        id = manifest.id
      } else if (existsSync(join(extensionPath, 'package.json'))) {
        const pkg = JSON.parse(await fs.readFile(join(extensionPath, 'package.json'), 'utf-8'))
        id = pkg?.lythtools?.id
      }
      if (!id) {
        return { success: false, message: '无效的扩展包：缺少 manifest.json 或 lythtools.id' }
      }
      const targetPath = join(this.extensionsDir, id)

      // 检查是否已安装
      if (this.installedExtensions.has(id)) {
        return { success: false, message: '扩展已安装，请先卸载旧版本' }
      }

      // 复制扩展文件
      await this.copyDirectory(extensionPath, targetPath)

      // 加载扩展
      await this.loadExtension(targetPath)

      console.log(`扩展安装成功: ${id}`)
      return { success: true, message: `扩展 "${id}" 安装成功` }
    } catch (error) {
      console.error('安装扩展失败:', error)
      return { success: false, message: `安装失败: ${error instanceof Error ? error.message : String(error)}` }
    }
  }

  /**
   * 卸载扩展
   */
  async uninstallExtension(extensionId: string): Promise<{ success: boolean; message: string }> {
    try {
      const extension = this.installedExtensions.get(extensionId)
      if (!extension) {
        return { success: false, message: '扩展未找到' }
      }

      // 先禁用扩展
      if (this.enabledExtensions.has(extensionId)) {
        await this.disableExtension(extensionId)
      }

      // 删除扩展文件
      await this.removeDirectory(extension.path)

      // 从内存中移除
      this.installedExtensions.delete(extensionId)

      console.log(`扩展卸载成功: ${extension.manifest.name}`)
      return { success: true, message: `扩展 "${extension.manifest.name}" 卸载成功` }
    } catch (error) {
      console.error('卸载扩展失败:', error)
      return { success: false, message: `卸载失败: ${error instanceof Error ? error.message : String(error)}` }
    }
  }

  /**
   * 启用扩展
   */
  async enableExtension(extensionId: string): Promise<{ success: boolean; message: string }> {
    try {
      const extension = this.installedExtensions.get(extensionId)
      if (!extension) {
        return { success: false, message: '扩展未找到' }
      }

      if (this.enabledExtensions.has(extensionId)) {
        return { success: false, message: '扩展已启用' }
      }

      // 实际激活扩展实例/进程
      await this.activateExtension(extension)

      this.enabledExtensions.add(extensionId)
      await this.saveEnabledExtensions()

      console.log(`扩展启用成功: ${extension.manifest.name}`)
      return { success: true, message: `扩展 "${extension.manifest.name}" 启用成功` }
    } catch (error) {
      console.error('启用扩展失败:', error)
      return { success: false, message: `启用失败: ${error instanceof Error ? error.message : String(error)}` }
    }
  }

  /**
   * 禁用扩展
   */
  async disableExtension(extensionId: string): Promise<{ success: boolean; message: string }> {
    try {
      const extension = this.installedExtensions.get(extensionId)
      if (!extension) {
        return { success: false, message: '扩展未找到' }
      }

      if (!this.enabledExtensions.has(extensionId)) {
        return { success: false, message: '扩展未启用' }
      }

      // 停止外部进程
      await this.terminateExternalProcess(extensionId)

      this.enabledExtensions.delete(extensionId)
      await this.saveEnabledExtensions()

      console.log(`扩展禁用成功: ${extension.manifest.name}`)
      return { success: true, message: `扩展 "${extension.manifest.name}" 禁用成功` }
    } catch (error) {
      console.error('禁用扩展失败:', error)
      return { success: false, message: `禁用失败: ${error instanceof Error ? error.message : String(error)}` }
    }
  }

  /**
   * 获取扩展信息
   */
  getExtensionInfo(extensionId: string): ExtensionManifest | null {
    const extension = this.installedExtensions.get(extensionId)
    return extension ? extension.manifest : null
  }

  /**
   * 复制目录
   */
  private async copyDirectory(src: string, dest: string): Promise<void> {
    await fs.mkdir(dest, { recursive: true })
    const entries = await fs.readdir(src, { withFileTypes: true })

    for (const entry of entries) {
      const srcPath = join(src, entry.name)
      const destPath = join(dest, entry.name)

      if (entry.isDirectory()) {
        await this.copyDirectory(srcPath, destPath)
      } else {
        await fs.copyFile(srcPath, destPath)
      }
    }
  }

  /**
   * 删除目录
   */
  private async removeDirectory(path: string): Promise<void> {
    if (existsSync(path)) {
      await fs.rm(path, { recursive: true, force: true })
    }
  }

  setOriginalFileSearchProvider(_provider: (query: string, maxResults?: number) => Promise<any[]>): void {}
  replaceFileSearchProvider(_extensionId: string, _provider: (query: string, maxResults?: number) => Promise<any[]>): boolean { return false }
  restoreFileSearchProvider(_extensionId: string): boolean { return true }
  getCurrentFileSearchProvider(): ((query: string, maxResults?: number) => Promise<any[]>) | null { return null }

  /**
   * 激活已启用的扩展
   */
  private async activateEnabledExtensions(): Promise<void> {
    for (const extensionId of this.enabledExtensions) {
      const extension = this.installedExtensions.get(extensionId)
      if (extension) {
        try {
          await this.activateExtension(extension)
          console.log(`已激活扩展: ${extension.manifest.name}`)
        } catch (error) {
          console.error(`激活扩展失败: ${extension.manifest.name}`, error)
        }
      }
    }
  }

  /**
   * 激活扩展实例
   */
  private async activateExtension(extension: InstalledExtension): Promise<void> {
    try {
      // 仅支持进程型扩展
      if (extension.manifest.entry?.type !== 'process') {
        throw new Error('扩展缺少进程入口（entry.type=process）')
      }
      await this.spawnExternalProcess(extension)
    } catch (error) {
      console.error(`激活扩展实例失败: ${extension.manifest.name}`, error)
      throw error
    }
  }

  /**
   * 创建扩展上下文
   */
  private createExtensionContext(extension: InstalledExtension): any {
    const extensionId = extension.manifest.id

    return {
      extension: {
        id: extensionId,
        name: extension.manifest.name,
        version: extension.manifest.version,
        path: extension.path
      },

      commands: {
        register: (name: string, handler: Function) => {
          console.log(`扩展 ${extensionId} 注册命令: ${name}`)
        },
        unregister: (name: string) => {
          console.log(`扩展 ${extensionId} 注销命令: ${name}`)
        },
        execute: async (name: string, args?: string[]) => {
          console.log(`扩展 ${extensionId} 执行命令: ${name}`, args)
        }
      },

      search: {
        addResult: (result: any) => {
          console.log(`扩展 ${extensionId} 添加搜索结果:`, result?.title)
        }
      },

      ui: {
        showNotification: (message: string, type = 'info') => {
          console.log(`[${extensionId}] [${type.toUpperCase()}] ${message}`)
        },
        showDialog: async (options: any) => {
          console.log(`[${extensionId}] 显示对话框:`, options.title, options.message)
          return 0
        },
        openUrl: (url: string) => {
          console.log(`[${extensionId}] 打开URL:`, url)
        }
      },

      settings: {
        data: {} as Record<string, any>,
        get: function (key: string, defaultValue?: any) {
          return this.data[key] !== undefined ? this.data[key] : defaultValue
        },
        set: function (key: string, value: any) {
          this.data[key] = value
          console.log(`[${extensionId}] 设置 ${key} = ${value}`)
        },
        has: function (key: string) {
          return this.data[key] !== undefined
        },
        delete: function (key: string) {
          delete this.data[key]
          console.log(`[${extensionId}] 删除设置: ${key}`)
        },
        getAll: function () {
          return { ...this.data }
        }
      },

      logger: {
        info: (message: string, ...args: any[]) => {
          console.log(`[${extensionId}] [INFO]`, message, ...args)
        },
        warn: (message: string, ...args: any[]) => {
          console.warn(`[${extensionId}] [WARN]`, message, ...args)
        },
        error: (message: string, ...args: any[]) => {
          console.error(`[${extensionId}] [ERROR]`, message, ...args)
        },
        debug: (message: string, ...args: any[]) => {
          console.debug(`[${extensionId}] [DEBUG]`, message, ...args)
        }
      }
    }
  }

  // 启动外部进程扩展
  private async spawnExternalProcess(extension: InstalledExtension): Promise<void> {
    const entry = extension.manifest.entry!
    // 处理相对路径：如果 entry.cwd 是相对路径，则相对于扩展目录
    let cwd = extension.path
    if (entry.cwd && entry.cwd !== '.') {
      cwd = join(extension.path, entry.cwd)
    }
    const env = { ...process.env, ...(entry.env || {}) }
    console.log(`[${extension.manifest.id}] 启动外部进程: ${entry.command} ${(entry.args || []).join(' ')}`)
    const child = spawn(entry.command, entry.args || [], { cwd, env, shell: true })
    const state: ExternalProcessState = {
      child,
      ready: false,
      buffer: '',
      contributions: {},
      lastHeartbeatAt: Date.now(),
    }
    this.processes.set(extension.manifest.id, state)

    const send = (msg: any) => {
      try {
        child.stdin.write(JSON.stringify(msg) + '\n')
      } catch (e) {
        console.error(`[${extension.manifest.id}] 发送消息失败`, e)
      }
    }

    const handleLine = (line: string) => {
      if (!line.trim()) return
      try {
        const msg = JSON.parse(line)
        // 简单协议处理
        if (msg.type === 'ready') {
          state.ready = true
          // 发送初始化
          send({
            type: 'init',
            apiVersion: 1,
            extensionId: extension.manifest.id,
            host: { version: app.getVersion() },
            paths: { extensionPath: extension.path, userData: app.getPath('userData') }
          })
          return
        }
        if (msg.type === 'heartbeat') {
          state.lastHeartbeatAt = Date.now()
          return
        }
        if (msg.type === 'register' || msg.type === 'update') {
          const contrib: ExtensionContributions = msg.contributions || {}
          state.contributions = {
            listItems: contrib.listItems || state.contributions.listItems || [],
            menus: contrib.menus || state.contributions.menus || [],
            windows: contrib.windows || state.contributions.windows || [],
          }
          this.events.emit('contributions-changed', extension.manifest.id, state.contributions)
          return
        }
        if (msg.type === 'log') {
          const level = String(msg.level || 'info')
          const text = `[${extension.manifest.id}] ${msg.message}`
          switch (level) {
            case 'error':
              console.error(text)
              break
            case 'warn':
              console.warn(text)
              break
            case 'debug':
              console.debug(text)
              break
            case 'info':
              console.info(text)
              break
            default:
              console.log(text)
          }
          return
        }
      } catch (e) {
        console.error(`[${extension.manifest.id}] 解析消息失败:`, line)
      }
    }

    child.stdout.setEncoding('utf-8')
    child.stdout.on('data', (chunk) => {
      state.buffer += chunk
      let idx
      while ((idx = state.buffer.indexOf('\n')) >= 0) {
        const line = state.buffer.slice(0, idx)
        state.buffer = state.buffer.slice(idx + 1)
        handleLine(line)
      }
    })
    child.stderr.setEncoding('utf-8')
    child.stderr.on('data', (data) => {
      console.error(`[${extension.manifest.id}] STDERR:`, data.trim())
    })
    child.on('exit', (code) => {
      console.warn(`[${extension.manifest.id}] 进程退出, code=${code}`)
      this.processes.delete(extension.manifest.id)
      this.events.emit('process-exited', extension.manifest.id, code)
    })
  }

  // 停止外部进程扩展
  private async terminateExternalProcess(extensionId: string): Promise<void> {
    const state = this.processes.get(extensionId)
    if (!state) return
    try {
      state.child.kill()
    } catch (e) {
      console.error(`[${extensionId}] 终止进程失败`, e)
    }
    this.processes.delete(extensionId)
  }

  // 获取扩展贡献（提供给渲染端）
  public getContributions(): Record<string, ExtensionContributions> {
    const result: Record<string, ExtensionContributions> = {}
    for (const [id, state] of this.processes.entries()) {
      result[id] = state.contributions || {}
    }
    return result
  }

  // 订阅贡献变化
  public onContributionsChanged(handler: (extensionId: string, contrib: ExtensionContributions) => void): void {
    this.events.on('contributions-changed', handler)
  }

  // 执行扩展命令（通过stdin向外部进程发送）
  public async executeCommand(extensionId: string, command: string, args?: any): Promise<boolean> {
    const state = this.processes.get(extensionId)
    if (!state) return false
    try {
      state.child.stdin.write(JSON.stringify({ type: 'command', command, args }) + '\n')
      return true
    } catch (e) {
      console.error(`[${extensionId}] 发送命令失败:`, e)
      return false
    }
  }

  // 打开扩展窗口（根据 contributions.windows 定义）
  public async openExtensionWindow(extensionId: string, windowId: string): Promise<boolean> {
    const state = this.processes.get(extensionId)
    const ext = this.installedExtensions.get(extensionId)
    if (!state || !ext) return false
    const winDef = state.contributions.windows?.find(w => w.id === windowId)
    if (!winDef) return false
    try {
      const bw = new BrowserWindow({
        width: winDef.width || 900,
        height: winDef.height || 600,
        title: winDef.title || `${ext.manifest.name}`,
        webPreferences: { contextIsolation: true, nodeIntegration: false }
      })
      if (winDef.url) {
        await bw.loadURL(winDef.url)
      } else if (winDef.file) {
        const filePath = join(ext.path, winDef.file)
        await bw.loadFile(filePath)
      } else {
        return false
      }
      return true
    } catch (e) {
      console.error(`[${extensionId}] 打开扩展窗口失败:`, e)
      return false
    }
  }
}
