import type { Grade } from "@/lib/buyers";

// 독촉 계산 — 단계 · 말투 · 금액 글자는 코드가 정한다(AI에게 맡기지 않는다). 순수 함수만(초안 로봇 · 화면이 같이 쓴다).
export type Stage = "D+7" | "D+15" | "D+30";
export type Tone = "T1" | "T2" | "T3";
export type ToneMatrix = Record<Stage, Record<Grade, Tone>>;

export const STAGES: readonly Stage[] = ["D+7", "D+15", "D+30"];
export const TONES: readonly Tone[] = ["T1", "T2", "T3"];

/** 가장 오래 밀린 날 수 → 단계. 30 이상 D+30 · 15–29 D+15 · 7–14 D+7 · 1–6 대기 · 0 이하 확인 필요 */
export function stageFor(days: number): Stage | "대기" | "확인 필요" {
  if (!Number.isFinite(days) || days <= 0) return "확인 필요";
  if (days >= 30) return "D+30";
  if (days >= 15) return "D+15";
  if (days >= 7) return "D+7";
  return "대기";
}

/** data/tone_matrix.csv 글자(열 stage,S,A,B,C) → 단계 × 등급 표. 칸이 비거나 엉뚱하면 오류 */
export function parseToneMatrix(csv: string): ToneMatrix {
  const lines = csv.replace(/^﻿/, "").trim().split(/\r?\n/);
  const head = lines[0].split(",").map((s) => s.trim());
  if (head.join(",") !== "stage,S,A,B,C") throw new Error(`tone_matrix.csv 머리 줄이 다릅니다: ${lines[0]}`);
  const out: Partial<ToneMatrix> = {};
  for (const line of lines.slice(1)) {
    const cells = line.split(",").map((s) => s.trim());
    const stage = cells[0] as Stage;
    if (!STAGES.includes(stage)) continue;
    const row: Partial<Record<Grade, Tone>> = {};
    head.slice(1).forEach((g, i) => {
      const tone = cells[i + 1] as Tone;
      if (!TONES.includes(tone)) throw new Error(`tone_matrix.csv ${stage} · ${g} 칸이 T1–T3가 아닙니다: ${cells[i + 1]}`);
      row[g as Grade] = tone;
    });
    out[stage] = row as Record<Grade, Tone>;
  }
  for (const s of STAGES) if (!out[s]) throw new Error(`tone_matrix.csv에 ${s} 줄이 없습니다`);
  return out as ToneMatrix;
}

export function toneFor(matrix: ToneMatrix, stage: Stage, grade: string): Tone | null {
  return matrix[stage][grade as Grade] ?? null;
}

const usd2 = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** 연체 금액 글자: 12345 → "USD 12,345.00" (메일 · 검사 G1이 같은 글자를 쓴다) */
export function amountText(usd: number): string {
  return `USD ${usd2.format(usd)}`;
}

/** data/dunning_templates.md → 그 말투의 본보기 + 공통 '반드시' · 넣지 않는 것 · 서명 절(AI에게 줄 글) */
export function templateFor(md: string, tone: Tone): string {
  const sections = md.split(/\r?\n(?=## )/).filter((s) => s.startsWith("## "));
  const pick = (test: (title: string) => boolean) => sections.filter((s) => test(s.split(/\r?\n/)[0].slice(3)));
  const parts = [
    ...pick((t) => t.startsWith("모든 틀에 공통")),
    ...pick((t) => t.startsWith("넣지 않는 것")),
    ...pick((t) => t.startsWith("서명")),
    ...pick((t) => t.startsWith(`${tone} `)),
  ];
  if (!parts.some((p) => p.startsWith(`## ${tone} `))) throw new Error(`dunning_templates.md에 ${tone} 본보기가 없습니다`);
  return parts.join("\n\n").trim();
}
