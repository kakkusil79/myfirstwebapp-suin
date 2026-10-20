import Link from "next/link";
import BlockBuddy from "@/components/BlockBuddy";
import DataTable, { type Column } from "@/components/DataTable";
import GradeFace, { FACE_NAME, FaceIcon } from "@/components/GradeFace";
import PageHeader from "@/components/PageHeader";
import PaymentMascot from "@/components/PaymentMascot";
import TowerGame, { type GameCard } from "@/components/TowerGame";
import { getBuyers, type Grade } from "@/lib/buyers";
import { byRegion, filterByGrade, gradeCounts, kpis, parseGrade } from "@/lib/metrics";
import { int, kst, pct, usd } from "@/lib/format";
import { getLatestPayments, PAYMENT_STYLE } from "@/lib/reviews";

// 아이와 보기 — /buyers와 같은 계산(lib/metrics) · 같은 숫자를 얼굴 · 블록 친구로 보여 준다.
export const metadata = { title: "아이와 보기" };

const FACE_LINE: Record<Grade, string> = {
  S: "위험 점수가 가장 낮은 친구예요.",
  A: "위험 점수가 낮은 편인 친구예요.",
  B: "조금 살펴보면 좋은 친구예요.",
  C: "위험 점수가 높아서 어른들이 더 꼼꼼히 살펴봐요.",
};

const COLUMNS: Column[] = [
  { key: "buyer", label: "바이어 친구" },
  { key: "face", label: "얼굴" },
  { key: "country", label: "나라" },
  { key: "pd", label: "위험 점수", align: "right" },
];

export default async function Page({ searchParams }: { searchParams: Promise<{ grade?: string | string[] }> }) {
  const raw = (await searchParams).grade;
  const grade = parseGrade(Array.isArray(raw) ? raw[0] : raw);

  const buyers = await getBuyers();
  const payments = await getLatestPayments(12);
  const k = kpis(buyers);
  const counts = gradeCounts(buyers);
  const regions = byRegion(buyers);
  const maxRegionAr = Math.max(0, ...regions.map((r) => r.arUsd));
  const strongRegion = regions.reduce<(typeof regions)[number] | null>(
    (best, r) => (r.cShare !== null && (best === null || r.cShare > (best.cShare ?? -1)) ? r : best),
    null,
  );
  const list = filterByGrade(buyers, grade);
  // 게임에는 필요한 5칸만 넘긴다(브라우저로 가는 값)
  const gameCards: GameCard[] = buyers.map(({ id, name, countryKo, grade, pd30d }) => ({ id, name, countryKo, grade, pd30d }));

  const chip = (active: boolean) =>
    `inline-flex min-h-11 items-center gap-1.5 rounded-lg border px-3 text-sm ${
      active ? "border-accent bg-accent text-white" : "border-line bg-bg text-ink hover:bg-surface"
    }`;

  return (
    <div className="space-y-10">
      <PageHeader
        title="아이와 함께 보는 바이어 세계"
        asof="2026-09-30 · (가상) 합성 데이터"
        line={`우리 회사가 물건을 판 바이어 친구 ${int(k.totalCount)}곳이에요. 얼굴과 블록 탑으로 함께 살펴봐요.`}
      />

      <section aria-labelledby="faces" className="space-y-3">
        <h2 id="faces" className="text-lg font-semibold text-ink">
          얼굴 친구 소개
        </h2>
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {counts.map((c) => (
            <li key={c.grade} className="flex items-start gap-3 rounded-lg border border-line bg-kid-sky p-3">
              <FaceIcon grade={c.grade} size={44} />
              <div>
                <p className="font-semibold text-ink">
                  {FACE_NAME[c.grade]} · {c.grade}등급 <span className="num">{int(c.count)}곳</span>
                </p>
                <p className="mt-1 text-sm text-muted">{FACE_LINE[c.grade]}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="payments" className="space-y-3">
        <h2 id="payments" className="text-lg font-semibold text-ink">
          입금 소식
        </h2>
        <p className="text-sm text-muted">
          총무부 어른이 입금을 확인하면 천사가 날개를 펴고, 아직 안 들어왔으면 꼬마 악마가 펑! 터져요. 바이어마다 가장
          최근 도장 하나씩이에요.
        </p>
        {payments.length === 0 ? (
          <p className="text-sm text-muted">아직 총무부 도장이 없어요</p>
        ) : (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {payments.map((p) => (
              <li key={p.id} className="flex items-center gap-3 rounded-lg border border-line bg-kid-sky p-3">
                <PaymentMascot status={p.paymentStatus ?? ""} size={72} />
                <div className="min-w-0">
                  <Link href={`/buyers/${p.buyerId}`} className="inline-flex min-h-11 items-center text-accent hover:underline">
                    {p.buyer.name}
                  </Link>
                  <span className="num block text-xs text-muted">{p.buyerId}</span>
                  <span
                    className={`mt-1 inline-flex items-center rounded border bg-bg px-1.5 text-sm font-semibold ${PAYMENT_STYLE[p.paymentStatus ?? ""] ?? "border-line text-muted"}`}
                  >
                    {p.paymentStatus === "입금 확인" ? "입금 확인 · 천사" : "미입금 · 꼬마 악마"}
                  </span>
                  <p className="mt-1 text-sm text-muted">
                    총무부 {p.financeChecker ?? "—"} ·{" "}
                    <span className="num">{p.paymentCheckedAt ? kst(p.paymentCheckedAt) : "—"}</span>
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="world" className="space-y-3">
        <h2 id="world" className="text-lg font-semibold text-ink">
          블록 친구 세계 지도
        </h2>
        <p className="text-sm text-muted">
          블록 탑이 높을수록 아직 받을 돈(채권)이 많은 지역이에요. &lsquo;조심!&rsquo; 팻말은 꼬마 악마 몫이 가장 큰 지역에
          붙어요.
        </p>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {regions.map((r) => {
            const strong = strongRegion?.region === r.region;
            return (
              <li key={r.region} className={`rounded-lg border bg-kid-sky p-3 ${strong ? "border-warn" : "border-line"}`}>
                <div className="flex min-h-7 items-center">
                  {strong ? (
                    <span className="rounded border border-warn bg-bg px-2 text-sm font-semibold text-warn">조심!</span>
                  ) : null}
                </div>
                <BlockBuddy region={r.region} value={r.arUsd} max={maxRegionAr} strong={strong} />
                <p className="mt-2 font-semibold text-ink">{r.region}</p>
                <p className="num text-ink">{usd(r.arUsd)}</p>
                <p className="text-sm text-muted">
                  친구 <span className="num">{int(r.count)}곳</span>
                </p>
                <p className="text-sm text-muted">
                  꼬마 악마 몫 <span className="num">{pct(r.cShare)}</span>
                </p>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="game" className="space-y-3">
        <h2 id="game" className="text-lg font-semibold text-ink">
          블록 탑 쌓기 게임
        </h2>
        <TowerGame cards={gameCards} />
      </section>

      <section aria-labelledby="friends" className="space-y-3">
        <h2 id="friends" className="text-lg font-semibold text-ink">
          바이어 친구들
        </h2>
        <ul className="flex flex-wrap gap-2" aria-label="얼굴로 거르기">
          <li>
            <Link href="/kids" aria-current={grade === null ? "page" : undefined} className={chip(grade === null)}>
              전체 <span className="num">{int(k.totalCount)}</span>
            </Link>
          </li>
          {counts.map((c) => (
            <li key={c.grade}>
              <Link
                href={`/kids?grade=${c.grade}`}
                aria-current={grade === c.grade ? "page" : undefined}
                className={chip(grade === c.grade)}
              >
                <FaceIcon grade={c.grade} size={24} />
                {FACE_NAME[c.grade]} {c.grade} <span className="num">{int(c.count)}</span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="text-sm text-muted">
          {grade ? `${FACE_NAME[grade]}(${grade}등급)` : "전체"} <span className="num">{int(list.length)}곳</span>
        </p>
        <DataTable
          columns={COLUMNS}
          rows={list.map((b) => ({
            buyer: (
              <div>
                <Link href={`/buyers/${b.id}`} className="inline-flex min-h-11 items-center text-accent hover:underline">
                  {b.name}
                </Link>
                <span className="num block text-xs text-muted">{b.id}</span>
              </div>
            ),
            face: <GradeFace grade={b.grade} showName />,
            country: b.countryKo,
            pd: pct(b.pd30d),
          }))}
        />
      </section>

      <div className="space-y-3">
        <p className="text-sm text-muted">위험 점수는 판단을 돕는 값이고, 결정은 어른(사람)이 해요.</p>
        <Link href="/buyers" className="inline-flex min-h-11 items-center rounded-md border border-line px-4 text-accent">
          어른용 바이어 화면으로
        </Link>
      </div>
    </div>
  );
}
