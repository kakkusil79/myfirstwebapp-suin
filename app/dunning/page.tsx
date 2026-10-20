import Link from "next/link";
import DecisionForm from "@/components/DecisionForm";
import GradeBadge from "@/components/GradeBadge";
import Notice from "@/components/Notice";
import PageHeader from "@/components/PageHeader";
import { db } from "@/lib/db";
import { int, kst, usd } from "@/lib/format";
import type { Check } from "@/lib/guardrails";

export const dynamic = "force-dynamic";

export const metadata = { title: "독촉 승인" };

// 승인 관제탑 — AI(claude -p)가 미리 쓴 독촉 초안을 사람이 승인 · 반려한다. 승인해도 메일은 나가지 않는다.
const TABS = [
  { key: "pending", label: "대기" },
  { key: "approved", label: "승인" },
  { key: "rejected", label: "반려" },
  { key: "blocked", label: "막힘" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

function toChecks(v: unknown): Check[] {
  return Array.isArray(v) ? (v as Check[]) : [];
}

export default async function Page({ searchParams }: { searchParams: Promise<{ tab?: string | string[] }> }) {
  const raw = (await searchParams).tab;
  const asked = Array.isArray(raw) ? raw[0] : raw;
  const tab: TabKey = TABS.find((t) => t.key === asked)?.key ?? "pending";

  const [groups, drafts] = await Promise.all([
    db().dunningDraft.groupBy({ by: ["status"], _count: { _all: true } }),
    db().dunningDraft.findMany({
      where: { status: tab },
      orderBy: [{ overdueUsd: "desc" }, { buyerId: "asc" }],
      include: { buyer: { select: { name: true, grade: true } } },
    }),
  ]);
  const count = (key: string) => groups.find((g) => g.status === key)?._count._all ?? 0;
  const total = groups.reduce((sum, g) => sum + g._count._all, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="독촉 승인"
        asof="2026-09-30 · (가상) 합성 데이터"
        line="AI는 초안까지만 — 승인해도 메일은 나가지 않습니다(실제 발송 없음)"
      />

      <ul className="flex flex-wrap gap-2" aria-label="상태로 거르기">
        {TABS.map((t) => (
          <li key={t.key}>
            <Link
              href={t.key === "pending" ? "/dunning" : `/dunning?tab=${t.key}`}
              aria-current={tab === t.key ? "page" : undefined}
              className={`inline-flex min-h-11 items-center gap-1 rounded-md border px-4 text-sm ${
                tab === t.key ? "border-accent bg-accent text-white" : "border-line bg-bg text-ink hover:bg-surface"
              }`}
            >
              {t.label} <span className="num">{int(count(t.key))}</span>
            </Link>
          </li>
        ))}
      </ul>

      {drafts.length === 0 ? (
        total === 0 ? (
          <Notice tone="info" title="아직 초안이 없습니다">
            초안은 사람이 터미널에서 <span className="num">npm run drafts</span>로 만듭니다(AI는 앱이 돌 때 부르지 않습니다).
          </Notice>
        ) : (
          <p className="rounded-lg border border-line bg-surface p-4 text-muted">이 탭에 초안이 없습니다</p>
        )
      ) : (
        <ul className="space-y-4">
          {drafts.map((d) => {
            const checks = toChecks(d.checks);
            const failed = checks.filter((c) => !c.ok);
            return (
              <li key={d.id} className="space-y-3 rounded-lg border border-line bg-bg p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="num text-sm text-muted">{d.buyerId}</span>
                  <Link href={`/buyers/${d.buyerId}`} className="inline-flex min-h-11 items-center font-semibold text-accent hover:underline">
                    {d.buyer.name}
                  </Link>
                  <GradeBadge grade={d.buyer.grade} />
                </div>
                <p className="text-sm text-muted">
                  {d.stage} · {d.tone} · 연체 <span className="num text-ink">{usd(d.overdueUsd)}</span> · 초안{" "}
                  <span className="num">#{d.id}</span> · 만든 시각 <span className="num">{kst(d.createdAt)}</span>
                </p>

                <div className="space-y-2">
                  <p className="font-semibold text-ink">{d.subject}</p>
                  <p className="whitespace-pre-line rounded-md bg-surface p-3 text-sm text-ink">{d.body}</p>
                  <p className="text-sm text-ink">
                    <span className="text-muted">요약 </span>
                    {d.summaryKo}
                  </p>
                </div>

                <ul className="grid grid-cols-1 gap-1 text-sm sm:grid-cols-2" aria-label="검사 G1–G7">
                  {checks.map((c) => (
                    <li key={c.id} className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded border px-1.5 font-semibold ${
                          c.ok ? "border-grade-s text-grade-s" : "border-warn text-warn"
                        }`}
                      >
                        {c.ok ? "통과" : "걸림"}
                      </span>
                      <span className="text-ink">
                        {c.id} {c.label}
                      </span>
                      {!c.ok && c.note ? <span className="text-warn">({c.note})</span> : null}
                    </li>
                  ))}
                </ul>

                {d.status === "pending" ? <DecisionForm draftId={d.id} /> : null}
                {d.status === "approved" ? (
                  <p className="border-t border-line pt-3 text-sm text-ink">
                    <span className="font-semibold text-accent">발송 대기 — 실제 발송 없음</span> · {d.decidedBy ?? "확인 필요"} ·{" "}
                    <span className="num">{d.decidedAt ? kst(d.decidedAt) : "—"}</span>
                  </p>
                ) : null}
                {d.status === "rejected" ? (
                  <p className="border-t border-line pt-3 text-sm text-ink">
                    <span className="font-semibold text-warn">반려</span> · 사유: {d.reason ?? "—"} · {d.decidedBy ?? "확인 필요"} ·{" "}
                    <span className="num">{d.decidedAt ? kst(d.decidedAt) : "—"}</span>
                  </p>
                ) : null}
                {d.status === "blocked" ? (
                  <p className="border-t border-line pt-3 text-sm text-warn">
                    막힘 — 걸린 검사: {failed.map((c) => `${c.id} ${c.label}`).join(" · ") || "확인 필요"}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
