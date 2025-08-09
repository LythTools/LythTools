import { join, dirname, basename } from 'path'
import { promises as fs, existsSync } from 'fs'
import { app } from 'electron'
import { promisify } from 'util'
import { exec } from 'child_process'
import { pathToFileURL } from 'url'

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
}

/**
 * 已安装扩展信息
 */
export interface InstalledExtension {
  manifest: ExtensionManifest
  path: string
  enabled: boolean
  instance?: any
  fileSearchProvider?: (query: string) => Promise<any[]>
}

/**
 * 扩展管理器
 */
export class ExtensionManager {
  private extensionsDir: string
  private installedExtensions = new Map<string, InstalledExtension>()
  private enabledExtensions = new Set<string>()
  private originalFileSearchProvider: ((query: string, maxResults?: number) => Promise<any[]>) | null = null
  private currentFileSearchProvider: ((query: string, maxResults?: number) => Promise<any[]>) | null = null

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
      const packageJsonPath = join(extensionPath, 'package.json')

      if (!existsSync(packageJsonPath)) {
        console.warn(`扩展目录缺少package.json: ${extensionPath}`)
        return
      }

      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'))

      if (!packageJson.lythtools) {
        console.warn(`无效的LythTools扩展: ${extensionPath}`)
        return
      }

      const manifest: ExtensionManifest = {
        ...packageJson.lythtools,
        main: packageJson.main || 'dist/index.js'
      }

      const extension: InstalledExtension = {
        manifest,
        path: extensionPath,
        enabled: false
      }

      this.installedExtensions.set(manifest.id, extension)
      console.log(`已加载扩展: ${manifest.name} (${manifest.id})`)
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

      // 检查是否为有效的扩展包
      const packageJsonPath = join(extensionPath, 'package.json')
      if (!existsSync(packageJsonPath)) {
        return { success: false, message: '无效的扩展包：缺少package.json文件' }
      }

      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'))
      if (!packageJson.lythtools) {
        return { success: false, message: '无效的扩展包：缺少lythtools配置' }
      }

      const manifest = packageJson.lythtools
      const targetPath = join(this.extensionsDir, manifest.id)

      // 检查是否已安装
      if (this.installedExtensions.has(manifest.id)) {
        return { success: false, message: '扩展已安装，请先卸载旧版本' }
      }

      // 复制扩展文件
      await this.copyDirectory(extensionPath, targetPath)

      // 安装依赖（如果有package.json）
      if (existsSync(join(targetPath, 'package.json'))) {
        try {
          await execAsync('npm install --production', { cwd: targetPath })
        } catch (error) {
          console.warn('安装扩展依赖失败:', error)
        }
      }

      // 加载扩展
      await this.loadExtension(targetPath)

      console.log(`扩展安装成功: ${manifest.name}`)
      return { success: true, message: `扩展 "${manifest.name}" 安装成功` }
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

      // 实际激活扩展实例
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

      // TODO: 实际停用扩展实例
      // 这里需要调用扩展的deactivate函数

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

  /**
   * 设置原始文件搜索提供者
   */
  setOriginalFileSearchProvider(provider: (query: string, maxResults?: number) => Promise<any[]>): void {
    this.originalFileSearchProvider = provider
    this.currentFileSearchProvider = provider
  }

  /**
   * 替换文件搜索提供者
   */
  replaceFileSearchProvider(extensionId: string, provider: (query: string, maxResults?: number) => Promise<any[]>): boolean {
    const extension = this.installedExtensions.get(extensionId)
    if (!extension || !this.enabledExtensions.has(extensionId)) {
      return false
    }

    extension.fileSearchProvider = provider
    this.currentFileSearchProvider = provider
    console.log(`文件搜索提供者已被扩展 ${extensionId} 替换`)
    return true
  }

  /**
   * 恢复原始文件搜索提供者
   */
  restoreFileSearchProvider(extensionId: string): boolean {
    const extension = this.installedExtensions.get(extensionId)
    if (!extension) {
      return false
    }

    extension.fileSearchProvider = undefined
    this.currentFileSearchProvider = this.originalFileSearchProvider
    console.log(`文件搜索提供者已恢复为原始提供者`)
    return true
  }

  /**
   * 获取当前文件搜索提供者
   */
  getCurrentFileSearchProvider(): ((query: string, maxResults?: number) => Promise<any[]>) | null {
    return this.currentFileSearchProvider
  }

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
      const extensionPath = join(extension.path, 'dist', 'index.js')
      if (!existsSync(extensionPath)) {
        throw new Error(`扩展主文件不存在: ${extensionPath}`)
      }

      // 动态加载扩展模块（兼容 ESM/CJS）
      const fileUrl = pathToFileURL(extensionPath).href
      const importedModule: any = await import(fileUrl)
      const extensionModule: any = importedModule?.default ?? importedModule

      if (!extensionModule || typeof extensionModule.activate !== 'function') {
        throw new Error('扩展缺少activate函数')
      }

      // 创建扩展上下文
      const context = this.createExtensionContext(extension)

      // 激活扩展
      const extensionInstance = extensionModule.activate(context)
      if (extensionInstance && typeof extensionInstance.activate === 'function') {
        await extensionInstance.activate()
      }

      // 保存扩展实例
      extension.instance = extensionInstance

      console.log(`扩展实例激活成功: ${extension.manifest.name}`)
    } catch (error) {
      console.error(`激活扩展实例失败: ${extension.manifest.name}`, error)
      throw error
    }
  }

  /**
   * 创建扩展上下文
   */
  private createExtensionContext(extension: InstalledExtension): any {
    const extensionId = extension.manifest.name.toLowerCase().replace(/\s+/g, '-')

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
        registerProvider: (provider: Function) => {
          console.log(`扩展 ${extensionId} 注册搜索提供者`)
        },
        unregisterProvider: (provider: Function) => {
          console.log(`扩展 ${extensionId} 注销搜索提供者`)
        },
        addResult: (result: any) => {
          console.log(`扩展 ${extensionId} 添加搜索结果:`, result.title)
        },
        replaceFileSearch: (provider: (query: string, maxResults?: number) => Promise<any[]>) => {
          console.log(`扩展 ${extensionId} 替换文件搜索提供者`)
          this.replaceFileSearchProvider(extensionId, provider)
        },
        restoreFileSearch: () => {
          console.log(`扩展 ${extensionId} 恢复文件搜索提供者`)
          this.restoreFileSearchProvider(extensionId)
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
}
