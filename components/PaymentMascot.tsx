// 총무부 도장 그림(아이와 보기 · 상세 쪽): 입금 확인 = 날개를 펴는 천사, 미입금 = 펑 터지는 꼬마 악마.
// 손으로 그린 SVG + globals.css의 움직임(한 번만). 장식이라 읽어 주는 글자는 옆에 따로 둔다.
// 움직임 줄이기 설정이면 멈춘 그림(천사 · 악마 + 펑 + 연기)으로 보인다.
const LINE = { fill: "none", strokeWidth: 2.5, strokeLinecap: "round" as const };

// 펑! 별 모양(바깥 36 · 안 20, 꼭짓점 10개)
const BURST = Array.from({ length: 20 }, (_, i) => {
  const r = i % 2 === 0 ? 36 : 20;
  const a = (Math.PI * i) / 10 - Math.PI / 2;
  return `${(40 + r * Math.cos(a)).toFixed(1)},${(42 + r * Math.sin(a)).toFixed(1)}`;
}).join(" ");

export default function PaymentMascot({ status, size = 64, play = true }: { status: string; size?: number; play?: boolean }) {
  const paid = status === "입금 확인";
  return (
    <svg
      viewBox="0 0 80 80"
      width={size}
      height={size}
      aria-hidden="true"
      className={`mascot shrink-0 overflow-visible ${play ? "mascot-play" : ""}`}
    >
      {paid ? (
        <g className="angel-body">
          <ellipse cx="40" cy="12" rx="14" ry="4" className="angel-halo stroke-kid-sun" fill="none" strokeWidth="3" />
          <g className="wing-l">
            <path d="M27 46 Q6 44 4 20 Q18 24 30 36 Z" className="fill-bg stroke-grade-s" strokeWidth="2" />
            <path d="M24 42 Q14 38 10 28" className="stroke-grade-s" fill="none" strokeWidth="1.5" />
          </g>
          <g className="wing-r">
            <path d="M53 46 Q74 44 76 20 Q62 24 50 36 Z" className="fill-bg stroke-grade-s" strokeWidth="2" />
            <path d="M56 42 Q66 38 70 28" className="stroke-grade-s" fill="none" strokeWidth="1.5" />
          </g>
          <circle cx="40" cy="44" r="17" className="fill-bg stroke-grade-s" strokeWidth="3" />
          <path d="M31 42 q3 -3 6 0 M43 42 q3 -3 6 0" className="stroke-ink" {...LINE} />
          <path d="M32 50 q8 6 16 0" className="stroke-ink" {...LINE} />
        </g>
      ) : (
        <>
          <g className="devil-smoke">
            <circle cx="28" cy="50" r="9" className="fill-line stroke-muted" strokeWidth="1.5" />
            <circle cx="42" cy="44" r="11" className="fill-line stroke-muted" strokeWidth="1.5" />
            <circle cx="54" cy="52" r="8" className="fill-line stroke-muted" strokeWidth="1.5" />
          </g>
          <g className="devil-burst">
            <polygon points={BURST} className="fill-kid-sun stroke-grade-c" strokeWidth="2" strokeLinejoin="round" />
            <text x="40" y="48" textAnchor="middle" fontSize="15" fontWeight="800" className="fill-grade-c">
              펑!
            </text>
          </g>
          <g className="devil-body">
            <path d="M28 34 L23 16 L36 28 Z" className="fill-grade-c" />
            <path d="M52 34 L57 16 L44 28 Z" className="fill-grade-c" />
            <circle cx="40" cy="45" r="17" className="fill-grade-c" />
            <path d="M30 38 l7 3 M50 38 l-7 3" className="stroke-bg" {...LINE} />
            <circle cx="34" cy="45" r="2.5" className="fill-bg" />
            <circle cx="46" cy="45" r="2.5" className="fill-bg" />
            <path d="M33 53 q7 -5 14 0" className="stroke-bg" {...LINE} />
          </g>
        </>
      )}
    </svg>
  );
}
