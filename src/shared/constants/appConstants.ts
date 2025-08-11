/**
 * 应用程序常量配置
 */

// 窗口配置
export const WINDOW_CONFIG = {
  DEFAULT_WIDTH: 800,
  DEFAULT_HEIGHT: 611,
  MIN_WIDTH: 600,
  MAX_WIDTH: 1200,
  MIN_HEIGHT: 60,
  MAX_HEIGHT: 800,
  BORDER_RADIUS: 12,
  SHADOW_BLUR: 20
} as const

// 搜索配置
export const SEARCH_CONFIG = {
  MAX_RESULTS: 18,
  DEFAULT_MAX_RESULTS: 8,
  DEBOUNCE_DELAY: 300,
  MIN_QUERY_LENGTH: 1,
  MAX_QUERY_LENGTH: 100,
  HISTORY_MAX_SIZE: 50,
  FUZZY_THRESHOLD: 0.3,
  // 拼音搜索配置
  PINYIN_ENABLED: true,
  PINYIN_THRESHOLD_FUZZY: 50,    // 模糊搜索时的拼音匹配阈值
  PINYIN_THRESHOLD_EXACT: 70,    // 精确搜索时的拼音匹配阈值
  PINYIN_CACHE_SIZE: 1000,       // 拼音缓存大小
  PINYIN_CACHE_TTL: 300000       // 拼音缓存过期时间(5分钟)
} as const

// UI配置
export const UI_CONFIG = {
  ANIMATION_DURATION: 200,
  GRID_GAP: 10,
  ITEM_MIN_HEIGHT: 90,
  CONTAINER_PADDING: 32,
  BORDER_RADIUS: 8,
  ITEMS_PER_ROW: 6,
  MAX_ROWS: 3
} as const

// 主题配置
export const THEME_CONFIG = {
  DEFAULT_THEME: 'auto' as const,
  DEFAULT_TRANSPARENCY: 95,
  MIN_TRANSPARENCY: 70,
  MAX_TRANSPARENCY: 100,
  ANIMATION_ENABLED: true
} as const

// 快捷键配置
export const HOTKEY_CONFIG = {
  GLOBAL_TOGGLE: 'Alt+Space',
  QUICK_CALCULATOR: 'Ctrl+=',
  FILE_SEARCH: 'Ctrl+F',
  CLEAR_SEARCH: 'Escape',
  NAVIGATE_UP: 'ArrowUp',
  NAVIGATE_DOWN: 'ArrowDown',
  EXECUTE: 'Enter'
} as const

// 扩展配置
export const EXTENSION_CONFIG = {
  EXTENSIONS_DIR: 'extensions',
  MANIFEST_FILE: 'manifest.json',
  PACKAGE_FILE: 'package.json',
  ENABLED_FILE: 'enabled.json',
  MAX_NAME_LENGTH: 50,
  MAX_DESCRIPTION_LENGTH: 200
} as const

// 系统路径配置（Windows）
export const SYSTEM_PATHS = {
  WINDOWS: {
    START_MENU: [
      'C:\\ProgramData\\Microsoft\\Windows\\Start Menu\\Programs',
      'C:\\Users\\%USERNAME%\\AppData\\Roaming\\Microsoft\\Windows\\Start Menu\\Programs'
    ],
    PROGRAM_FILES: [
      'C:\\Program Files',
      'C:\\Program Files (x86)'
    ],
    USER_FOLDERS: [
      '%USERPROFILE%\\Desktop',
      '%USERPROFILE%\\Documents', 
      '%USERPROFILE%\\Downloads',
      '%USERPROFILE%\\Pictures',
      '%USERPROFILE%\\Videos',
      '%USERPROFILE%\\Music'
    ]
  }
} as const

// 文件类型分类
export const FILE_CATEGORIES = {
  DOCUMENTS: ['txt', 'doc', 'docx', 'pdf', 'rtf', 'odt'],
  IMAGES: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp', 'ico', 'tiff'],
  VIDEOS: ['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm', 'm4v'],
  AUDIO: ['mp3', 'wav', 'flac', 'aac', 'ogg', 'wma', 'm4a'],
  ARCHIVES: ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz'],
  EXECUTABLES: ['exe', 'msi', 'app', 'deb', 'dmg', 'pkg'],
  CODE: ['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'py', 'java', 'cpp', 'c'],
  CONFIG: ['json', 'xml', 'yaml', 'yml', 'toml', 'ini', 'cfg', 'conf']
} as const

// 网络搜索引擎
export const SEARCH_ENGINES = {
  GOOGLE: 'https://www.google.com/search?q=',
  BING: 'https://www.bing.com/search?q=',
  BAIDU: 'https://www.baidu.com/s?wd=',
  DUCKDUCKGO: 'https://duckduckgo.com/?q='
} as const

// 错误消息
export const ERROR_MESSAGES = {
  SEARCH_FAILED: '搜索失败，请稍后重试',
  EXTENSION_LOAD_FAILED: '扩展加载失败',
  FILE_NOT_FOUND: '文件未找到',
  PERMISSION_DENIED: '权限不足',
  NETWORK_ERROR: '网络连接错误',
  UNKNOWN_ERROR: '未知错误'
} as const

// 成功消息
export const SUCCESS_MESSAGES = {
  EXTENSION_INSTALLED: '扩展安装成功',
  EXTENSION_UNINSTALLED: '扩展卸载成功',
  EXTENSION_ENABLED: '扩展启用成功',
  EXTENSION_DISABLED: '扩展禁用成功',
  SETTINGS_EXPORTED: '设置导出成功',
  SETTINGS_RESET: '设置重置成功'
} as const

// 开发环境配置
export const DEV_CONFIG = {
  DEV_SERVER_PORT: 5174,
  DEV_SERVER_HOST: 'localhost',
  ENABLE_DEV_TOOLS: process.env.NODE_ENV === 'development',
  HOT_RELOAD: true
} as const

// 性能配置
export const PERFORMANCE_CONFIG = {
  ICON_CACHE_SIZE: 1000, // 增加图标缓存数量
  SEARCH_DEBOUNCE: 300,
  MAX_CONCURRENT_SEARCHES: 3,
  MEMORY_CLEANUP_INTERVAL: 600000 // 10分钟
} as const

// 类型定义
export type ThemeMode = typeof THEME_CONFIG.DEFAULT_THEME
export type SearchEngine = keyof typeof SEARCH_ENGINES
