/**
 * 格式化工具函数
 */

/**
 * 格式化使用时长
 * @param minutes 分钟数
 * @returns 格式化后的时间字符串
 */
export function formatUsageTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}分钟`
  }
  
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  
  if (hours < 24) {
    return remainingMinutes > 0 ? `${hours}小时${remainingMinutes}分钟` : `${hours}小时`
  }
  
  const days = Math.floor(hours / 24)
  const remainingHours = hours % 24
  
  if (remainingHours > 0) {
    return `${days}天${remainingHours}小时`
  }
  
  return `${days}天`
}

/**
 * 格式化文件大小
 * @param bytes 字节数
 * @returns 格式化后的文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

/**
 * 格式化数字（添加千分位分隔符）
 * @param num 数字
 * @returns 格式化后的数字字符串
 */
export function formatNumber(num: number): string {
  return num.toLocaleString()
}

/**
 * 格式化日期时间
 * @param date 日期对象
 * @param format 格式化选项
 * @returns 格式化后的日期字符串
 */
export function formatDateTime(date: Date, format: 'date' | 'time' | 'datetime' | 'relative' = 'datetime'): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / 60000)
  
  switch (format) {
    case 'date':
      return date.toLocaleDateString('zh-CN')
    
    case 'time':
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    
    case 'datetime':
      return date.toLocaleString('zh-CN')
    
    case 'relative':
      if (diffMinutes < 1) return '刚刚'
      if (diffMinutes < 60) return `${diffMinutes}分钟前`
      
      const diffHours = Math.floor(diffMinutes / 60)
      if (diffHours < 24) return `${diffHours}小时前`
      
      const diffDays = Math.floor(diffHours / 24)
      if (diffDays < 30) return `${diffDays}天前`
      
      const diffMonths = Math.floor(diffDays / 30)
      if (diffMonths < 12) return `${diffMonths}个月前`
      
      const diffYears = Math.floor(diffMonths / 12)
      return `${diffYears}年前`
    
    default:
      return date.toLocaleString('zh-CN')
  }
}

/**
 * 截取字符串
 * @param str 原字符串
 * @param maxLength 最大长度
 * @param suffix 后缀（默认为...）
 * @returns 截取后的字符串
 */
export function truncateString(str: string, maxLength: number, suffix: string = '...'): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength - suffix.length) + suffix
}

/**
 * 转换文件路径为显示友好的格式
 * @param path 文件路径
 * @returns 友好的路径显示
 */
export function formatFilePath(path: string): string {
  // 替换用户目录为 ~
  const userProfile = process.env.USERPROFILE || process.env.HOME || ''
  if (userProfile && path.startsWith(userProfile)) {
    return path.replace(userProfile, '~')
  }
  return path
}

/**
 * 获取相对时间描述
 * @param date 日期
 * @returns 相对时间描述
 */
export function getRelativeTimeDescription(date: Date): string {
  return formatDateTime(date, 'relative')
}

