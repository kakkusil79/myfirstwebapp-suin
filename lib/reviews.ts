import { db } from "@/lib/db";

// 확인 기록 읽기 — Supabase DB의 Review 표(서버 전용). 쓰기는 app/buyers/[id]/actions.ts.
export const REVIEW_STATUSES = ["확인 필요", "확인 완료", "보류"] as const;

// 상태 배지 색(테두리 + 글자) — 상세 쪽과 첫 화면이 같은 색을 쓴다. 모르는 값은 muted.
export const STATUS_STYLE: Record<string, string> = {
  "확인 필요": "border-warn text-warn",
  "확인 완료": "border-accent text-accent",
  보류: "border-line text-muted",
};

// 최신이 위 — 같은 시각이면 나중에 넣은 것(id 큰 것)이 위
const NEWEST_FIRST = [{ createdAt: "desc" as const }, { id: "desc" as const }];

export async function getReviews(buyerId: string, take = 20) {
  return db().review.findMany({ where: { buyerId }, orderBy: NEWEST_FIRST, take });
}

export async function getRecentReviews(take = 5) {
  return db().review.findMany({
    orderBy: NEWEST_FIRST,
    take,
    include: { buyer: { select: { name: true } } },
  });
}

// 총무부 도장(자유 퀘스트) — 입금 확인이면 천사, 미입금이면 꼬마 악마
export const PAYMENT_STATUSES = ["입금 확인", "미입금"] as const;

export const PAYMENT_STYLE: Record<string, string> = {
  "입금 확인": "border-grade-s text-grade-s",
  미입금: "border-warn text-warn",
};

/** 바이어마다 가장 최근에 찍은 도장 하나씩(최근 도장이 위) */
export async function getLatestPayments(take = 12) {
  const stamped = await db().review.findMany({
    where: { paymentStatus: { not: null } },
    orderBy: [{ paymentCheckedAt: "desc" }, { id: "desc" }],
    include: { buyer: { select: { name: true } } },
  });
  const seen = new Set<string>();
  return stamped.filter((r) => !seen.has(r.buyerId) && seen.add(r.buyerId)).slice(0, take);
}
