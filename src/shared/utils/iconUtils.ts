/**
 * 统一的图标工具函数
 */

// 应用程序图标映射表
export const APP_ICON_MAP: Record<string, string> = {
  // 浏览器
  'chrome': '🌐',
  'firefox': '🦊', 
  'edge': '🌐',
  'safari': '🌐',
  
  // 开发工具
  'vscode': '💻',
  'code': '💻',
  'visual studio': '💻',
  'webstorm': '💻',
  'atom': '💻',
  'sublime': '💻',
  'git': '📂',
  
  // 办公软件
  'word': '📄',
  'excel': '📊', 
  'powerpoint': '📈',
  'outlook': '📧',
  'onenote': '📝',
  
  // 系统工具
  'notepad': '📝',
  'calculator': '🧮',
  'calc': '🧮',
  'explorer': '📁',
  'cmd': '⌨️',
  'powershell': '⚡',
  'terminal': '⌨️',
  
  // 媒体软件
  'vlc': '🎬',
  'potplayer': '🎬',
  'kmplayer': '🎬',
  'spotify': '🎵',
  'itunes': '🎵',
  'photoshop': '🎨',
  'illustrator': '🎨',
  'premiere': '🎬',
  
  // 压缩工具
  'winrar': '📦',
  '7zip': '📦',
  'zip': '📦',
  
  // 通讯软件
  'discord': '💬',
  'skype': '📞',
  'zoom': '📹',
  'teams': '👥',
  'wechat': '💬',
  'qq': '💬',
  
  // 游戏平台
  'steam': '🎮',
  'epic': '🎮',
  'origin': '🎮',
  'battlenet': '🎮',
  
  // 其他
  'docker': '🐳',
  'nodejs': '🟢',
  'python': '🐍'
}

// 文件类型图标映射表
export const FILE_TYPE_ICON_MAP: Record<string, string> = {
  // 文档类型
  'txt': '📄', 'doc': '📄', 'docx': '📄', 'rtf': '📄', 'odt': '📄',
  'pdf': '📕',
  'xls': '📊', 'xlsx': '📊', 'csv': '📊', 'ods': '📊',
  'ppt': '📈', 'pptx': '📈', 'odp': '📈',
  
  // 图片类型
  'jpg': '🖼️', 'jpeg': '🖼️', 'png': '🖼️', 'gif': '🖼️', 'bmp': '🖼️',
  'svg': '🖼️', 'webp': '🖼️', 'ico': '🖼️', 'tiff': '🖼️',
  
  // 视频类型
  'mp4': '🎬', 'avi': '🎬', 'mkv': '🎬', 'mov': '🎬', 'wmv': '🎬',
  'flv': '🎬', 'webm': '🎬', 'm4v': '🎬', 'mpg': '🎬', 'mpeg': '🎬',
  
  // 音频类型
  'mp3': '🎵', 'wav': '🎵', 'flac': '🎵', 'aac': '🎵', 'ogg': '🎵',
  'wma': '🎵', 'm4a': '🎵', 'aiff': '🎵',
  
  // 压缩包类型
  'zip': '📦', 'rar': '📦', '7z': '📦', 'tar': '📦', 'gz': '📦',
  'bz2': '📦', 'xz': '📦',
  
  // 程序类型
  'exe': '⚙️', 'msi': '⚙️', 'app': '⚙️', 'deb': '⚙️', 'dmg': '⚙️',
  'pkg': '⚙️', 'appx': '⚙️',
  
  // 代码类型
  'js': '💻', 'ts': '💻', 'jsx': '💻', 'tsx': '💻',
  'html': '🌐', 'css': '🎨', 'scss': '🎨', 'less': '🎨', 'sass': '🎨',
  'py': '🐍', 'java': '☕', 'cpp': '💻', 'c': '💻', 'cs': '💻',
  'php': '💻', 'rb': '💎', 'go': '🐹', 'rs': '🦀', 'swift': '🦉',
  'kt': '💜', 'dart': '🎯',
  
  // 配置文件
  'json': '⚙️', 'xml': '⚙️', 'yaml': '⚙️', 'yml': '⚙️',
  'toml': '⚙️', 'ini': '⚙️', 'cfg': '⚙️', 'conf': '⚙️',
  
  // 数据库
  'db': '🗄️', 'sqlite': '🗄️', 'sql': '🗄️'
}

/**
 * 根据应用名称获取图标
 */
export function getAppIcon(appName: string): string {
  const name = appName.toLowerCase()
  
  // 精确匹配
  if (APP_ICON_MAP[name]) {
    return APP_ICON_MAP[name]
  }
  
  // 模糊匹配
  for (const [key, icon] of Object.entries(APP_ICON_MAP)) {
    if (name.includes(key)) {
      return icon
    }
  }
  
  return '🚀' // 默认应用图标
}

/**
 * 根据文件名获取图标
 */
export function getFileIcon(fileName: string, fileType: 'file' | 'folder' = 'file'): string {
  if (fileType === 'folder') {
    return '📁'
  }
  
  const ext = fileName.toLowerCase().split('.').pop() || ''
  return FILE_TYPE_ICON_MAP[ext] || '📄'
}

/**
 * 获取文件扩展名
 */
export function getFileExtension(fileName: string): string {
  return fileName.toLowerCase().split('.').pop() || ''
}

/**
 * 判断是否为媒体文件
 */
export function isMediaFile(fileName: string): boolean {
  const ext = getFileExtension(fileName)
  const mediaExtensions = [
    'jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp', 'ico', 'tiff', // 图片
    'mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm', 'm4v', 'mpg', 'mpeg', // 视频
    'mp3', 'wav', 'flac', 'aac', 'ogg', 'wma', 'm4a', 'aiff' // 音频
  ]
  return mediaExtensions.includes(ext)
}

/**
 * 判断是否为代码文件
 */
export function isCodeFile(fileName: string): boolean {
  const ext = getFileExtension(fileName)
  const codeExtensions = [
    'js', 'ts', 'jsx', 'tsx', 'html', 'css', 'scss', 'less', 'sass',
    'py', 'java', 'cpp', 'c', 'cs', 'php', 'rb', 'go', 'rs', 'swift',
    'kt', 'dart', 'json', 'xml', 'yaml', 'yml', 'toml', 'ini', 'cfg', 'conf'
  ]
  return codeExtensions.includes(ext)
}

/**
 * 智能图标选择器
 * 综合考虑文件名、路径等信息选择最合适的图标
 */
export function getSmartIcon(filePath: string): string {
  const fileName = filePath.split(/[\\\/]/).pop() || ''
  const isExecutable = fileName.toLowerCase().endsWith('.exe')
  
  if (isExecutable) {
    // 对于可执行文件，尝试从应用名称获取图标
    const appName = fileName.replace(/\.(exe|lnk)$/i, '')
    return getAppIcon(appName)
  }
  
  // 其他文件使用文件图标
  return getFileIcon(fileName)
}

