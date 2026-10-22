import React from "react";
import { C } from "../theme";
import {
  BoardHeader,
  CARD_W,
  CardData,
  ColumnHeader,
  IssueCard,
  STATUS_META,
  Status,
  Who,
  cardHeight,
} from "./ui";

export const COL_W = CARD_W + 16;
export const COL_GAP = 10;
export const COL_X0 = 14;
export const COL_Y0 = 112;
export const CARD_GAP = 10;
export const CARDS_Y0 = COL_Y0 + 42;

export const colX = (i: number) => COL_X0 + i * (COL_W + COL_GAP);

export type Placed = CardData & {
  x: number;
  y: number;
  opacity?: number;
  scale?: number;
  glow?: number;
  z?: number;
  rot?: number;
  workingLabel?: string;
};

/** Stack cards top-to-bottom in their column, in the given order. */
export const layout = (columns: Status[], cards: CardData[]): Record<string, Placed> => {
  const out: Record<string, Placed> = {};
  columns.forEach((status, ci) => {
    let y = CARDS_Y0;
    for (const c of cards.filter((k) => k.status === status)) {
      out[c.id] = { ...c, x: colX(ci) + 8, y };
      y += cardHeight(c) + CARD_GAP;
    }
  });
  return out;
};

export const Board: React.FC<{
  columns: Status[];
  cards: Placed[];
  counts?: Partial<Record<Status, number>>;
  working: Who[];
  workingCount: number;
  columnGlow?: Partial<Record<Status, number>>;
  children?: React.ReactNode;
}> = ({ columns, cards, counts, working, workingCount, columnGlow, children }) => (
  <div style={{ position: "absolute", inset: 0 }}>
    <BoardHeader working={working} workingCount={workingCount} />
    {columns.map((s, i) => {
      const g = columnGlow?.[s] ?? 0;
      return (
        <div
          key={s}
          style={{
            position: "absolute",
            left: colX(i),
            top: COL_Y0,
            width: COL_W,
            bottom: 10,
            borderRadius: 12,
            background: STATUS_META[s].tint,
            boxShadow: g > 0 ? `inset 0 0 0 ${2 * g}px rgba(76,141,246,${0.55 * g})` : undefined,
          }}
        >
          <ColumnHeader status={s} count={counts?.[s] ?? cards.filter((c) => c.status === s).length} />
        </div>
      );
    })}
    {[...cards]
      .sort((a, b) => (a.z ?? 0) - (b.z ?? 0))
      .map((c) => (
        <div
          key={c.id}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            transform: `translate(${c.x}px, ${c.y}px) scale(${c.scale ?? 1}) rotate(${c.rot ?? 0}deg)`,
            transformOrigin: "50% 50%",
            opacity: c.opacity ?? 1,
          }}
        >
          <IssueCard card={c} glow={c.glow} workingLabel={c.workingLabel} />
        </div>
      ))}
    {children}
  </div>
);

export const DARK_PANEL: React.CSSProperties = {
  background: "rgba(13,17,25,0.86)",
  border: `1px solid ${C.line}`,
  borderRadius: 18,
  boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
};
