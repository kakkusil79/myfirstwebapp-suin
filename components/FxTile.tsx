"use client";

import { useEffect, useState } from "react";
import { fx, int, krw, usd } from "@/lib/format";

// 환율 타일(첫 화면 맨 위) — 화면 움직임만. 달러 합계는 서버가 계산해 props로 주고, 환율은 /api/fx에서 받는다.
// 처음 한 번, 그 뒤 60초마다 다시 받는다. 원화 = Math.round(달러 × 환율) 한 번만.
type FxResponse = {
  date: string;
  base: "USD";
  rates: { KRW: number; EUR: number; JPY: number; CNY: number };
  fetchedAt: string;
  fetchedAtKst: string;
  provider: string;
  fallback: boolean;
  savedAt?: string;
  savedAtKst?: string;
};

type Props = {
  cArUsd: number;
  overdueUsd: number;
  overdueCount: number;
  base: { date: string; krw: number | null };
};

export default function FxTile({ cArUsd, overdueUsd, overdueCount, base }: Props) {
  const [data, setData] = useState<FxResponse | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const res = await fetch("/api/fx");
        if (!res.ok) throw new Error(String(res.status));
        const json = (await res.json()) as FxResponse;
        if (alive) {
          setData(json);
          setFailed(false);
        }
      } catch {
        if (alive) setFailed(true);
      }
    }
    load();
    const timer = setInterval(load, 60_000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, []);

  const rate = data?.rates.KRW;
  const cKrw = rate ? Math.round(cArUsd * rate) : null;
  const cKrwBase = base.krw ? Math.round(cArUsd * base.krw) : null;
  const diff = cKrw !== null && cKrwBase !== null ? cKrw - cKrwBase : null;
  const overdueKrw = rate ? Math.round(overdueUsd * rate) : null;
  // 받은 시각은 서버가 만든 글자에서 시:분:초만
  const time = data?.fetchedAtKst.split(" ")[1] ?? "—";

  return (
    <section aria-labelledby="fx-title" className="rounded-lg border border-line bg-surface p-4">
      <h2 id="fx-title" className="font-semibold text-ink">
        지금 환율로 본 원화
      </h2>

      {!data ? (
        <p className="mt-2 text-sm text-muted">
          {failed ? "환율을 받지 못했습니다 — 확인 필요(1분 뒤 다시 받습니다)" : "환율 받는 중…"}
        </p>
      ) : (
        <>
          <p className="num mt-1 text-3xl font-bold text-ink">{krw(cKrw)}</p>
          <p className="text-sm text-muted">
            C등급 <span className="num">{usd(cArUsd)}</span> × 오늘 환율
          </p>

          <ul className="mt-3 space-y-1 text-sm text-ink">
            <li>
              1 USD = <span className="num">{fx(rate)}</span> · <span className="num">{data.date}</span> · {data.provider} ·
              받은 시각 <span className="num">{time}</span>
            </li>
            <li>
              9/30 기준 <span className="num">{fx(base.krw)}</span> → C등급 <span className="num">{usd(cArUsd)}</span> ={" "}
              <span className="num">{krw(cKrwBase)}</span> · 오늘 − 9/30{" "}
              <span className="num font-semibold">{diff === null ? "확인 필요" : `${diff > 0 ? "+" : ""}${krw(diff)}`}</span>
            </li>
            <li>
              연체 <span className="num">{int(overdueCount)}곳</span> <span className="num">{usd(overdueUsd)}</span> ={" "}
              <span className="num">{krw(overdueKrw)}</span>(오늘 환율)
            </li>
          </ul>

          {data.fallback ? (
            <p className="mt-3">
              <span className="inline-flex flex-wrap items-center gap-1 rounded border border-warn bg-bg px-1.5 text-sm font-semibold text-warn">
                대체 값 · 저장 시각 <span className="num">{data.savedAtKst ?? "확인 필요"}</span>
              </span>
            </p>
          ) : null}
        </>
      )}

      <p className="mt-3 text-xs text-muted">환율은 참고값입니다 — 결제 · 회계 기준이 아닙니다</p>
    </section>
  );
}
