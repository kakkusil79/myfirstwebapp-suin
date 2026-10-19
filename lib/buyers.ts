import data from "@/data/buyers.json";

// 바이어 데이터 읽기. 지금은 data/buyers.json을 그대로 돌려준다.
// async로 둔다 — 5일차에 DB로 바꿀 때 아래 두 함수의 속만 바뀐다.
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

const BUYERS = data as Buyer[];

export async function getBuyers(): Promise<Buyer[]> {
  return BUYERS;
}

export async function getBuyer(id: string): Promise<Buyer | null> {
  const key = id.toUpperCase();
  return BUYERS.find((b) => b.id === key) ?? null;
}
