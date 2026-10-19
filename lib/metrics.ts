import type { Buyer, Grade } from "@/lib/buyers";

// 화면 숫자 계산 — 순수 함수만(화면 글자는 만들지 않는다). 등급은 grade 칸 그대로 쓴다.
// 나눌 값이 0이면 비율은 null(화면에서는 lib/format이 "—"로 보인다).
export const GRADES: readonly Grade[] = ["S", "A", "B", "C"];

function ratio(part: number, whole: number): number | null {
  return whole > 0 ? part / whole : null;
}

function sumAr(buyers: Buyer[]): number {
  return buyers.reduce((sum, b) => sum + b.openArUsd, 0);
}

// 위험 점수(pd30d) 큰 순, 같으면 id 순
function byRisk(a: Buyer, b: Buyer): number {
  return b.pd30d - a.pd30d || a.id.localeCompare(b.id);
}

/** "c" · "C" → "C", 그 밖의 값(없음 · 엉뚱한 값) → null */
export function parseGrade(v: string | null | undefined): Grade | null {
  const g = (v ?? "").toUpperCase();
  return (GRADES as readonly string[]).includes(g) ? (g as Grade) : null;
}

export function kpis(buyers: Buyer[]) {
  const gradeC = buyers.filter((b) => b.grade === "C");
  const totalArUsd = sumAr(buyers);
  const cArUsd = sumAr(gradeC);
  const overdue = buyers.filter((b) => b.overdueUsd > 0);
  return {
    cCount: gradeC.length,
    cArUsd,
    cShare: ratio(cArUsd, totalArUsd),
    totalArUsd,
    totalCount: buyers.length,
    overdueUsd: buyers.reduce((sum, b) => sum + b.overdueUsd, 0),
    overdueCount: overdue.length,
  };
}

export function gradeCounts(buyers: Buyer[]): { grade: Grade; count: number }[] {
  return GRADES.map((grade) => ({ grade, count: buyers.filter((b) => b.grade === grade).length }));
}

export function topRisk(buyers: Buyer[], n = 10): Buyer[] {
  return [...buyers].sort(byRisk).slice(0, n);
}

export function byRegion(buyers: Buyer[]) {
  const regions = [...new Set(buyers.map((b) => b.region))];
  return regions
    .map((region) => {
      const inRegion = buyers.filter((b) => b.region === region);
      const arUsd = sumAr(inRegion);
      const cArUsd = sumAr(inRegion.filter((b) => b.grade === "C"));
      return { region, count: inRegion.length, arUsd, cArUsd, cShare: ratio(cArUsd, arUsd) };
    })
    .sort((a, b) => b.arUsd - a.arUsd);
}

export function filterByGrade(buyers: Buyer[], grade: string | null | undefined): Buyer[] {
  const g = parseGrade(grade);
  const picked = g ? buyers.filter((b) => b.grade === g) : buyers;
  return [...picked].sort(byRisk);
}
