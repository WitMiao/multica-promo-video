# Multica 宣传片

90 秒、1920×1080、60 fps 的产品宣传片。画面用 [Remotion](https://www.remotion.dev)（React）逐帧渲染，配乐与音效全部由 `audio/` 里的 Python 脚本从零合成，没有使用任何第三方音频素材。中文旁白由本机运行的开源模型 [Qwen3-TTS](https://github.com/QwenLM/Qwen3-TTS)（Apache-2.0）合成，不经过任何云端服务。

片中的产品界面按 Multica `packages/ui` 的设计 token 用 React 矢量重建，数据全部虚构（工作区 Nebula Labs、任务 NEB-xxx、成员林舟/王一/苏禾），不含任何真实项目或账号信息。

![海报](dist/poster.jpg)

## 成品

[`dist/multica-promo.mp4`](dist/multica-promo.mp4)：H.264 + AAC 320 kbps，响度 −14 LUFS / 峰值 −1.6 dBFS。

本仓库从 [multica-ai/multica](https://github.com/multica-ai/multica) 的 `promo-video/` 目录导出，保留了原提交历史；另外附带了生成好的素材（`public/` 下的配乐、音效、旁白、字体子集、插画、颗粒纹理），克隆后不必重新合成即可渲染。`*.mp4` 与 `*.wav` 用 Git LFS 存放，克隆前先安装 `git-lfs`。

## 音色试听

`voice-samples/` 里是 Qwen3-TTS 五个中文预设音色的试听，每个念两句片中台词（"让人和 AI 智能体，成为一支真正的团队。""你的下一批员工，不是人类。"），处理链与成片旁白相同：

| 文件 | 音色 |
| --- | --- |
| [1-Uncle_Fu-男-低沉醇厚(当前).wav](<voice-samples/1-Uncle_Fu-男-低沉醇厚(当前).wav>) | 男声，低沉醇厚；成片当前使用 |
| [2-Dylan-男-年轻京腔.wav](voice-samples/2-Dylan-男-年轻京腔.wav) | 男声，年轻，带京腔 |
| [3-Eric-男-明亮川味.wav](voice-samples/3-Eric-男-明亮川味.wav) | 男声，明亮，带川味 |
| [4-Vivian-女.wav](voice-samples/4-Vivian-女.wav) | 女声 |
| [5-Serena-女.wav](voice-samples/5-Serena-女.wav) | 女声 |

换音色时改 `src/narration.json` 里的 `voice.speaker`，再运行 `npm run voice` 重做全部旁白。

## 构建

```bash
npm run setup   # Node 依赖、Python venv、字体、插画、颗粒纹理、音效与配乐
npm run studio  # 在浏览器里逐帧预览、调整
npm run build   # 渲染并母带处理，输出 out/multica-promo.mp4
```

本仓库已带齐生成素材，`npm install` 后直接 `npm run build` 即可出片；`setup` 会跳过已存在的插画与旁白，只有重新生成旁白才需要下载约 5 GB 语音模型。改了旁白稿 `src/narration.json` 后运行 `npm run voice`（可只传要重做的句子 id，如 `npm run voice -- p4 c2`），改了配乐或音效后运行 `npm run sound`，改了画面上的中文文案后重跑 `audio/.venv/bin/python scripts/subset-fonts.py`（CJK 字体按实际用字子集化）。

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
| `src/narration.json` | 旁白稿：每句的起始时间、可用时长、念法、画面字幕写法，以及是否显示底部字幕 |
| `audio/vo.py` | 旁白（音色 Dylan）：每句生成多条候选，用 Qwen3-ASR 转写后按带声调拼音比对，单独听和叠上该处配乐后都要念对，再挑时长合适的一条；处理后用 Qwen3-ForcedAligner 对齐出逐字时间（驱动字幕高亮），写入 `public/vo/` 与 `src/vo-timing.json` |
| `audio/cues.py` | 测量每个音效相对配乐的电平，用于校准 `Sfx.tsx` |
| `scripts/finalize.sh` | 两遍 EBU R128 响度标准化到 −14 LUFS / −1.5 dBTP，封装 MP4 |
| `scripts/stills.mjs`、`scripts/vsheet.sh` | 审片用：批量渲染静帧、从成片抽帧拼图 |

## 素材来源

- 插画与 Logo：Multica 仓库 `apps/web/public/images`、`apps/web/public/favicon.svg`
- 智能体与渠道图标：Multica 仓库 `packages/views` 中的官方图标组件；Docker、Kubernetes、Helm、GitHub、GitLab、Gitea、Forgejo 来自 [simple-icons](https://simpleicons.org)（CC0）
- 字体：Noto Serif SC、Noto Sans SC、Inter、Instrument Serif、Geist Mono，均为 SIL Open Font License
