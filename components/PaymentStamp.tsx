"use client";

import { startTransition, useActionState, useEffect, useRef, useState, type FormEvent } from "react";
import { stampPayment } from "@/app/buyers/[id]/actions";
import Notice from "@/components/Notice";
import PaymentMascot from "@/components/PaymentMascot";

// 총무부 도장 칸 — 확인 기록 하나에 입금 여부를 찍는다. 검사 · 저장은 서버 액션(stampPayment)이 한다.
// 찍으면 그 자리에서 천사(입금 확인) · 꼬마 악마(미입금)가 움직이고 효과음이 난다(누른 뒤에만 · 키 없음).
export type StampState = { ok: boolean; message: string; payment: string };

type Current = { status: string; checker: string; at: string } | null;

const PAYMENTS = ["입금 확인", "미입금"];
const LABEL_STYLE: Record<string, string> = {
  "입금 확인": "border-grade-s text-grade-s",
  미입금: "border-warn text-warn",
};

type AudioCtor = typeof AudioContext;

// 효과음 — 천사: 올라가는 맑은 소리, 악마: 내려가는 소리 뒤 '펑'(그림이 터지는 때에 맞춤)
function playSound(ctx: AudioContext, payment: string) {
  const now = ctx.currentTime;
  const angel = payment === "입금 확인";
  const notes = angel ? [523.25, 659.25, 783.99, 1046.5] : [220, 185, 147, 110];
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = angel ? "sine" : "square";
    osc.frequency.value = freq;
    const t = now + i * 0.13;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(angel ? 0.25 : 0.08, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.32);
  });
  if (angel) return;
  const len = Math.floor(ctx.sampleRate * 0.6);
  const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
  const ch = buffer.getChannelData(0);
  for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 2;
  const noise = ctx.createBufferSource();
  const gain = ctx.createGain();
  gain.gain.value = 0.5;
  noise.buffer = buffer;
  noise.connect(gain).connect(ctx.destination);
  noise.start(now + 0.85);
}

export default function PaymentStamp({ reviewId, buyerId, current }: { reviewId: number; buyerId: string; current: Current }) {
  const [state, formAction, pending] = useActionState(stampPayment, { ok: false, message: "", payment: "" });
  const audio = useRef<AudioContext | null>(null);

  // 찍기에 성공한 그 결과에서만 그림을 처음부터 다시 움직인다(key를 바꿔 다시 그림)
  const [seen, setSeen] = useState(state);
  const [playKey, setPlayKey] = useState(0);
  if (state !== seen) {
    setSeen(state);
    if (state.ok) setPlayKey((k) => k + 1);
  }

  useEffect(() => {
    if (!state.ok || !state.payment || !audio.current) return;
    try {
      playSound(audio.current, state.payment);
    } catch {
      // 소리가 안 나도 그림 · 저장은 그대로
    }
  }, [state]);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // 소리는 사람이 누른 이 순간에 준비한다(브라우저가 누르기 전 소리를 막는다)
    try {
      const Ctor: AudioCtor | undefined =
        window.AudioContext ?? (window as unknown as { webkitAudioContext?: AudioCtor }).webkitAudioContext;
      if (Ctor) {
        audio.current ??= new Ctor();
        void audio.current.resume();
      }
    } catch {
      audio.current = null;
    }
    const data = new FormData(e.currentTarget);
    startTransition(() => formAction(data));
  }

  // 방금 찍은 결과가 있으면 그것을, 아니면 DB에 있던 도장을 보인다
  const shown = playKey > 0 && state.ok ? { status: state.payment, checker: "", at: "" } : current;
  const status = shown?.status ?? "";

  return (
    <div className="mt-3 space-y-3 border-t border-line pt-3">
      {shown ? (
        <div className="flex items-center gap-3">
          <PaymentMascot key={playKey} status={status} size={64} play={playKey > 0} />
          <div>
            <span
              className={`inline-flex items-center rounded border px-1.5 text-sm font-semibold ${LABEL_STYLE[status] ?? "border-line text-muted"}`}
            >
              {status}
            </span>
            {current && current.status === status ? (
              <p className="mt-1 text-sm text-muted">
                총무부 {current.checker} · <span className="num">{current.at}</span>
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="space-y-3">
        <input type="hidden" name="reviewId" value={reviewId} />
        <input type="hidden" name="buyerId" value={buyerId} />
        <fieldset>
          <legend className="text-sm text-muted">총무부 입금 확인</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {PAYMENTS.map((p) => (
              <label
                key={p}
                className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-line bg-bg px-3 text-ink has-checked:border-accent has-checked:text-accent"
              >
                <input type="radio" name="payment" value={p} />
                {p}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-0 flex-1">
            <label htmlFor={`checker-${reviewId}`} className="text-sm text-muted">
              총무부 확인자(별명)
            </label>
            <input
              id={`checker-${reviewId}`}
              name="checker"
              type="text"
              placeholder="실명 대신 별명"
              className="mt-1 block min-h-11 w-full rounded-md border border-line bg-bg px-2 text-ink"
            />
          </div>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex min-h-11 items-center rounded-md border border-accent bg-bg px-4 font-semibold text-accent disabled:opacity-60"
          >
            {pending ? "찍는 중…" : "도장 찍기"}
          </button>
        </div>
        {state.message ? <Notice tone={state.ok ? "ok" : "warn"} title={state.message} /> : null}
      </form>
    </div>
  );
}
