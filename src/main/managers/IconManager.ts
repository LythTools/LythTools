/**
 * 图标管理器
 */
import { app, nativeImage, shell } from 'electron'
import { getSmartIcon } from '../../shared/utils/iconUtils.js'
import { PERFORMANCE_CONFIG } from '../../shared/constants/appConstants.js'

export class IconManager {
  private iconCache = new Map<string, string>()

  constructor() {
    // 定期清理图标缓存
    setInterval(() => {
      this.cleanupCache()
    }, PERFORMANCE_CONFIG.MEMORY_CLEANUP_INTERVAL)
  }

  /**
   * 获取文件图标
   */
  async getFileIcon(filePath: string): Promise<string | null> {
    try {
      console.log('图标管理器: 获取文件图标:', filePath)

      // 检查缓存
      if (this.iconCache.has(filePath)) {
        console.log('图标管理器: 从缓存返回图标')
        return this.iconCache.get(filePath)!
      }

      // 针对 Windows 快捷方式(.lnk) 优先解析目标或自定义图标
      if (/\.lnk$/i.test(filePath)) {
        try {
          const link = shell.readShortcutLink(filePath)
          // 如果快捷方式指定了自定义图标，优先使用
          if (link.icon) {
            const img = nativeImage.createFromPath(link.icon)
            if (img && !img.isEmpty()) {
              const dataUrl = img.toDataURL()
              this.cacheIcon(filePath, dataUrl)
              return dataUrl
            }
          }
          // 否则尝试对目标执行文件获取系统图标
          if (link.target) {
            const trySizesLnk: Array<'normal' | 'large' | 'small'> = ['normal', 'large', 'small']
            for (const size of trySizesLnk) {
              try {
                const img = await app.getFileIcon(link.target, { size })
                if (img && !img.isEmpty()) {
                  const dataUrl = img.toDataURL()
                  this.cacheIcon(filePath, dataUrl)
                  return dataUrl
                }
              } catch {}
            }
          }
        } catch {}
      }

      // 使用Electron的app.getFileIcon方法获取系统图标，尝试多种尺寸
      const trySizes: Array<'normal' | 'large' | 'small'> = ['normal', 'large', 'small']
      for (const size of trySizes) {
        try {
          const img = await app.getFileIcon(filePath, { size })
          if (img && !img.isEmpty()) {
            const dataUrl = img.toDataURL()
            console.log(`图标管理器: 成功获取系统图标(${size})，数据长度:`, dataUrl.length)
            this.cacheIcon(filePath, dataUrl)
            return dataUrl
          }
        } catch (e) {
          // 某些尺寸在特定文件类型上可能失败，继续尝试其他尺寸
        }
      }

      console.log('图标管理器: 系统图标获取失败，使用智能匹配')
      // 降级到智能图标匹配
      const smartIcon = getSmartIcon(filePath)
      if (smartIcon) {
        this.cacheIcon(filePath, smartIcon)
        return smartIcon
      }

      return null
    } catch (error) {
      console.error('图标管理器: 获取文件图标失败:', error)

      // 错误时降级到智能图标匹配
      try {
        const smartIcon = getSmartIcon(filePath)
        if (smartIcon) {
          this.cacheIcon(filePath, smartIcon)
          return smartIcon
        }
      } catch (fallbackError) {
        console.error('图标管理器: 智能图标匹配也失败:', fallbackError)
      }

      return null
    }
  }

  /**
   * 同步获取文件图标（优先使用缓存和智能匹配）
   */
  getFileIconSync(filePath: string): string | null {
    try {
      // 先检查缓存
      if (this.iconCache.has(filePath)) {
        return this.iconCache.get(filePath)!
      }

      // 对于同步调用，优先使用智能图标匹配
      const smartIcon = getSmartIcon(filePath)
      if (smartIcon) {
        this.cacheIcon(filePath, smartIcon)
        return smartIcon
      }

      return null
    } catch (error) {
      console.error('图标管理器: 同步获取图标失败:', error)
      return null
    }
  }

  /**
   * 缓存图标
   */
  private cacheIcon(filePath: string, icon: string): void {
    // 如果缓存已满，删除最旧的条目
    if (this.iconCache.size >= PERFORMANCE_CONFIG.ICON_CACHE_SIZE) {
      const firstKey = this.iconCache.keys().next().value
      if (firstKey) {
        this.iconCache.delete(firstKey)
      }
    }

    this.iconCache.set(filePath, icon)
  }

  /**
   * 清理过期缓存
   */
  private cleanupCache(): void {
    // 如果缓存大小超过限制，清理一半
    if (this.iconCache.size > PERFORMANCE_CONFIG.ICON_CACHE_SIZE) {
      const keysToDelete = Array.from(this.iconCache.keys()).slice(0, Math.floor(this.iconCache.size / 2))
      keysToDelete.forEach(key => this.iconCache.delete(key))
      console.log(`图标管理器: 清理了 ${keysToDelete.length} 个缓存条目`)
    }
  }

  /**
   * 预热常用图标
   */
  async preloadCommonIcons(filePaths: string[]): Promise<void> {
    console.log('图标管理器: 预热常用图标')
    
    for (const filePath of filePaths) {
      if (!this.iconCache.has(filePath)) {
        try {
          await this.getFileIcon(filePath)
        } catch (error) {
          console.warn('图标管理器: 预热图标失败:', filePath, error)
        }
      }
    }
  }

  /**
   * 清空图标缓存
   */
  clearCache(): void {
    this.iconCache.clear()
    console.log('图标管理器: 已清空图标缓存')
  }

  /**
   * 获取缓存统计信息
   */
  getCacheStats(): { size: number; maxSize: number } {
    return {
      size: this.iconCache.size,
      maxSize: PERFORMANCE_CONFIG.ICON_CACHE_SIZE
    }
  }
}

