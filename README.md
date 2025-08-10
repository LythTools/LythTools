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
- 外部扩展协议（进程型，任意语言）：通过 stdin/stdout JSON 通信注册列表项/菜单/窗口

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
npm run dev           # 启动开发环境
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
## 扩展开发（示例）

在用户数据目录 `extensions/your.extension.id/` 创建扩展，包含 `manifest.json` 与可执行脚本。

示例 `manifest.json`：

```json
{
  "id": "sample.hello",
  "name": "Hello World",
  "version": "1.0.0",
  "author": "You",
  "icon": "👋",
  "category": "tools",
  "permissions": [],
  "commands": [],
  "settings": [],
  "entry": {
    "type": "process",
    "command": "node",
    "args": ["server.js"]
  }
}
```

示例 `server.js`（Node 任意语言均可，协议一致）：

```js
// 简易扩展示例：输出ready -> 接收init -> 注册贡献 -> 处理命令
process.stdout.write(JSON.stringify({ type: 'ready' }) + '\n')

const send = (msg) => process.stdout.write(JSON.stringify(msg) + '\n')

let inited = false
process.stdin.setEncoding('utf-8')
process.stdin.on('data', (chunk) => {
  chunk.split('\n').forEach(line => {
    if (!line.trim()) return
    const msg = JSON.parse(line)
    if (msg.type === 'init' && !inited) {
      inited = true
      // 注册列表项、菜单、窗口
      send({
        type: 'register',
        contributions: {
          listItems: [
            { id: 'hello', title: 'Hello from Extension', description: 'Click to log', icon: '👋', command: 'logHello' }
          ],
          menus: [
            { id: 'ext.menu.hello', label: 'Say Hello', command: 'logHello' }
          ],
          windows: [
            { id: 'ext.win.about', title: 'About Hello', file: 'about.html', width: 480, height: 320 }
          ]
        }
      })
      // 心跳（可选）
      setInterval(() => send({ type: 'heartbeat' }), 10000)
    } else if (msg.type === 'command') {
      if (msg.command === 'logHello') {
        send({ type: 'log', level: 'info', message: 'Hello command executed!' })
      }
    }
  })
})
```

将 `about.html` 与 `server.js` 放在扩展目录下即可。

# 平台特定打包
npm run dist:win    # Windows
npm run dist:mac    # macOS  
npm run dist:linux  # Linux
```


## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request！
