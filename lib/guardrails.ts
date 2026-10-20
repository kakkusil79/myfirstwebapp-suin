// 가드레일 G1–G7 — AI가 쓴 독촉 초안을 코드가 채점한다. 하나라도 걸리면 blocked(승인 대기열에 올리지 않는다).
// 순수 함수만(초안 로봇 · 승인 화면이 같이 쓴다). 글자는 NFC로 맞추고 대소문자를 무시해 견준다(G3의 IBAN · SWIFT · BIC만 대문자 그대로).
export const SIGNATURE_EMAIL = "credit@hanbitprecision.example";
export const DISREGARD_LINE = "If you have already paid, please disregard this message.";
export const MAX_WORDS = 180;

export const GUARD_LABELS = {
  G1: "금액 정확",
  G2: "바이어 이름",
  G3: "계좌 없음",
  G4: "법적 표현 없음",
  G5: "이미 냈다면 무시",
  G6: "180단어 이하",
  G7: "링크 · 다른 메일 주소 없음",
} as const;

export type GuardId = keyof typeof GUARD_LABELS;
export type Check = { id: GuardId; label: string; ok: boolean; note: string };

// 앞뒤가 영문자가 아닐 때만(낱말 경계) — 'account now'는 통과. 걸린 낱말은 묶음 1번
const ACCOUNT_RE =
  /(?:^|[^a-z])(account number|account no\.|bank account|bank details|new account|routing number|swift code)(?![a-z])/gi;
const ACCOUNT_UPPER_RE = /\b(IBAN|SWIFT|BIC)\b/g;
const LEGAL_RE = /\b(lawsuit|legal action|court|police|attorney|criminal)\b/gi;
const MONEY_RE = /(?:USD|US\$|\$)\s?\d[\d,]*(?:\.\d+)?/gi;
const LINK_RE = /https?:\/\/|www\./gi;
const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;

const nfc = (s: string) => s.normalize("NFC");
const low = (s: string) => nfc(s).toLowerCase();
const uniq = (xs: string[]) => [...new Set(xs)];
const found = (text: string, re: RegExp, group = 0) => uniq([...nfc(text).matchAll(re)].map((m) => m[group]));

export function runGuardrails({
  subject,
  body,
  buyerName,
  amountText,
}: {
  subject: string;
  body: string;
  buyerName: string;
  amountText: string;
}): Check[] {
  const both = `${subject}\n${body}`;
  const check = (id: GuardId, ok: boolean, note = ""): Check => ({ id, label: GUARD_LABELS[id], ok, note: ok ? "" : note });

  // G1 금액 정확 — 그 금액 글자가 있고, 다른 금액 표기가 없다
  const hasAmount = low(body).includes(low(amountText));
  const otherMoney = found(body, MONEY_RE).filter((m) => low(m) !== low(amountText));
  const g1Note = [hasAmount ? "" : `${amountText} 없음`, ...otherMoney].filter(Boolean).join(" · ");

  // G6 단어 수
  const words = nfc(body).trim().split(/\s+/).filter(Boolean).length;

  // G7 링크 · 서명 말고 다른 메일 주소
  const links = found(both, LINK_RE);
  const otherEmails = found(both, EMAIL_RE).filter((e) => low(e) !== SIGNATURE_EMAIL);

  const account = [...found(both, ACCOUNT_RE, 1), ...found(both, ACCOUNT_UPPER_RE), ...(both.includes("계좌") ? ["계좌"] : [])];
  const legal = found(both, LEGAL_RE);

  return [
    check("G1", hasAmount && otherMoney.length === 0, g1Note),
    check("G2", low(body).includes(low(buyerName)), `${buyerName} 없음`),
    check("G3", account.length === 0, account.join(" · ")),
    check("G4", legal.length === 0, legal.join(" · ")),
    check("G5", low(body).includes(low(DISREGARD_LINE)), "고정 문장 없음"),
    check("G6", words <= MAX_WORDS, `${words}단어`),
    check("G7", links.length === 0 && otherEmails.length === 0, [...links, ...otherEmails].join(" · ")),
  ];
}

/** 걸린 검사 번호들: ["G1", "G5"] */
export function failedIds(checks: Check[]): GuardId[] {
  return checks.filter((c) => !c.ok).map((c) => c.id);
}
