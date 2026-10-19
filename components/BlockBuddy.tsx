// 블록 친구(아이와 보기): 손으로 그린 SVG — 지역 소품 옆, 블록 탑 위에 선 네모 캐릭터.
// 탑 높이는 value ÷ max(1–6층) 또는 levels(0–10층). 소품은 꾸밈일 뿐 데이터가 아니다. strong이면 옷 · 탑이 경고색.
type Prop = "windmill" | "lantern" | "palm" | "dune" | "castle" | "cactus";

const REGION_PROP: Record<string, Prop> = {
  서유럽: "windmill",
  동아시아: "lantern",
  "동남아·남아": "palm",
  "중동·아프리카": "dune",
  중동부유럽: "castle",
  "북미·중남미": "cactus",
};

const GROUND = 146;
const BASE_BLOCK = 13;
const MAX_BLOCKS = 6;
const MAX_LEVELS = 10;

function RegionProp({ prop }: { prop: Prop | undefined }) {
  switch (prop) {
    case "windmill":
      return (
        <g>
          <path d={`M12 ${GROUND} L16 110 L22 110 L26 ${GROUND}Z`} className="fill-muted" />
          <path d="M19 110 L8 99 M19 110 L30 99 M19 110 L30 121 M19 110 L8 121" className="stroke-ink" strokeWidth="3" strokeLinecap="round" />
          <circle cx="19" cy="110" r="2.5" className="fill-kid-sun" />
        </g>
      );
    case "lantern":
      return (
        <g>
          <rect x="4" y="94" width="3" height={GROUND - 94} className="fill-muted" />
          <path d="M5 95 L20 95 L20 102" className="stroke-muted" strokeWidth="2" fill="none" />
          <ellipse cx="20" cy="114" rx="11" ry="12" className="fill-kid-sun stroke-ink" strokeWidth="1.5" />
          <path d="M11 110 H29 M11 118 H29" className="stroke-ink" strokeWidth="1" />
          <path d="M20 126 V132" className="stroke-ink" strokeWidth="2" />
        </g>
      );
    case "palm":
      return (
        <g fill="none" strokeLinecap="round">
          <path d={`M18 ${GROUND} Q15 126 20 104`} className="stroke-muted" strokeWidth="5" />
          <path d="M20 104 q-10 -6 -17 3 M20 104 q10 -6 17 3 M20 104 q-6 -10 -15 -9 M20 104 q6 -10 15 -9" className="stroke-kid-leaf" strokeWidth="4" />
        </g>
      );
    case "dune":
      return (
        <g>
          <circle cx="10" cy="104" r="6" className="fill-kid-sun" />
          <path d={`M0 ${GROUND} Q14 116 30 ${GROUND}Z`} className="fill-kid-sun stroke-ink" strokeWidth="1" />
          <path d={`M16 ${GROUND} Q27 128 38 ${GROUND}Z`} className="fill-kid-sun stroke-ink" strokeWidth="1" />
        </g>
      );
    case "castle":
      return (
        <g>
          <path d="M19 110 V96" className="stroke-ink" strokeWidth="1.5" />
          <path d="M19 96 L28 99.5 L19 103Z" className="fill-accent" />
          <rect x="4" y="116" width="30" height={GROUND - 116} className="fill-muted" />
          <rect x="4" y="110" width="6" height="6" className="fill-muted" />
          <rect x="16" y="110" width="6" height="6" className="fill-muted" />
          <rect x="28" y="110" width="6" height="6" className="fill-muted" />
          <path d={`M14 ${GROUND} V134 a5 5 0 0 1 10 0 V${GROUND}Z`} className="fill-bg" />
        </g>
      );
    case "cactus":
      return (
        <g className="fill-kid-leaf">
          <rect x="14" y="104" width="10" height={GROUND - 104} rx="5" />
          <rect x="4" y="116" width="7" height="16" rx="3.5" />
          <rect x="4" y="128" width="12" height="6" rx="3" />
          <rect x="27" y="110" width="7" height="14" rx="3.5" />
          <rect x="22" y="120" width="12" height="6" rx="3" />
        </g>
      );
    default:
      return null;
  }
}

export default function BlockBuddy({
  region,
  value = 0,
  max = 0,
  strong = false,
  levels,
}: {
  region: string;
  value?: number;
  max?: number;
  strong?: boolean;
  /** 층수를 직접 정할 때(게임 · 0–10층). 주면 value · max 대신 이 값을 쓰고, 10층이 들어가게 블록을 낮춘다. */
  levels?: number;
}) {
  const blocks =
    levels !== undefined
      ? Math.max(0, Math.min(MAX_LEVELS, Math.round(levels)))
      : max > 0
        ? Math.max(1, Math.min(MAX_BLOCKS, Math.round((value / max) * MAX_BLOCKS)))
        : 1;
  const BLOCK = levels !== undefined ? (MAX_BLOCKS * BASE_BLOCK) / MAX_LEVELS : BASE_BLOCK;
  const feet = GROUND - blocks * BLOCK;
  const body = strong ? "fill-warn" : "fill-accent";

  return (
    <svg viewBox="0 0 100 150" role="img" aria-label={`${region} 블록 친구 · 블록 탑 ${blocks}층`} className="mx-auto block h-auto w-full max-w-40">
      <path d={`M0 ${GROUND} H100`} className="stroke-line" strokeWidth="2" />
      <RegionProp prop={REGION_PROP[region]} />

      {Array.from({ length: blocks }, (_, i) => (
        <rect
          key={i}
          x="40"
          y={GROUND - (i + 1) * BLOCK}
          width="36"
          height={BLOCK}
          rx="1.5"
          className={`${body} stroke-bg`}
          strokeWidth="2"
        />
      ))}

      <g>
        <rect x="50" y={feet - 16} width="7" height="16" className="fill-ink" />
        <rect x="59" y={feet - 16} width="7" height="16" className="fill-ink" />
        <rect x="46" y={feet - 34} width="24" height="18" rx="1" className={body} />
        <rect x="40" y={feet - 34} width="6" height="15" rx="1" className="fill-kid-sun" />
        <rect x="70" y={feet - 34} width="6" height="15" rx="1" className="fill-kid-sun" />
        <rect x="49" y={feet - 52} width="18" height="18" rx="2" className="fill-kid-sun stroke-ink" strokeWidth="1" />
        <circle cx="54.5" cy={feet - 45} r="1.5" className="fill-ink" />
        <circle cx="61.5" cy={feet - 45} r="1.5" className="fill-ink" />
        <path d={`M53.5 ${feet - 40} q4.5 3.5 9 0`} className="stroke-ink" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </g>
    </svg>
  );
}
