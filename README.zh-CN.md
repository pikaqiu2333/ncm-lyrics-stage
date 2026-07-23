# NCM Lyrics Stage：网易云歌词全屏舞台

[English](README.md) | 简体中文

`NCM Lyrics Stage` 是一个本地优先的产品原型，将网易云音乐歌词变成沉浸式全屏表演舞台。

![NCM Lyrics Stage 展示图](docs/showcase.png)

项目由三部分组成：

- 支持逐词与逐行呈现的前端歌词舞台
- 本地 `ncm-cli` 桥接层，用于代理播放状态、歌词数据和基础控制
- 布局审计脚本，用于检查不同歌词组合是否仍能完整适配舞台

这是一个独立原型，并非网易云音乐官方项目。

## 为什么适合演示

演示目前提供三种可用模式：

- `bridge` 模式：连接本地 `ncm-cli` 桥接层，与真实播放状态同步
- `preview` 模式：按歌曲 ID 渲染指定的本地缓存歌词文件
- `mock` 模式：渲染内置演示曲目，让项目在全新环境中也能直接运行

如果桥接层离线，或尚未配置 `ncm-cli`，页面会自动回退到内置演示歌词，而不是显示空白舞台。

## 产品形态

它不只是一个桥接层。

这是一个完整的产品原型，包含：

- 可视化歌词播放器
- 本地集成层
- 用于布局验证的审计工具

因此，它适合用于产品演示、交互评审和 GitHub 作品展示。

## 快速开始

运行要求：

- Node.js 18+
- 可选：如果需要与网易云音乐真实播放状态同步，请安装并配置 `ncm-cli`

启动演示：

```bash
npm run lyrics:demo
```

也可以启动后直接打开展示页面：

```bash
npm run lyrics:demo:open
```

Windows PowerShell 快捷命令：

```powershell
.\scripts\start-lyrics-demo.ps1
```

## 常用地址

启动后，桥接层默认在 `http://127.0.0.1:3210/` 提供应用页面。

- 实时桥接模式：[http://127.0.0.1:3210/](http://127.0.0.1:3210/)
- 内置英文演示：[http://127.0.0.1:3210/?mode=mock&track=tiptoes-after-midnight](http://127.0.0.1:3210/?mode=mock&track=tiptoes-after-midnight)
- 内置中文演示：[http://127.0.0.1:3210/?mode=mock&track=moonlit-echo](http://127.0.0.1:3210/?mode=mock&track=moonlit-echo)
- 缓存歌词预览示例：`http://127.0.0.1:3210/?preview=1&songId=<netease-song-id>`

## 可用命令

```bash
npm run lyrics:bridge
npm run lyrics:audit
```

`npm run lyrics:audit` 默认使用内置演示曲目，因此即使本地没有网易云歌词缓存文件也可以运行。

## 配置

桥接层默认监听 `127.0.0.1:3210`。

可以通过环境变量修改端口：

```bash
NCM_WEB_DEMO_PORT=3220 npm run lyrics:demo
```

Windows PowerShell：

```powershell
$env:NCM_WEB_DEMO_PORT = "3220"
npm run lyrics:demo
```

## HTTP 接口

- `GET /api/health`
- `GET /api/status`
- `GET /api/snapshot`
- `GET /api/lyrics/current`
- `GET /api/lyrics/song?id=<song-id>`
- `POST /api/control/toggle`
- `POST /api/control/next`
- `POST /api/control/prev`

## 许可证

MIT
