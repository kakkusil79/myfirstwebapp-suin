import saved from "@/data/fx_fallback.json";
import { kst } from "@/lib/format";

// 환율 레이더 — 서버가 환율을 받아 60초 동안 같은 응답을 다시 쓴다. 못 받으면 저장본(data/fx_fallback.json의 latest).
// 키 없는 공개 API(api.frankfurter.dev). FX_FORCE_FALLBACK="1"이면 일부러 저장본을 쓴다(내 PC 시험용).
export const revalidate = 60;

const ENDPOINT = "https://api.frankfurter.dev/v2/rates?base=USD&quotes=KRW,EUR,JPY,CNY";
const QUOTES = ["KRW", "EUR", "JPY", "CNY"] as const;
type Rates = Record<(typeof QUOTES)[number], number>;

/** API 응답 원문([{ date, base, quote, rate }, …]) → 네 통화가 모두 있고 rate > 0일 때만 값, 아니면 null */
function toRates(rows: unknown): { date: string; rates: Rates } | null {
  if (!Array.isArray(rows)) return null;
  const rates: Partial<Rates> = {};
  let date = "";
  for (const q of QUOTES) {
    const row = rows.find((r) => r?.base === "USD" && r?.quote === q);
    if (!row || typeof row.rate !== "number" || !Number.isFinite(row.rate) || row.rate <= 0) return null;
    rates[q] = row.rate;
    if (!date && typeof row.date === "string") date = row.date;
  }
  return date ? { date, rates: rates as Rates } : null;
}

export async function GET() {
  const now = new Date();
  const stamp = { fetchedAt: now.toISOString(), fetchedAtKst: kst(now, true) };

  if (process.env.FX_FORCE_FALLBACK !== "1") {
    try {
      const res = await fetch(ENDPOINT, { signal: AbortSignal.timeout(5000) });
      const got = res.ok ? toRates(await res.json()) : null;
      if (got) {
        return Response.json({
          date: got.date,
          base: "USD",
          rates: got.rates,
          ...stamp,
          provider: "api.frankfurter.dev",
          fallback: false,
        });
      }
    } catch {
      // 시간 초과 · 연결 오류 → 아래 저장본
    }
  }

  const backup = toRates(saved.latest);
  if (!backup) return Response.json({ error: "환율 저장본을 읽지 못했습니다" }, { status: 500 });
  return Response.json({
    date: backup.date,
    base: "USD",
    rates: backup.rates,
    ...stamp,
    provider: saved.provider,
    fallback: true,
    savedAt: saved.savedAt,
    savedAtKst: kst(saved.savedAt, true),
  });
}
