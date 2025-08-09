# LythTools

一个类似Utools的多功能工具，使用React + TypeScript + Tailwind CSS开发。

**当前项目还在开发中，敬请期待！**

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
- **Zustand 5.0.6** - 状态管理
- **Fuse.js 7.1.0** - 搜索引擎
- **Electron Store 10.1.0** - 数据存储

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
npm run dev# 启动开发环境
npm run dev:main      # 启动Electron主进程
```

### 构建应用
```bash
# 构建所有组件
npm run compile

# 仅构建主进程
npm run build:main

# 仅构建预加载脚本
npm run build:preload
```

### 打包分发
```bash
# 打包为可安装程序
npm run dist

# 平台特定打包
npm run dist:win    # Windows
npm run dist:mac    # macOS  
npm run dist:linux  # Linux
```


## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request！
