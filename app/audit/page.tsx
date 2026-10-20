import Link from "next/link";
import DataTable, { type Column } from "@/components/DataTable";
import PageHeader from "@/components/PageHeader";
import { db } from "@/lib/db";
import { int, kst } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata = { title: "감사 기록" };

// 블랙박스 — 누가 · 언제 · 무엇을 했는지. 쌓기만 한다(AuditLog는 create만 — 고치거나 지우는 코드 · 단추가 없다).
const ACTIONS = ["초안 작성", "초안 막힘", "승인", "반려"] as const;

const COLUMNS: Column[] = [
  { key: "at", label: "시각" },
  { key: "actor", label: "누가" },
  { key: "action", label: "무엇을" },
  { key: "target", label: "대상" },
  { key: "detail", label: "내용" },
];

export default async function Page({ searchParams }: { searchParams: Promise<{ action?: string | string[] }> }) {
  const raw = (await searchParams).action;
  const asked = Array.isArray(raw) ? raw[0] : raw;
  const action = ACTIONS.find((a) => a === asked) ?? null;
  const where = action ? { action } : {};

  const [total, rows] = await Promise.all([
    db().auditLog.count({ where }),
    db().auditLog.findMany({ where, orderBy: [{ at: "desc" }, { id: "desc" }], take: 50 }),
  ]);

  const chips = [
    { key: "all", label: "전체", href: "/audit", active: action === null },
    ...ACTIONS.map((a) => ({ key: a, label: a, href: `/audit?action=${encodeURIComponent(a)}`, active: action === a })),
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="감사 기록" asof="2026-09-30 · (가상) 합성 데이터" line="이 기록은 지우거나 고치지 않습니다" />

      <ul className="flex flex-wrap gap-2" aria-label="무엇을 했는지로 거르기">
        {chips.map((c) => (
          <li key={c.key}>
            <Link
              href={c.href}
              aria-current={c.active ? "page" : undefined}
              className={`inline-flex min-h-11 items-center rounded-md border px-4 text-sm ${
                c.active ? "border-accent bg-accent text-white" : "border-line bg-bg text-ink hover:bg-surface"
              }`}
            >
              {c.label}
            </Link>
          </li>
        ))}
      </ul>

      <p className="text-sm text-muted">
        {action ?? "전체"} · 모두 <span className="num">{int(total)}줄</span> · 최근 <span className="num">50줄</span>까지
      </p>

      <DataTable
        columns={COLUMNS}
        empty="아직 감사 기록이 없습니다"
        rows={rows.map((r) => ({
          at: <span className="num">{kst(r.at, true)}</span>,
          actor: r.actor,
          action: r.action,
          target: r.target,
          detail: r.detail,
        }))}
      />
    </div>
  );
}
