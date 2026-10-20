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
