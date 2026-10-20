import Link from "next/link";
import BarRow from "@/components/BarRow";
import DataTable, { type Column } from "@/components/DataTable";
import GradeBadge from "@/components/GradeBadge";
import KpiCard from "@/components/KpiCard";
import PageHeader from "@/components/PageHeader";
import { getBuyers, type Buyer } from "@/lib/buyers";
import { byRegion, filterByGrade, gradeCounts, kpis, parseGrade, topRisk } from "@/lib/metrics";
import { int, pct, usd } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata = { title: "바이어" };

const TOP_COLUMNS: Column[] = [
  { key: "buyer", label: "바이어" },
  { key: "country", label: "나라" },
  { key: "grade", label: "등급" },
  { key: "pd", label: "위험 점수", align: "right" },
  { key: "ar", label: "채권", align: "right" },
  { key: "overdue", label: "연체", align: "right" },
  { key: "signal", label: "첫 신호" },
];

const LIST_COLUMNS: Column[] = TOP_COLUMNS.filter((c) => c.key !== "signal");

function buyerRow(b: Buyer, label: string) {
  return {
    buyer: (
      <div>
        <Link href={`/buyers/${b.id}`} className="inline-flex min-h-11 items-center text-accent hover:underline">
          {label}
        </Link>
        <span className="num block text-xs text-muted">{b.id}</span>
      </div>
    ),
    country: b.countryKo,
    grade: <GradeBadge grade={b.grade} />,
    pd: pct(b.pd30d),
    ar: usd(b.openArUsd),
    overdue: usd(b.overdueUsd),
    signal: b.signals[0] ?? "—",
  };
}

export default async function Page({ searchParams }: { searchParams: Promise<{ grade?: string | string[] }> }) {
  const raw = (await searchParams).grade;
  const grade = parseGrade(Array.isArray(raw) ? raw[0] : raw);

  const buyers = await getBuyers();
  const k = kpis(buyers);
  const counts = gradeCounts(buyers);
  const top = topRisk(buyers, 10);
  const regions = byRegion(buyers);
  const maxRegionAr = Math.max(0, ...regions.map((r) => r.arUsd));
  const strongRegion = regions.reduce<(typeof regions)[number] | null>(
    (best, r) => (r.cShare !== null && (best === null || r.cShare > (best.cShare ?? -1)) ? r : best),
    null,
  );
  const list = filterByGrade(buyers, grade);

  const chips = [
    { key: "all", label: "전체", count: k.totalCount, href: "/buyers", active: grade === null },
    ...counts.map((c) => ({
      key: c.grade,
      label: c.grade,
      count: c.count,
      href: `/buyers?grade=${c.grade}`,
      active: grade === c.grade,
    })),
  ];

  return (
    <div className="space-y-10">
      <PageHeader
        title={`바이어 ${int(k.totalCount)}곳`}
        asof="2026-09-30 · (가상) 합성 데이터"
        line="위험 점수는 판단을 돕는 값이고, 결정은 사람이 합니다."
      />

      <section aria-label="요약 숫자" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="위험 바이어(C등급)" value={`${int(k.cCount)}곳`} />
        <KpiCard label="C등급 채권" value={usd(k.cArUsd)} sub={`전체의 ${pct(k.cShare)}`} />
        <KpiCard label="전체 채권" value={usd(k.totalArUsd)} sub={`${int(k.totalCount)}곳`} />
        <KpiCard label="연체 금액" value={usd(k.overdueUsd)} sub={`${int(k.overdueCount)}곳`} />
      </section>

      <section aria-labelledby="top-risk" className="space-y-3">
        <h2 id="top-risk" className="text-lg font-semibold text-ink">
          위험 상위 10
        </h2>
        <DataTable
          caption="위험 점수 큰 순 · 150곳 전체 기준"
          columns={TOP_COLUMNS}
          rows={top.map((b, i) => buyerRow(b, `${i + 1}. ${b.name}`))}
        />
      </section>

      <section aria-labelledby="by-region" className="space-y-3">
        <h2 id="by-region" className="text-lg font-semibold text-ink">
          지역별 채권
        </h2>
        <div className="space-y-2">
          {regions.map((r) => (
            <div key={r.region}>
              <BarRow
                label={r.region}
                value={r.arUsd}
                max={maxRegionAr}
                display={usd(r.arUsd)}
                strong={strongRegion?.region === r.region}
              />
              <p className="text-xs text-muted">
                C등급 <span className="num">{usd(r.cArUsd)}</span> · <span className="num">{pct(r.cShare)}</span>
              </p>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="all-buyers" className="space-y-3">
        <h2 id="all-buyers" className="text-lg font-semibold text-ink">
          전체 목록
        </h2>
        <ul className="flex flex-wrap gap-2" aria-label="등급으로 거르기">
          {chips.map((c) => (
            <li key={c.key}>
              <Link
                href={c.href}
                aria-current={c.active ? "page" : undefined}
                className={`inline-flex min-h-11 items-center gap-1 rounded-md border px-4 text-sm ${
                  c.active ? "border-accent bg-accent text-white" : "border-line bg-bg text-ink hover:bg-surface"
                }`}
              >
                {c.label} <span className="num">{int(c.count)}</span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="text-sm text-muted">
          {grade ? `${grade}등급` : "전체"} <span className="num">{int(list.length)}곳</span>
        </p>
        <DataTable columns={LIST_COLUMNS} rows={list.map((b) => buyerRow(b, b.name))} />
      </section>
    </div>
  );
}
