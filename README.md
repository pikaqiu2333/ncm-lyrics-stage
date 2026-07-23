# NCM Lyrics Stage

`NCM Lyrics Stage` is a local-first product prototype that turns NetEase Cloud Music lyrics into a full-screen performance surface.

**中文简介：** 一个本地优先的网易云音乐歌词舞台原型，将逐词 / 逐行歌词、播放状态与沉浸式全屏视觉融合在一起。

![NCM Lyrics Stage showcase](docs/showcase.png)

It combines three parts:

- a front-end lyric stage with word-by-word and line-by-line presentation
- a local `ncm-cli` bridge that proxies playback state, lyric payloads, and basic controls
- layout-audit scripts for checking whether different lyric compositions still fit the stage

This is an independent prototype. It is not an official NetEase Cloud Music project.

## What Makes This Repo Demo-Friendly

The demo now has three usable modes:

- `bridge` mode: connect to the local `ncm-cli` bridge and sync with real playback
- `preview` mode: render a specific cached lyric file by song ID
- `mock` mode: render built-in demo tracks so the project still works on a fresh machine

If the bridge is offline or `ncm-cli` is not configured yet, the page falls back to built-in demo lyrics instead of showing a blank stage.

## Product Shape

This is not just a bridge.

It is a product prototype with:

- a visual lyric player
- a local integration layer
- audit tooling for layout validation

That makes it suitable for product demos, interaction review, and GitHub portfolio presentation.

## Quick Start

Requirements:

- Node.js 18+
- Optional: `ncm-cli` if you want real NetEase playback sync

Start the demo:

```bash
npm run lyrics:demo
```

Or start and open the showcase page directly:

```bash
npm run lyrics:demo:open
```

Windows PowerShell shortcut:

```powershell
.\scripts\start-lyrics-demo.ps1
```

## Useful URLs

After startup the bridge serves the app on `http://127.0.0.1:3210/` by default.

- Live bridge mode: [http://127.0.0.1:3210/](http://127.0.0.1:3210/)
- Built-in mock demo: [http://127.0.0.1:3210/?mode=mock&track=tiptoes-after-midnight](http://127.0.0.1:3210/?mode=mock&track=tiptoes-after-midnight)
- Chinese lyric demo: [http://127.0.0.1:3210/?mode=mock&track=moonlit-echo](http://127.0.0.1:3210/?mode=mock&track=moonlit-echo)
- Cached lyric preview example: `http://127.0.0.1:3210/?preview=1&songId=<netease-song-id>`

## Available Commands

```bash
npm run lyrics:bridge
npm run lyrics:audit
```

`npm run lyrics:audit` uses the built-in mock tracks by default, so it works even without local NetEase lyric cache files.

## Configuration

The bridge listens on `127.0.0.1:3210` by default.

You can override the port:

```bash
NCM_WEB_DEMO_PORT=3220 npm run lyrics:demo
```

On Windows PowerShell:

```powershell
$env:NCM_WEB_DEMO_PORT = "3220"
npm run lyrics:demo
```

## HTTP Endpoints

- `GET /api/health`
- `GET /api/status`
- `GET /api/snapshot`
- `GET /api/lyrics/current`
- `GET /api/lyrics/song?id=<song-id>`
- `POST /api/control/toggle`
- `POST /api/control/next`
- `POST /api/control/prev`

## License

MIT
