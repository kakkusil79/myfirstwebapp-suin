import type { Grade } from "@/lib/buyers";

// 등급 얼굴(아이와 보기): 손으로 그린 SVG 얼굴 + 등급 글자. 색 · 얼굴만으로 말하지 않고 글자(S · A · B · C)를 함께 둔다.
// grade는 데이터의 grade 칸 그대로 — 다시 계산하지 않는다.
export const FACE_NAME: Record<Grade, string> = { S: "천사", A: "방긋이", B: "갸웃이", C: "꼬마 악마" };

const LETTER: Record<Grade, string> = {
  S: "text-grade-s",
  A: "text-grade-a",
  B: "text-grade-b",
  C: "text-grade-c",
};

const LINE = { fill: "none", strokeWidth: 2, strokeLinecap: "round" as const };

/** 얼굴 그림만(장식 — 읽어 주는 글자는 옆에 따로 둔다) */
export function FaceIcon({ grade, size = 28 }: { grade: Grade; size?: number }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden="true" className="shrink-0">
      {grade === "S" ? (
        <>
          <ellipse cx="20" cy="6" rx="9" ry="3" className="stroke-kid-sun" fill="none" strokeWidth="2.5" />
          <path d="M9 22 Q1 20 2 12 Q7 14 10 18Z" className="fill-bg stroke-grade-s" strokeWidth="1.5" />
          <path d="M31 22 Q39 20 38 12 Q33 14 30 18Z" className="fill-bg stroke-grade-s" strokeWidth="1.5" />
          <circle cx="20" cy="23" r="12" className="fill-bg stroke-grade-s" strokeWidth="2.5" />
          <path d="M14 22 q2 -2.5 4 0 M22 22 q2 -2.5 4 0" className="stroke-ink" {...LINE} />
          <path d="M15 27 q5 4 10 0" className="stroke-ink" {...LINE} />
        </>
      ) : null}
      {grade === "A" ? (
        <>
          <circle cx="20" cy="22" r="13" className="fill-bg stroke-grade-a" strokeWidth="2.5" />
          <circle cx="15.5" cy="19.5" r="1.8" className="fill-ink" />
          <circle cx="24.5" cy="19.5" r="1.8" className="fill-ink" />
          <path d="M13 25 q7 7 14 0" className="stroke-ink" {...LINE} />
        </>
      ) : null}
      {grade === "B" ? (
        <g transform="rotate(-10 20 22)">
          <circle cx="20" cy="22" r="13" className="fill-bg stroke-grade-b" strokeWidth="2.5" />
          <path d="M12.5 15 l5 -1.5" className="stroke-ink" {...LINE} />
          <circle cx="15.5" cy="20" r="1.8" className="fill-ink" />
          <circle cx="24.5" cy="20" r="1.8" className="fill-ink" />
          <path d="M14.5 28 q2.75 -2.5 5.5 0 t5.5 0" className="stroke-ink" {...LINE} />
        </g>
      ) : null}
      {grade === "C" ? (
        <>
          <path d="M10 15 L7 3 L17 11Z" className="fill-grade-c" />
          <path d="M30 15 L33 3 L23 11Z" className="fill-grade-c" />
          <circle cx="20" cy="23" r="13" className="fill-grade-c" />
          <path d="M12.5 17.5 l5.5 2.5 M27.5 17.5 l-5.5 2.5" className="stroke-bg" {...LINE} />
          <circle cx="16" cy="23" r="2" className="fill-bg" />
          <circle cx="24" cy="23" r="2" className="fill-bg" />
          <path d="M14 28 q6 5 12 0" className="stroke-bg" {...LINE} />
          <path d="M17 29.3 l1.2 2.4 l1.2 -1.9Z" className="fill-bg" />
        </>
      ) : null}
    </svg>
  );
}

/** 얼굴 + 등급 글자(+ 이름) */
export default function GradeFace({ grade, size = 28, showName = false }: { grade: Grade; size?: number; showName?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <FaceIcon grade={grade} size={size} />
      <span className={`font-semibold ${LETTER[grade]}`}>{grade}</span>
      {showName ? <span className="text-sm text-ink">{FACE_NAME[grade]}</span> : <span className="sr-only">등급 {FACE_NAME[grade]}</span>}
    </span>
  );
}
