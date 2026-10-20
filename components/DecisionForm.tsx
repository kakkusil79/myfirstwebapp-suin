"use client";

import { startTransition, useActionState, type FormEvent } from "react";
import { decide } from "@/app/dunning/actions";
import Notice from "@/components/Notice";

// 독촉 초안 승인 · 반려 폼(대기 카드에만) — 화면 움직임만. 검사 · 승인 코드 비교 · 저장은 서버 액션(decide)이 한다.
export type DecisionState = { ok: boolean; message: string };

export default function DecisionForm({ draftId }: { draftId: number }) {
  const [state, formAction, pending] = useActionState(decide, { ok: false, message: "" });

  // 누른 단추(승인 · 반려)의 값까지 함께 보낸다. <form action>으로 두면 실패해도 칸이 비워진다.
  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const submitter = (e.nativeEvent as SubmitEvent).submitter;
    const data = new FormData(e.currentTarget, submitter);
    startTransition(() => formAction(data));
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 border-t border-line pt-3">
      <input type="hidden" name="draftId" value={draftId} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor={`approver-${draftId}`} className="text-sm text-muted">
            승인자 별명
          </label>
          <input
            id={`approver-${draftId}`}
            name="approver"
            type="text"
            placeholder="실명 대신 별명"
            className="mt-1 block min-h-11 w-full rounded-md border border-line bg-bg px-2 text-ink"
          />
        </div>
        <div>
          <label htmlFor={`code-${draftId}`} className="text-sm text-muted">
            승인 코드
          </label>
          <input
            id={`code-${draftId}`}
            name="code"
            type="password"
            autoComplete="off"
            className="mt-1 block min-h-11 w-full rounded-md border border-line bg-bg px-2 text-ink"
          />
        </div>
      </div>
      <div>
        <label htmlFor={`reason-${draftId}`} className="text-sm text-muted">
          반려 사유(반려할 때만 · 5–200자)
        </label>
        <textarea
          id={`reason-${draftId}`}
          name="reason"
          rows={2}
          placeholder="예: 금액을 한 번 더 확인한 뒤 다시 쓰기"
          className="mt-1 block w-full rounded-md border border-line bg-bg p-2 text-ink"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          name="decision"
          value="approve"
          disabled={pending}
          className="inline-flex min-h-11 items-center rounded-md bg-accent px-4 font-semibold text-white disabled:opacity-60"
        >
          {pending ? "처리 중…" : "승인"}
        </button>
        <button
          type="submit"
          name="decision"
          value="reject"
          disabled={pending}
          className="inline-flex min-h-11 items-center rounded-md border border-warn bg-bg px-4 font-semibold text-warn disabled:opacity-60"
        >
          반려
        </button>
      </div>
      {state.message ? <Notice tone={state.ok ? "ok" : "warn"} title={state.message} /> : null}
    </form>
  );
}
