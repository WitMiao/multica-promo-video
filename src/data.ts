import { AGENTS, CardData, HUMANS, Status } from "./components/ui";

export const COLUMNS: Status[] = ["backlog", "todo", "in_progress", "in_review", "done"];

// Demo workspace. Every issue, person and agent here is fictional.
export const HERO_ID = "NEB-128";

export const BOARD_CARDS: CardData[] = [
  { id: "NEB-131", title: "为 CLI 增加 --output json 选项", status: "backlog", who: AGENTS.cursor, priority: 1, lines: 1, updated: "6 分钟前" },
  { id: "NEB-127", title: "梳理各提供方的会话恢复协议", status: "backlog", who: AGENTS.kimi, priority: 2, lines: 1, updated: "9 分钟前" },
  { id: "NEB-125", title: "根据服务端路由自动生成 OpenAPI 规范并发布到文档站", status: "backlog", who: AGENTS.codex, priority: 2, updated: "12 分钟前" },
  { id: "NEB-123", title: "审计未使用的功能开关", status: "backlog", who: HUMANS.wang, priority: 1, lines: 1, updated: "1 小时前" },

  { id: HERO_ID, title: "为 webhook 投递加入指数退避重试", status: "todo", priority: 3, lines: 1, updated: "刚刚" },
  { id: "NEB-126", title: "修复切换工作区时的界面闪烁", status: "todo", who: HUMANS.lin, priority: 2, lines: 1, updated: "5 分钟前" },
  { id: "NEB-124", title: "准备 Q4 团队共创会议程", status: "todo", who: HUMANS.su, priority: 1, lines: 1, updated: "20 分钟前" },

  { id: "NEB-122", title: "用订阅替换运行时健康轮询", status: "in_progress", who: AGENTS.claude, working: true, priority: 3, lines: 1, updated: "1 分钟前" },
  { id: "NEB-121", title: "把新手引导翻译成英文和日文，并同步到文档站", status: "in_progress", who: AGENTS.kimi, working: true, priority: 2, updated: "2 分钟前" },
  { id: "NEB-119", title: "撰写 v0.6 发布说明", status: "in_progress", who: HUMANS.wang, priority: 2, lines: 1, updated: "8 分钟前" },

  { id: "NEB-118", title: "排查长任务的 token 统计偏差", status: "in_review", who: AGENTS.qwen, working: true, priority: 4, lines: 1, updated: "3 分钟前" },
  { id: "NEB-116", title: "为小队功能撰写上手指南", status: "in_review", who: AGENTS.claude, priority: 2, lines: 1, updated: "15 分钟前" },

  { id: "NEB-112", title: "接入 GitHub Actions 流水线", status: "done", who: AGENTS.codex, priority: 3, lines: 1, updated: "1 小时前" },
  { id: "NEB-110", title: "重构 API 错误处理中间件", status: "done", who: AGENTS.opencode, priority: 2, lines: 1, updated: "2 小时前" },
];

export const WORKING_AVATARS = [AGENTS.claude, AGENTS.kimi, AGENTS.qwen];
