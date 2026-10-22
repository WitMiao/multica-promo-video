import React from "react";
import {
  BookOpen,
  Bot,
  ChartColumn,
  ChevronDown,
  CircleUser,
  Columns3,
  Ellipsis,
  Filter,
  FolderKanban,
  Inbox,
  ListTodo,
  MessageSquare,
  Monitor,
  Plus,
  Search,
  Settings,
  SlidersHorizontal,
  SquarePen,
  Users,
  Zap,
} from "lucide-react";
import { useCurrentFrame } from "remotion";
import { ProviderLogo } from "../brand/provider-logo";
import { C, F } from "../theme";

const U = C.ui;

// ---------------------------------------------------------------- people

export type Who =
  | { kind: "agent"; name: string; provider: string }
  | { kind: "human"; name: string; color: string };

export const AGENTS = {
  claude: { kind: "agent", name: "Claude", provider: "claude" },
  codex: { kind: "agent", name: "Codex", provider: "codex" },
  cursor: { kind: "agent", name: "Cursor", provider: "cursor" },
  kimi: { kind: "agent", name: "Kimi", provider: "kimi" },
  qwen: { kind: "agent", name: "Qwen", provider: "qwen" },
  opencode: { kind: "agent", name: "OpenCode", provider: "opencode" },
  copilot: { kind: "agent", name: "Copilot", provider: "copilot" },
} as const satisfies Record<string, Who>;

export const HUMANS = {
  lin: { kind: "human", name: "林舟", color: "#6366f1" },
  wang: { kind: "human", name: "王一", color: "#0ea5e9" },
  su: { kind: "human", name: "苏禾", color: "#f97316" },
} as const satisfies Record<string, Who>;

export const Avatar: React.FC<{ who: Who; size?: number; ring?: string }> = ({
  who,
  size = 18,
  ring,
}) => {
  const base: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: "50%",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: ring ? `0 0 0 ${Math.max(1.5, size * 0.09)}px ${ring}` : undefined,
    overflow: "hidden",
  };
  if (who.kind === "human") {
    return (
      <div
        style={{
          ...base,
          background: who.color,
          color: "#fff",
          fontFamily: F.sans,
          fontWeight: 600,
          fontSize: size * 0.5,
        }}
      >
        {who.name.slice(0, 1)}
      </div>
    );
  }
  return (
    <div style={{ ...base, background: "#fff", border: `1px solid ${U.border}` }}>
      <div style={{ width: size * 0.72, height: size * 0.72, color: "#111" }}>
        <ProviderLogo provider={who.provider} className="fill" />
      </div>
    </div>
  );
};

/** App-tile provider logo, the way the runtime list renders them. */
export const LogoTile: React.FC<{
  provider: string;
  size: number;
  radius?: number;
  bg?: string;
  style?: React.CSSProperties;
}> = ({ provider, size, radius = size * 0.24, bg = "#fff", style }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: radius,
      background: bg,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: "0 1px 0 rgba(255,255,255,0.6) inset, 0 10px 30px rgba(0,0,0,0.35)",
      color: "#111",
      ...style,
    }}
  >
    <div style={{ width: size * 0.56, height: size * 0.56 }}>
      <ProviderLogo provider={provider} className="fill" />
    </div>
  </div>
);

// ---------------------------------------------------------------- status

export type Status = "backlog" | "todo" | "in_progress" | "in_review" | "done" | "blocked";

export const STATUS_META: Record<Status, { label: string; color: string; tint: string }> = {
  backlog: { label: "待规划", color: U.textFaint, tint: "#f7f7f8" },
  todo: { label: "待办", color: U.textMute, tint: "#f7f7f8" },
  in_progress: { label: "进行中", color: U.warning, tint: "#fbf7ee" },
  in_review: { label: "审核中", color: U.success, tint: "#f1f8f3" },
  done: { label: "已完成", color: U.info, tint: "#f0f5fd" },
  blocked: { label: "已阻塞", color: U.danger, tint: "#fdf3f3" },
};

const pie = (p: number) => {
  const r = 3.5;
  const a = 2 * Math.PI * p;
  const ex = 7 + r * Math.sin(a);
  const ey = 7 - r * Math.cos(a);
  return `M7,7 L7,${7 - r} A${r},${r} 0 ${p > 0.5 ? 1 : 0},1 ${ex},${ey} Z`;
};

// Geometry mirrors packages/views/issues/components/status-icon.tsx.
export const StatusIcon: React.FC<{ status: Status; size?: number }> = ({ status, size = 14 }) => {
  const color = STATUS_META[status].color;
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" style={{ color, flexShrink: 0 }}>
      {status === "backlog" ? (
        Array.from({ length: 16 }, (_, i) => {
          const a = (i / 16) * Math.PI * 2 - Math.PI / 2;
          return <circle key={i} cx={7 + 6 * Math.cos(a)} cy={7 + 6 * Math.sin(a)} r={0.55} fill="currentColor" />;
        })
      ) : (
        <>
          <circle cx={7} cy={7} r={6} fill={status === "done" ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.5} />
          {status === "in_progress" ? <path d={pie(0.5)} fill="currentColor" /> : null}
          {status === "in_review" ? <path d={pie(0.75)} fill="currentColor" /> : null}
          {status === "done" ? (
            <path d="M4.2 7.3 6.2 9.2 9.9 5" stroke="#fff" strokeWidth={1.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          ) : null}
          {status === "blocked" ? (
            <line x1={4.5} y1={9.5} x2={9.5} y2={4.5} stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
          ) : null}
        </>
      )}
    </svg>
  );
};

export const PriorityIcon: React.FC<{ level: 1 | 2 | 3 | 4 }> = ({ level }) => {
  if (level === 4) {
    return (
      <div style={{ width: 14, height: 14, borderRadius: 3, background: "#f97316", color: "#fff", fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.sans }}>
        !
      </div>
    );
  }
  return (
    <svg width={14} height={14} viewBox="0 0 14 14">
      {[0, 1, 2].map((i) => (
        <rect
          key={i}
          x={2 + i * 4}
          y={10 - (i + 1) * 3 + 1}
          width={2.6}
          height={(i + 1) * 3}
          rx={0.6}
          fill={i < level ? (level >= 3 ? "#f59e0b" : "#60a5fa") : "#d4d4d8"}
        />
      ))}
    </svg>
  );
};

export const Spinner: React.FC<{ size?: number; color?: string }> = ({ size = 12, color = U.warning }) => {
  const f = useCurrentFrame();
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" style={{ transform: `rotate(${f * 9}deg)` }}>
      <circle cx={6} cy={6} r={4.6} stroke={color} strokeOpacity={0.22} strokeWidth={1.6} fill="none" />
      <path d="M6 1.4 A4.6 4.6 0 0 1 10.6 6" stroke={color} strokeWidth={1.6} fill="none" strokeLinecap="round" />
    </svg>
  );
};

export const WorkingChip: React.FC<{ who: Who; label?: string }> = ({ who, label = "工作中" }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 5,
      fontSize: 11.5,
      color: U.textMute,
      fontFamily: F.sans,
      fontWeight: 500,
    }}
  >
    <Spinner size={11} />
    <Avatar who={who} size={14} />
    {label}
  </div>
);

// ---------------------------------------------------------------- issue card

export type CardData = {
  id: string;
  title: string;
  status: Status;
  who?: Who;
  working?: boolean;
  priority?: 1 | 2 | 3 | 4;
  updated?: string;
  lines?: 1 | 2;
};

export const CARD_W = 264;
export const cardHeight = (c: Pick<CardData, "lines">) => ((c.lines ?? 2) === 2 ? 118 : 97);

export const IssueCard: React.FC<{
  card: CardData;
  style?: React.CSSProperties;
  glow?: number;
  workingLabel?: string;
}> = ({ card, style, glow = 0, workingLabel }) => (
  <div
    style={{
      width: CARD_W,
      height: cardHeight(card),
      boxSizing: "border-box",
      background: U.card,
      border: `1px solid ${U.border}`,
      borderRadius: 10,
      padding: "11px 13px 12px",
      display: "flex",
      flexDirection: "column",
      fontFamily: F.sans,
      boxShadow:
        glow > 0
          ? `0 0 0 ${2 * glow}px rgba(76,141,246,${0.9 * glow}), 0 ${18 * glow}px ${44 * glow}px rgba(37,99,235,${0.35 * glow}), 0 1px 2px rgba(0,0,0,0.04)`
          : "0 1px 2px rgba(0,0,0,0.04)",
      ...style,
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 7, height: 18 }}>
      <PriorityIcon level={card.priority ?? 2} />
      <span style={{ fontSize: 12.5, color: U.textMute, fontWeight: 500, letterSpacing: 0.1 }}>{card.id}</span>
      <div style={{ flex: 1 }} />
      {card.working && card.who ? <WorkingChip who={card.who} label={workingLabel} /> : null}
    </div>
    <div
      style={{
        marginTop: 7,
        fontSize: 14.5,
        lineHeight: "21px",
        fontWeight: 500,
        color: U.text,
        display: "-webkit-box",
        WebkitLineClamp: card.lines ?? 2,
        WebkitBoxOrient: "vertical",
        overflow: "hidden",
      }}
    >
      {card.title}
    </div>
    <div style={{ flex: 1 }} />
    <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, height: 20 }}>
      {card.who ? (
        <>
          <Avatar who={card.who} size={18} />
          <span style={{ color: U.text, fontWeight: 450 }}>{card.who.name}</span>
        </>
      ) : (
        <>
          <div style={{ width: 18, height: 18, borderRadius: "50%", border: `1.5px dashed ${U.textFaint}` }} />
          <span style={{ color: U.textFaint }}>未分配</span>
        </>
      )}
      <div style={{ flex: 1 }} />
      <span style={{ color: U.textFaint, fontSize: 12.5 }}>{card.updated ?? "4 分钟前"}</span>
    </div>
  </div>
);

// ---------------------------------------------------------------- chrome

const NavItem: React.FC<{ icon: React.ReactNode; label: string; active?: boolean; badge?: string }> = ({
  icon,
  label,
  active,
  badge,
}) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 10,
      height: 32,
      padding: "0 10px",
      borderRadius: 7,
      background: active ? U.accent : "transparent",
      color: active ? U.text : "#3f3f46",
      fontSize: 14.5,
      fontWeight: active ? 550 : 450,
    }}
  >
    <span style={{ display: "flex", color: active ? U.text : "#71717a" }}>{icon}</span>
    <span style={{ flex: 1 }}>{label}</span>
    {badge ? (
      <span style={{ fontSize: 11, fontWeight: 600, color: "#fff", background: C.brandDeep, borderRadius: 9, padding: "1px 6px" }}>{badge}</span>
    ) : null}
  </div>
);

export type NavKey = "issues" | "agents" | "squads" | "skills" | "runtimes" | "autopilots" | "inbox" | "chat" | "usage";

export const Sidebar: React.FC<{ active?: NavKey; inboxBadge?: string }> = ({ active = "issues", inboxBadge }) => {
  const i = (n: React.ReactNode) => n;
  const s = 17;
  return (
    <div style={{ width: 240, height: "100%", padding: "14px 10px", boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 2, fontFamily: F.sans }}>
      <div style={{ display: "flex", gap: 8, padding: "0 6px 10px", alignItems: "center" }}>
        {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
          <div key={c} style={{ width: 12, height: 12, borderRadius: "50%", background: c }} />
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 9, height: 36, padding: "0 8px", marginBottom: 6 }}>
        <div style={{ width: 22, height: 22, borderRadius: 6, background: "#e4e4e7", color: "#3f3f46", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
          N
        </div>
        <span style={{ fontWeight: 650, fontSize: 15, color: U.text, flex: 1 }}>Nebula Labs</span>
        <ChevronDown size={15} color="#71717a" />
      </div>
      <NavItem icon={i(<Search size={s} />)} label="搜索…" />
      <NavItem icon={i(<SquarePen size={s} />)} label="新建任务" />
      <div style={{ height: 10 }} />
      <NavItem icon={i(<Inbox size={s} />)} label="收件箱" active={active === "inbox"} badge={inboxBadge} />
      <NavItem icon={i(<CircleUser size={s} />)} label="我的任务" />
      <NavItem icon={i(<MessageSquare size={s} />)} label="聊天" active={active === "chat"} />
      <div style={{ fontSize: 12.5, color: U.textFaint, padding: "16px 10px 6px", fontWeight: 500 }}>工作</div>
      <NavItem icon={i(<ListTodo size={s} />)} label="任务" active={active === "issues"} />
      <NavItem icon={i(<FolderKanban size={s} />)} label="项目" />
      <NavItem icon={i(<Zap size={s} />)} label="自动化" active={active === "autopilots"} />
      <div style={{ fontSize: 12.5, color: U.textFaint, padding: "16px 10px 6px", fontWeight: 500 }}>AI 团队</div>
      <NavItem icon={i(<Bot size={s} />)} label="智能体" active={active === "agents"} />
      <NavItem icon={i(<Users size={s} />)} label="小队" active={active === "squads"} />
      <NavItem icon={i(<BookOpen size={s} />)} label="Skills" active={active === "skills"} />
      <NavItem icon={i(<Monitor size={s} />)} label="运行时" active={active === "runtimes"} />
      <div style={{ flex: 1 }} />
      <NavItem icon={i(<ChartColumn size={s} />)} label="统计" active={active === "usage"} />
      <NavItem icon={i(<Settings size={s} />)} label="设置" />
    </div>
  );
};

const ToolButton: React.FC<{ icon: React.ReactNode; label: string }> = ({ icon, label }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 6, height: 30, padding: "0 10px", border: `1px solid ${U.border}`, borderRadius: 7, fontSize: 13.5, color: "#3f3f46", background: "#fff" }}>
    {icon}
    {label}
  </div>
);

export const AgentsWorkingPill: React.FC<{ who: Who[]; count: number }> = ({ who, count }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8, height: 30, padding: "0 10px 0 6px", borderRadius: 7, background: "#eef4ff", border: "1px solid #d6e4ff", fontSize: 13.5, color: "#1e3a8a", fontWeight: 500 }}>
    <div style={{ display: "flex" }}>
      {who.map((w, i) => (
        <div key={i} style={{ marginLeft: i ? -6 : 0 }}>
          <Avatar who={w} size={20} ring="#eef4ff" />
        </div>
      ))}
    </div>
    {count} 个智能体工作中
  </div>
);

export const BoardHeader: React.FC<{ working: Who[]; workingCount: number }> = ({ working, workingCount }) => (
  <div style={{ fontFamily: F.sans }}>
    <div style={{ height: 50, display: "flex", alignItems: "center", gap: 9, padding: "0 20px", borderBottom: `1px solid ${U.border}`, fontSize: 15, fontWeight: 550, color: U.text }}>
      <ListTodo size={17} color="#52525b" />
      任务
    </div>
    <div style={{ height: 54, display: "flex", alignItems: "center", gap: 6, padding: "0 16px" }}>
      {["全部", "成员", "智能体"].map((t, i) => (
        <div key={t} style={{ height: 30, padding: "0 12px", display: "flex", alignItems: "center", borderRadius: 7, fontSize: 13.5, background: i === 0 ? U.accent : "transparent", border: i === 0 ? "none" : `1px solid ${U.border}`, color: i === 0 ? U.text : "#52525b", fontWeight: i === 0 ? 550 : 450 }}>
          {t}
        </div>
      ))}
      <div style={{ flex: 1 }} />
      <AgentsWorkingPill who={working} count={workingCount} />
      <ToolButton icon={<Filter size={14} />} label="筛选" />
      <ToolButton icon={<SlidersHorizontal size={14} />} label="显示" />
      <ToolButton icon={<Columns3 size={14} />} label="看板" />
    </div>
  </div>
);

export const ColumnHeader: React.FC<{ status: Status; count: number }> = ({ status, count }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8, height: 36, padding: "0 10px", fontFamily: F.sans }}>
    <StatusIcon status={status} size={14} />
    <span style={{ fontSize: 13.5, fontWeight: 600, color: U.text }}>{STATUS_META[status].label}</span>
    <span style={{ fontSize: 13, color: U.textFaint }}>{count}</span>
    <div style={{ flex: 1 }} />
    <Ellipsis size={15} color="#a1a1aa" />
    <Plus size={15} color="#a1a1aa" />
  </div>
);

/** Desktop app frame: sidebar on the shell colour, content on an inset panel. */
export const AppWindow: React.FC<{
  width?: number;
  height?: number;
  active?: NavKey;
  inboxBadge?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ width = 1600, height = 900, active, inboxBadge, children, style }) => (
  <div
    style={{
      width,
      height,
      borderRadius: 16,
      background: U.sidebar,
      display: "flex",
      overflow: "hidden",
      boxShadow: "0 0 0 1px rgba(255,255,255,0.08), 0 50px 120px rgba(0,0,0,0.55), 0 20px 40px rgba(0,0,0,0.35)",
      position: "relative",
      ...style,
    }}
  >
    <Sidebar active={active} inboxBadge={inboxBadge} />
    <div style={{ flex: 1, margin: "8px 8px 8px 0", background: U.canvas, borderRadius: 11, border: `1px solid ${U.border}`, position: "relative", overflow: "hidden" }}>
      {children}
    </div>
  </div>
);
