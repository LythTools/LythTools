# LythTools

一个类似Wox的Electron搜索工具，使用React + TypeScript + Tailwind CSS构建。

## 功能特性

- 🚀 **快速启动**: 使用 `Alt+Space` 快捷键快速唤起
- 🔍 **智能搜索**: 支持模糊搜索和数学计算
- 🎨 **现代界面**: 无边框设计，毛玻璃效果
- ⚡ **高性能**: 基于Electron + React + Vite构建
- 🎯 **类似Wox**: 熟悉的操作体验

## 技术栈

### 核心框架
- **Electron 37.2.4** - 桌面应用框架
- **React 19.1.0** - UI框架  
- **TypeScript 5.8.3** - 类型安全
- **Vite 7.0.5** - 构建工具

### 样式和动画
- **Tailwind CSS 4.1.11** - 工具类CSS框架
- **Framer Motion 12.23.7** - 声明式动画库
- **PostCSS + Autoprefixer** - CSS处理

### 状态管理和搜索
- **Zustand 5.0.6** - 轻量级状态管理
- **Fuse.js 7.1.0** - 模糊搜索引擎
- **Electron Store 10.1.0** - 本地数据存储

### 开发工具
- **ESLint + Prettier** - 代码规范
- **Electron Builder 26.0.12** - 应用打包

## 快速开始

### 安装依赖
```bash
npm install
```

### 开发环境
```bash
# 启动开发环境（同时启动渲染进程和主进程）
npm run dev

# 或者分别启动
npm run dev:renderer  # 启动Vite开发服务器
npm run dev:main      # 启动Electron主进程
```

### 构建应用
```bash
# 构建所有组件
npm run compile

# 仅构建渲染进程
npm run build:renderer

# 仅构建主进程
npm run build:main

# 仅构建预加载脚本
npm run build:preload
```

### 打包分发
```bash
# 打包为可安装程序
npm run dist

# 仅打包不安装
npm run pack

# 平台特定打包
npm run dist:win    # Windows
npm run dist:mac    # macOS  
npm run dist:linux  # Linux
```

## 使用说明

### 基本操作
1. 按 `Alt+Space` 唤起搜索框
2. 输入关键词进行搜索
3. 使用 `↑↓` 键导航结果
4. 按 `Enter` 执行选中项
5. 按 `Esc` 隐藏窗口

### 搜索功能
- **应用搜索**: 搜索系统已安装的应用程序
- **文件搜索**: 搜索文件和文件夹
- **数学计算**: 输入数学表达式进行计算
- **系统命令**: 执行系统相关操作

### 快捷键
- `Alt+Space`: 显示/隐藏搜索框
- `↑↓`: 导航搜索结果
- `Enter`: 执行选中项
- `Esc`: 隐藏窗口或清空搜索

## 项目结构

```
src/
├── main/           # Electron主进程
│   ├── main.ts     # 主进程入口
│   └── utils.ts    # 工具函数
├── preload/        # 预加载脚本
│   └── preload.ts  # 渲染进程API桥接
├── renderer/       # React渲染进程
│   └── src/
│       ├── components/  # React组件
│       ├── stores/      # Zustand状态管理
│       ├── types/       # TypeScript类型定义
│       ├── App.tsx      # 主应用组件
│       ├── main.tsx     # React入口
│       └── index.css    # 全局样式
└── shared/         # 共享代码
```

## 开发指南

### 添加新的搜索功能
1. 在 `src/renderer/src/stores/searchStore.ts` 中添加搜索逻辑
2. 在 `src/renderer/src/types/index.ts` 中定义相关类型
3. 更新搜索结果处理逻辑

### 自定义样式
- 修改 `tailwind.config.js` 配置主题
- 在 `src/renderer/src/index.css` 中添加自定义样式
- 使用Tailwind工具类进行快速样式开发

### 窗口行为配置
- 在 `src/main/main.ts` 中修改窗口属性
- 调整窗口大小、位置、透明度等设置

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request！
