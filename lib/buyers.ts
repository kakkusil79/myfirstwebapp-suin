import { db } from "@/lib/db";

// 바이어 데이터 읽기. 5일차부터 Supabase DB의 Buyer 표에서 읽는다(서버 전용).
// 함수 이름 · 인자 · 돌려주는 모양은 4일차 그대로 — 쪽과 lib/metrics는 바뀌지 않는다.
export type Grade = "S" | "A" | "B" | "C";

export type Buyer = {
  id: string;
  name: string;
  countryCode: string;
  countryKo: string;
  region: string;
  industry: string;
  paymentMethod: string;
  termsDays: number;
  openArUsd: number;
  overdueUsd: number;
  pctAr31p: number | null; // 0–1
  oldestOpenDays: number;
  avgDaysLate12m: number | null;
  pd30d: number; // 0–1
  grade: Grade;
  signals: string[];
};

// DB의 grade 칸은 글자(String)라 Grade 형으로 맞춘다 — 값은 seed가 넣은 S · A · B · C 그대로.
export async function getBuyers(): Promise<Buyer[]> {
  return (await db().buyer.findMany({ orderBy: { id: "asc" } })) as Buyer[];
}

export async function getBuyer(id: string): Promise<Buyer | null> {
  return (await db().buyer.findUnique({ where: { id: id.toUpperCase() } })) as Buyer | null;
}
