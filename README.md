# Multica 宣传片

90 秒、1920×1080、60 fps 的产品宣传片。画面用 [Remotion](https://www.remotion.dev)（React）逐帧渲染，配乐与音效全部由 `audio/` 里的 Python 脚本从零合成，没有使用任何第三方音频素材。

片中的产品界面按 `packages/ui` 的设计 token 用 React 矢量重建，数据全部虚构（工作区 Nebula Labs、任务 NEB-xxx、成员林舟/王一/苏禾），不含任何真实项目或账号信息。

## 构建

```bash
npm run setup   # Node 依赖、Python venv、字体、插画、颗粒纹理、音效与配乐
npm run studio  # 在浏览器里逐帧预览、调整
npm run build   # 渲染并母带处理，输出 out/multica-promo.mp4
```

`setup` 只需运行一次；改了配乐或音效后运行 `npm run sound`，改了画面上的中文文案后重跑 `audio/.venv/bin/python scripts/subset-fonts.py`（CJK 字体按实际用字子集化）。

## 结构

| 路径 | 作用 |
| --- | --- |
| `src/timeline.ts` | 120 BPM 节拍网格（1 拍 = 30 帧，1 小节 = 120 帧）与 17 个场景的起止小节 |
| `src/scenes/` | 各场景：开场痛点、Logo 揭幕、看板、派活、7 个功能、与 Claude Code / Codex 终端 CLI 和桌面客户端的对比、片尾 |
| `src/components/` | 重建的产品 UI、终端、字幕动效、运镜、音效挂载（`Sfx.tsx` 含按测量校准的电平表） |
| `src/brand/` | 从仓库复制的 Logo 与渠道图标 |
| `audio/dsp.py` | 振荡器、包络、零延迟状态变量滤波器（numba）、效果器 |
| `audio/sfx.py` | 34 个音效：打字、弹出、点击、whoosh、冲击、提示音等 |
| `audio/music.py` | 配乐：与分镜同一网格的编曲（开场张力 → 揭幕 → 律动 → 抽离 → 重建 → drop → 收尾） |
| `audio/cues.py` | 测量每个音效相对配乐的电平，用于校准 `Sfx.tsx` |
| `scripts/finalize.sh` | 两遍 EBU R128 响度标准化到 −14 LUFS / −1.5 dBTP，封装 MP4 |
| `scripts/stills.mjs`、`scripts/vsheet.sh` | 审片用：批量渲染静帧、从成片抽帧拼图 |

## 素材来源

- 插画与 Logo：本仓库 `apps/web/public/images`、`apps/web/public/favicon.svg`
- 智能体与渠道图标：本仓库 `packages/views` 中的官方图标组件；Docker、Kubernetes、Helm、GitHub、GitLab、Gitea、Forgejo 来自 [simple-icons](https://simpleicons.org)（CC0）
- 字体：Noto Serif SC、Noto Sans SC、Inter、Instrument Serif、Geist Mono，均为 SIL Open Font License
