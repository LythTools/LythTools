/**
 * 搜索管理器
 */
import { promises as fs, existsSync } from 'fs'
import { join } from 'path'
import { SYSTEM_PATHS } from '../../shared/constants/appConstants.js'
import { pinyinMatch } from '../../shared/utils/pinyinUtils.js'

export interface ApplicationInfo {
  name: string
  path: string
  icon?: string
  type: 'application'
}

export interface FileInfo {
  name: string
  path: string
  type: 'file' | 'folder'
  size?: number
  modified?: Date
}

export class SearchManager {
  private applicationCache: ApplicationInfo[] = []
  private cacheExpiry = 0
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5分钟缓存

  constructor() {
    console.log('搜索管理器: 初始化')
  }

  /**
   * 搜索应用程序
   */
  async searchApplications(): Promise<ApplicationInfo[]> {
    // 检查缓存是否有效
    if (this.applicationCache.length > 0 && Date.now() < this.cacheExpiry) {
      console.log('搜索管理器: 从缓存返回应用程序列表')
      return this.applicationCache
    }

    console.log('搜索管理器: 搜索系统应用程序')
    const applications: ApplicationInfo[] = []

    try {
      if (process.platform === 'win32') {
        // Windows: 搜索开始菜单和程序文件夹
        const commonPaths: string[] = [
          ...SYSTEM_PATHS.WINDOWS.START_MENU,
          ...SYSTEM_PATHS.WINDOWS.PROGRAM_FILES
        ].map(path => path.replace('%USERNAME%', process.env.USERNAME || ''))

        for (const basePath of commonPaths) {
          if (existsSync(basePath)) {
            await this.searchApplicationsInPath(basePath, applications)
          }
        }
      } else if (process.platform === 'darwin') {
        // macOS: 搜索Applications文件夹
        const appPaths = ['/Applications', '/System/Applications']
        for (const appPath of appPaths) {
          if (existsSync(appPath)) {
            await this.searchApplicationsInPath(appPath, applications, '.app')
          }
        }
      } else if (process.platform === 'linux') {
        // Linux: 搜索.desktop文件
        const desktopPaths = [
          '/usr/share/applications',
          '/usr/local/share/applications',
          `${process.env.HOME}/.local/share/applications`
        ]
        
        for (const desktopPath of desktopPaths) {
          if (existsSync(desktopPath)) {
            await this.searchDesktopFiles(desktopPath, applications)
          }
        }
      }
    } catch (error) {
      console.error('搜索管理器: 搜索应用程序时出错:', error)
    }

    // 缓存结果
    this.applicationCache = applications
    this.cacheExpiry = Date.now() + this.CACHE_DURATION

    console.log(`搜索管理器: 找到 ${applications.length} 个应用程序`)
    return applications
  }

  /**
   * 在指定路径中搜索应用程序
   */
  private async searchApplicationsInPath(
    dirPath: string, 
    applications: ApplicationInfo[], 
    extension = '.exe'
  ): Promise<void> {
    try {
      const items = await fs.readdir(dirPath, { withFileTypes: true })

      for (const item of items) {
        const fullPath = join(dirPath, item.name)

        if (item.isFile() && (item.name.endsWith(extension) || item.name.endsWith('.lnk'))) {
          const name = item.name.replace(/\.(exe|lnk|app)$/i, '')

          // 过滤一些不需要的应用程序
          if (this.shouldSkipApplication(name, fullPath)) {
            continue
          }

          applications.push({
            name,
            path: fullPath,
            type: 'application'
          })
        } else if (item.isDirectory() && applications.length < 200) {
          // 递归搜索子目录，但限制数量
          await this.searchApplicationsInPath(fullPath, applications, extension)
        }
      }
    } catch (error) {
      // 忽略权限错误等
      console.debug('搜索管理器: 访问路径失败:', dirPath)
    }
  }

  /**
   * 搜索Linux桌面文件
   */
  private async searchDesktopFiles(dirPath: string, applications: ApplicationInfo[]): Promise<void> {
    try {
      const items = await fs.readdir(dirPath, { withFileTypes: true })

      for (const item of items) {
        if (item.isFile() && item.name.endsWith('.desktop')) {
          const fullPath = join(dirPath, item.name)
          
          try {
            const content = await fs.readFile(fullPath, 'utf-8')
            const name = this.extractDesktopFileName(content)
            const execPath = this.extractDesktopExec(content)
            
            if (name && execPath && !this.shouldSkipApplication(name, execPath)) {
              applications.push({
                name,
                path: execPath,
                type: 'application'
              })
            }
          } catch (error) {
            console.debug('搜索管理器: 解析桌面文件失败:', fullPath)
          }
        }
      }
    } catch (error) {
      console.debug('搜索管理器: 访问桌面文件路径失败:', dirPath)
    }
  }

  /**
   * 从桌面文件中提取应用名称
   */
  private extractDesktopFileName(content: string): string | null {
    const nameMatch = content.match(/^Name=(.+)$/m)
    return nameMatch ? nameMatch[1].trim() : null
  }

  /**
   * 从桌面文件中提取执行路径
   */
  private extractDesktopExec(content: string): string | null {
    const execMatch = content.match(/^Exec=(.+)$/m)
    if (!execMatch) return null
    
    // 清理exec字段中的参数
    return execMatch[1].split(' ')[0].trim()
  }

  /**
   * 判断是否应该跳过某个应用程序
   */
  private shouldSkipApplication(name: string, path: string): boolean {
    const nameLower = name.toLowerCase()
    const pathLower = path.toLowerCase()

    // 跳过一些系统文件和不必要的程序
    const skipPatterns = [
      'uninstall', 'uninst', 'setup', 'installer', 'update', 'updater',
      'readme', 'license', 'help', 'documentation', 'manual',
      'debug', 'test', 'sample', 'example', 'demo',
      'crash', 'error', 'log', 'temp', 'tmp', 'cache'
    ]

    const skipPaths = [
      'windows/system32', 'windows/syswow64', 'programdata',
      '$recycle.bin', 'recycler', 'temp', 'tmp'
    ]

    // 检查名称模式
    if (skipPatterns.some(pattern => nameLower.includes(pattern))) {
      return true
    }

    // 检查路径模式
    if (skipPaths.some(pattern => pathLower.includes(pattern))) {
      return true
    }

    // 跳过太短或太长的名称
    if (name.length < 2 || name.length > 50) {
      return true
    }

    return false
  }

  /**
   * 搜索文件
   */
  async searchFiles(query: string, maxResults = 50): Promise<FileInfo[]> {
    const files: FileInfo[] = []

    try {
      if (process.platform === 'win32') {
        // Windows: 在用户常用目录中搜索
        const searchPaths = SYSTEM_PATHS.WINDOWS.USER_FOLDERS
          .map(path => path.replace('%USERPROFILE%', process.env.USERPROFILE || ''))

        for (const searchPath of searchPaths) {
          if (existsSync(searchPath)) {
            await this.searchFilesInPath(searchPath, query, files, maxResults)
            if (files.length >= maxResults) break
          }
        }
      } else {
        // macOS/Linux: 在用户主目录的常用文件夹中搜索
        const homeDir = process.env.HOME || ''
        const searchPaths = [
          join(homeDir, 'Desktop'),
          join(homeDir, 'Documents'), 
          join(homeDir, 'Downloads'),
          join(homeDir, 'Pictures'),
          join(homeDir, 'Videos'),
          join(homeDir, 'Music')
        ]

        for (const searchPath of searchPaths) {
          if (existsSync(searchPath)) {
            await this.searchFilesInPath(searchPath, query, files, maxResults)
            if (files.length >= maxResults) break
          }
        }
      }
    } catch (error) {
      console.error('搜索管理器: 搜索文件时出错:', error)
    }

    return files.slice(0, maxResults)
  }

  /**
   * 在指定路径中搜索文件（支持拼音匹配）
   */
  private async searchFilesInPath(
    dirPath: string, 
    query: string, 
    files: FileInfo[], 
    maxResults: number,
    depth = 0
  ): Promise<void> {
    if (depth > 2 || files.length >= maxResults) return // 限制搜索深度

    try {
      const items = await fs.readdir(dirPath, { withFileTypes: true })
      const queryLower = query.toLowerCase()

      // 收集匹配的文件（支持拼音和评分）
      const matchedFiles: Array<{ item: any; path: string; stats: any; score: number }> = []

      for (const item of items) {
        const fullPath = join(dirPath, item.name)

        // 传统的字符匹配
        const traditionalMatch = item.name.toLowerCase().includes(queryLower)
        
        // 拼音匹配
        const pinyinMatchResult = pinyinMatch(item.name, query)

        if (traditionalMatch || pinyinMatchResult.matches) {
          try {
            const stats = await fs.stat(fullPath)
            
            // 计算综合得分
            let score = 0
            if (traditionalMatch) {
              // 传统匹配得高分
              score = item.name.toLowerCase() === queryLower ? 100 : 90
            } else if (pinyinMatchResult.matches) {
              // 拼音匹配根据匹配类型给分
              score = pinyinMatchResult.score
            }

            matchedFiles.push({
              item,
              path: fullPath,
              stats,
              score
            })
          } catch (statError) {
            // 忽略stat错误
          }
        }

        // 如果是目录且没有以.开头，递归搜索
        if (item.isDirectory() && !item.name.startsWith('.') && depth < 2) {
          await this.searchFilesInPath(fullPath, query, files, maxResults, depth + 1)
        }
      }

      // 按分数排序并添加到结果中
      matchedFiles
        .sort((a, b) => b.score - a.score)
        .slice(0, maxResults - files.length)
        .forEach(({ item, path, stats }) => {
          files.push({
            name: item.name,
            path: path,
            type: item.isDirectory() ? 'folder' : 'file',
            size: item.isFile() ? stats.size : undefined,
            modified: stats.mtime
          })
        })

    } catch (error) {
      // 忽略权限错误等
      console.debug('搜索管理器: 访问文件路径失败:', dirPath)
    }
  }

  /**
   * 清空应用程序缓存
   */
  clearApplicationCache(): void {
    this.applicationCache = []
    this.cacheExpiry = 0
    console.log('搜索管理器: 已清空应用程序缓存')
  }

  /**
   * 获取缓存统计信息
   */
  getCacheStats(): { applicationCount: number; cacheValid: boolean } {
    return {
      applicationCount: this.applicationCache.length,
      cacheValid: Date.now() < this.cacheExpiry
    }
  }
}
