/**
 * Terminal formatting helpers — ANSI colours, tables, etc.
 */

const B = '\x1b[1m';
const D = '\x1b[2m';
const R = '\x1b[0m';
const RED = '\x1b[31m';
const GRN = '\x1b[32m';
const YEL = '\x1b[33m';
const CYN = '\x1b[36m';

export const fmt = {
  bold: (s: string) => `${B}${s}${R}`,
  dim: (s: string) => `${D}${s}${R}`,
  green: (s: string) => `${GRN}${s}${R}`,
  yellow: (s: string) => `${YEL}${s}${R}`,
  red: (s: string) => `${RED}${s}${R}`,
  cyan: (s: string) => `${CYN}${s}${R}`,
  label: (l: string, v: string) => `${D}${l}${R} ${v}`,
  phase: (p: string) =>
    p === 'decide'
      ? `${CYN}${p}${R}`
      : p === 'express'
        ? `${GRN}${p}${R}`
        : p === 'remember'
          ? `${YEL}${p}${R}`
          : `${D}${p}${R}`,
  level: (l: string) => (l === 'deep' ? `${YEL}${l}${R}` : `${D}${l}${R}`),
  status: (s: string) =>
    s === 'active'
      ? fmt.green(s)
      : s === 'paused'
        ? fmt.yellow(s)
        : fmt.red(s),
  shortId: (id: string) => id.slice(0, 8),
};

export function table(
  headers: string[],
  rows: string[][],
  widths?: number[],
): string {
  const w =
    widths ??
    headers.map((h, i) =>
      Math.max(h.length, ...rows.map((r) => (r[i] ?? '').length)),
    );
  const sep = w.map((n) => '─'.repeat(n + 2)).join('┼');
  const line = (cells: string[]) =>
    cells.map((c, i) => ` ${c.padEnd(w[i])} `).join('│');
  return [
    line(headers),
    sep,
    ...rows.map((r) => line(r)),
  ].join('\n');
}
