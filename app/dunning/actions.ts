"use server";

import { createHash, timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";
import type { DecisionState } from "@/components/DecisionForm";
import { db } from "@/lib/db";

// 독촉 초안 승인 · 반려(서버 액션). 승인해도 메일은 나가지 않는다(실제 발송 없음 — 보내는 코드가 없다).
// pending만 결정할 수 있고, 결정과 감사 기록 1줄은 한 트랜잭션으로 함께 남는다. 지우는 코드는 없다.

/** 승인 코드를 서버에서만 견준다(길이 · 내용이 응답 시간으로 새지 않게 해시 후 비교). 값은 어디에도 쓰지 않는다. */
function samePin(input: string, pin: string): boolean {
  const a = createHash("sha256").update(input).digest();
  const b = createHash("sha256").update(pin).digest();
  return timingSafeEqual(a, b);
}

export async function decide(prev: DecisionState, formData: FormData): Promise<DecisionState> {
  const fail = (message: string): DecisionState => ({ ok: false, message });

  // 1) 승인 코드가 설정되어 있는지
  const pin = (process.env.APPROVER_PIN ?? "").trim();
  if (!pin) return fail("승인 코드가 설정되지 않았습니다");

  // 2) 입력 검사(앞뒤 공백 제거)
  const id = Number(String(formData.get("draftId") ?? "").trim());
  const decision = String(formData.get("decision") ?? "").trim();
  const approver = String(formData.get("approver") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();
  if (!Number.isInteger(id) || id < 1) return fail("초안 번호가 올바르지 않습니다");
  if (decision !== "approve" && decision !== "reject") return fail("승인 또는 반려 단추를 눌러 주세요");
  if (!approver) return fail("승인자 별명을 적어 주세요");
  if (approver.length > 20) return fail("별명은 20자 이내로 적어 주세요");
  const approve = decision === "approve";
  if (!approve && reason.length < 5) return fail("반려 사유를 5자 이상 적어 주세요");
  if (!approve && reason.length > 200) return fail("반려 사유는 200자 이내로 적어 주세요");

  // 3) 승인 코드 — 다르면 DB는 아무것도 바꾸지 않는다(감사 기록도 쓰지 않는다)
  if (!samePin(code, pin)) return fail("승인 코드가 다릅니다");

  // 4) pending일 때만 바꾸고, 바뀐 경우에만 감사 기록 1줄
  let result: "ok" | "done" | "missing";
  try {
    result = await db().$transaction(async (tx) => {
      const draft = await tx.dunningDraft.findUnique({ where: { id }, select: { buyerId: true } });
      if (!draft) return "missing";
      const { count } = await tx.dunningDraft.updateMany({
        where: { id, status: "pending" },
        data: {
          status: approve ? "approved" : "rejected",
          decidedBy: approver,
          decidedAt: new Date(),
          reason: approve ? null : reason,
        },
      });
      if (count === 0) return "done";
      await tx.auditLog.create({
        data: {
          actor: approver,
          action: approve ? "승인" : "반려",
          target: `${draft.buyerId} · 초안 #${id}`,
          detail: approve ? "발송 대기 — 실제 발송 없음" : `사유: ${reason}`,
        },
      });
      return "ok";
    });
  } catch {
    return fail("저장하지 못했습니다 — 잠시 뒤 다시 눌러 주세요");
  }
  if (result === "missing") return fail("초안을 찾을 수 없습니다");
  if (result === "done") return fail("이미 처리된 초안입니다");

  // 5) 화면 다시 그리기
  revalidatePath("/dunning");
  revalidatePath("/audit");
  return { ok: true, message: approve ? "승인했습니다 — 발송 대기(실제 발송 없음)" : "반려했습니다" };
}
