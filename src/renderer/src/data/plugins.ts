import { ExtensionManifest } from '../types'

// 插件数据类型定义（兼容旧版本）
export interface Plugin {
  id: string
  name: string
  description: string
  version: string
  author: string
  icon: string
  status: 'installed' | 'available'
  category: string
  downloads: number
  rating: number
  size: string
  lastUpdated: string
  features: string[]
  screenshots: string[]
  changelog: {
    version: string
    date: string
    changes: string[]
  }[]
  enabled?: boolean
}

// 扩展类型（新版本）
export type Extension = ExtensionManifest & {
  downloads?: number
  rating?: number
  size?: string
  lastUpdated?: string
  features?: string[]
  screenshots?: string[]
  changelog?: {
    version: string
    date: string
    changes: string[]
  }[]
}

// 插件数据
export const pluginsData: Plugin[] = [
  {
    id: "file-search",
    name: "文件搜索",
    version: "1.2.0",
    author: "Lythrilla",
    description: "快速搜索本地文件和文件夹，支持多种文件格式和高级过滤",
    category: "工具",
    status: "installed",
    icon: "📁",
    size: "2.3 MB",
    downloads: 100000000,
    rating: 4.8,
    lastUpdated: "2025-07-15",
    features: [
      "支持多种文件格式搜索",
      "实时搜索结果预览",
      "高级过滤和排序",
      "快捷键支持"
    ],
    screenshots: [
      "/images/file-search-1.png",
      "/images/file-search-2.png"
    ],
    changelog: [
      {
        version: "1.2.0",
        date: "2025-07-15",
        changes: [
          "新增实时预览功能",
          "优化搜索性能",
          "修复已知问题"
        ]
      },
      {
        version: "1.1.0",
        date: "2025-07-15",
        changes: [
          "添加高级过滤选项",
          "支持更多文件格式"
        ]
      }
    ]
  },
  {
    id: "calculator",
    name: "计算器",
    version: "2.1.5",
    author: "Lythrilla",
    description: "强大的科学计算器，支持基础运算、科学计算和程序员模式",
    category: "工具",
    status: "installed",
    icon: "🧮",
    size: "1.8 MB",
    downloads: 28750,
    rating: 4.9,
    lastUpdated: "2025-07-15",
    features: [
      "基础四则运算",
      "科学计算功能",
      "程序员模式（进制转换）",
      "历史记录保存"
    ],
    screenshots: [
      "/images/calculator-1.png",
      "/images/calculator-2.png"
    ],
    changelog: [
      {
        version: "2.1.5",
        date: "2025-07-15",
        changes: [
          "修复除零错误处理",
          "优化界面响应速度"
        ]
      }
    ]
  },
  {
    id: "color-picker",
    name: "颜色选择器",
    version: "1.0.8",
    author: "Lythrilla",
    description: "屏幕取色工具，支持多种颜色格式输出和调色板管理",
    category: "设计",
    status: "installed",
    icon: "🎨",
    size: "1.2 MB",
    downloads: 9830,
    rating: 4.6,
    lastUpdated: "2025-07-15",
    features: [
      "屏幕任意位置取色",
      "支持RGB、HEX、HSL等格式",
      "调色板管理",
      "颜色历史记录"
    ],
    screenshots: [
      "/images/color-picker-1.png"
    ],
    changelog: [
      {
        version: "1.0.8",
        date: "2025-07-15",
        changes: [
          "新增HSL颜色格式支持",
          "优化取色精度"
        ]
      }
    ]
  },
  {
    id: "text-editor",
    name: "文本编辑器",
    version: "3.2.1",
    author: "Lythrilla",
    description: "轻量级文本编辑器，支持语法高亮和多标签页编辑",
    category: "开发",
    status: "available",
    icon: "📝",
    size: "4.1 MB",
    downloads: 45200,
    rating: 4.7,
    lastUpdated: "2025-07-15",
    features: [
      "语法高亮支持",
      "多标签页编辑",
      "代码折叠",
      "查找替换功能"
    ],
    screenshots: [
      "/images/text-editor-1.png",
      "/images/text-editor-2.png"
    ],
    changelog: [
      {
        version: "3.2.1",
        date: "2025-07-15",
        changes: [
          "新增Python语法高亮",
          "优化大文件打开速度",
          "修复查找替换bug"
        ]
      }
    ]
  },
  {
    id: "password-generator",
    name: "密码生成器",
    version: "1.5.2",
    author: "Lythrilla",
    description: "生成安全的随机密码，支持自定义规则和强度检测",
    category: "安全",
    status: "available",
    icon: "🔐",
    size: "0.8 MB",
    downloads: 12400,
    rating: 4.8,
    lastUpdated: "2025-07-15",
    features: [
      "自定义密码规则",
      "密码强度检测",
      "批量生成密码",
      "安全随机算法"
    ],
    screenshots: [
      "/images/password-generator-1.png"
    ],
    changelog: [
      {
        version: "1.5.2",
        date: "2025-07-15",
        changes: [
          "增强随机算法安全性",
          "新增密码强度可视化"
        ]
      }
    ]
  }
]

// 获取所有插件
export const getAllPlugins = (): Plugin[] => {
  return pluginsData
}

// 根据ID获取插件
export const getPluginById = (id: string): Plugin | undefined => {
  return pluginsData.find(plugin => plugin.id === id)
}

// 获取已安装的插件
export const getInstalledPlugins = (): Plugin[] => {
  return pluginsData.filter(plugin => plugin.status === 'installed')
}

// 获取可用的插件
export const getAvailablePlugins = (): Plugin[] => {
  return pluginsData.filter(plugin => plugin.status === 'available')
}

// 根据分类获取插件
export const getPluginsByCategory = (category: string): Plugin[] => {
  if (category === 'all') return pluginsData
  return pluginsData.filter(plugin => plugin.category === category)
}

// 搜索插件
export const searchPlugins = (query: string): Plugin[] => {
  const lowercaseQuery = query.toLowerCase()
  return pluginsData.filter(plugin =>
    plugin.name.toLowerCase().includes(lowercaseQuery) ||
    plugin.description.toLowerCase().includes(lowercaseQuery) ||
    plugin.author.toLowerCase().includes(lowercaseQuery)
  )
}
