"use server";

import { revalidatePath } from "next/cache";
import type { StampState } from "@/components/PaymentStamp";
import type { ReviewState } from "@/components/ReviewForm";
import { db } from "@/lib/db";
import { PAYMENT_STATUSES, REVIEW_STATUSES } from "@/lib/reviews";

// 확인 기록 쓰기(서버 액션). 검사는 여기서 한다 — 브라우저 검사는 건너뛸 수 있다.
// 처음 걸린 하나만 돌려주고 저장하지 않는다.
export async function addReview(prev: ReviewState, formData: FormData): Promise<ReviewState> {
  const buyerId = String(formData.get("buyerId") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  const memo = String(formData.get("memo") ?? "").trim();
  const reviewer = String(formData.get("reviewer") ?? "").trim();

  if (!(REVIEW_STATUSES as readonly string[]).includes(status)) return { ok: false, message: "상태를 골라 주세요" };
  if (!memo) return { ok: false, message: "메모를 적어 주세요" };
  if (memo.length > 200) return { ok: false, message: "메모는 200자 이내로 적어 주세요" };
  if (!reviewer) return { ok: false, message: "확인한 사람(별명)을 적어 주세요" };
  if (reviewer.length > 20) return { ok: false, message: "별명은 20자 이내로 적어 주세요" };

  try {
    const buyer = await db().buyer.findUnique({ where: { id: buyerId }, select: { id: true } });
    if (!buyer) return { ok: false, message: "바이어를 찾을 수 없습니다" };
    await db().review.create({ data: { buyerId, status, memo, reviewer } });
  } catch {
    // 오류 글 · 주소는 화면에 쓰지 않는다
    return { ok: false, message: "저장하지 못했습니다 — 잠시 뒤 다시 눌러 주세요" };
  }

  revalidatePath(`/buyers/${buyerId}`);
  revalidatePath("/");
  return { ok: true, message: "저장했습니다 — 새로 고쳐도 남아 있습니다" };
}

// 총무부 도장(자유 퀘스트) — 이미 남은 확인 기록 하나에 입금 여부 · 확인자 · 시각을 적는다(다시 찍으면 덮어쓴다).
export async function stampPayment(prev: StampState, formData: FormData): Promise<StampState> {
  const reviewId = Number(formData.get("reviewId"));
  const buyerId = String(formData.get("buyerId") ?? "").trim();
  const payment = String(formData.get("payment") ?? "").trim();
  const checker = String(formData.get("checker") ?? "").trim();

  const fail = (message: string): StampState => ({ ok: false, message, payment: "" });
  if (!(PAYMENT_STATUSES as readonly string[]).includes(payment)) return fail("입금 여부를 골라 주세요");
  if (!checker) return fail("총무부 확인자(별명)를 적어 주세요");
  if (checker.length > 20) return fail("별명은 20자 이내로 적어 주세요");

  try {
    const review = Number.isInteger(reviewId)
      ? await db().review.findFirst({ where: { id: reviewId, buyerId }, select: { id: true } })
      : null;
    if (!review) return fail("확인 기록을 찾을 수 없습니다");
    await db().review.update({
      where: { id: review.id },
      data: { paymentStatus: payment, financeChecker: checker, paymentCheckedAt: new Date() },
    });
  } catch {
    return fail("저장하지 못했습니다 — 잠시 뒤 다시 눌러 주세요");
  }

  revalidatePath(`/buyers/${buyerId}`);
  revalidatePath("/kids");
  return { ok: true, message: `도장을 찍었습니다 — ${payment}`, payment };
}
