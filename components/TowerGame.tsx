"use client";

import { useState } from "react";
import BlockBuddy from "@/components/BlockBuddy";
import { FACE_NAME, FaceIcon } from "@/components/GradeFace";
import type { Grade } from "@/lib/buyers";
import { pct } from "@/lib/format";

// 블록 탑 쌓기 게임: 두 바이어 중 위험 점수(pd30d)가 더 높은 쪽을 맞히면 탑이 한 층 오른다.
// 값은 쪽(서버)에서 필요한 5칸만 props로 받는다. 문제는 '시작'을 누를 때 섞는다(쪽을 열 때 섞지 않는다).
// 점수는 어디에도 저장하지 않는다.
export type GameCard = { id: string; name: string; countryKo: string; grade: Grade; pd30d: number };

const ROUNDS = 10;
const MIN_GAP = 0.05; // 두 카드의 위험 점수가 5%p 이상 차이 나는 짝만

type Round = [GameCard, GameCard];

function makeRounds(cards: GameCard[]): Round[] {
  const rounds: Round[] = [];
  const used = new Set<string>();
  for (let tries = 0; rounds.length < ROUNDS && tries < 5000; tries++) {
    const a = cards[Math.floor(Math.random() * cards.length)];
    const b = cards[Math.floor(Math.random() * cards.length)];
    if (!a || !b || a.id === b.id || used.has(a.id) || used.has(b.id)) continue;
    if (Math.abs(a.pd30d - b.pd30d) < MIN_GAP) continue;
    used.add(a.id);
    used.add(b.id);
    rounds.push([a, b]);
  }
  return rounds;
}

function titleFor(score: number, total: number): string {
  if (score === total) return "꼬마 악마 사냥꾼";
  if (score >= 7) return "천사 탐정";
  if (score >= 4) return "블록 견습생";
  return "한 번 더 도전!";
}

const BUTTON = "inline-flex min-h-11 items-center rounded-md bg-accent px-4 font-semibold text-white";

export default function TowerGame({ cards }: { cards: GameCard[] }) {
  const [rounds, setRounds] = useState<Round[]>([]);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);

  const start = () => {
    setRounds(makeRounds(cards));
    setIndex(0);
    setPicked(null);
    setScore(0);
  };

  const playing = rounds.length > 0 && index < rounds.length;
  const done = rounds.length > 0 && index >= rounds.length;
  const round = playing ? rounds[index] : null;
  const higher = round ? (round[0].pd30d > round[1].pd30d ? round[0] : round[1]) : null;
  const right = picked !== null && higher?.id === picked;

  const pick = (id: string) => {
    if (picked !== null || !higher) return;
    setPicked(id);
    if (id === higher.id) setScore((s) => s + 1);
  };

  const next = () => {
    setPicked(null);
    setIndex((i) => i + 1);
  };

  return (
    <div className="rounded-lg border border-line bg-kid-sky p-4">
      <div className="grid gap-4 sm:grid-cols-[10rem_1fr] sm:items-start">
        <div className="mx-auto w-32 sm:w-40">
          <BlockBuddy region="내" levels={score} />
          <p className="mt-1 text-center text-sm text-ink">
            내 탑 <span className="num font-semibold">{score}층</span>
          </p>
        </div>

        <div className="space-y-3">
          {!playing && !done ? (
            <>
              <p className="text-ink">
                두 바이어 친구 중 <strong>위험 점수가 더 높은 친구</strong>를 골라 보세요. 맞히면 탑이 한 층 올라가요.
                얼굴이 힌트예요. 모두 <span className="num">{ROUNDS}</span>판이에요.
              </p>
              <button type="button" onClick={start} className={BUTTON}>
                게임 시작
              </button>
            </>
          ) : null}

          {round ? (
            <>
              <p className="text-sm text-muted">
                <span className="num">
                  {index + 1} / {rounds.length}
                </span>
                판 · 누가 더 높을까요?
              </p>
              <ul className="grid grid-cols-2 gap-3">
                {round.map((c) => {
                  const isHigher = picked !== null && c.id === higher?.id;
                  const isPicked = picked === c.id;
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => pick(c.id)}
                        disabled={picked !== null}
                        aria-pressed={isPicked}
                        className={`flex min-h-11 w-full flex-col items-start gap-1 rounded-lg border-2 bg-bg p-3 text-left ${
                          isHigher ? "border-warn" : isPicked ? "border-accent" : "border-line"
                        } ${picked === null ? "hover:border-accent" : ""}`}
                      >
                        <span className="flex items-center gap-1.5">
                          <FaceIcon grade={c.grade} size={36} />
                          <span className="text-sm text-ink">
                            {FACE_NAME[c.grade]} {c.grade}
                          </span>
                        </span>
                        <span className="font-semibold text-ink">{c.name}</span>
                        <span className="text-sm text-muted">{c.countryKo}</span>
                        {picked !== null ? (
                          <span className="text-sm text-ink">
                            위험 점수 <span className="num font-semibold">{pct(c.pd30d)}</span>
                          </span>
                        ) : null}
                        {isPicked ? <span className="text-xs text-accent">내가 고른 친구</span> : null}
                        {isHigher ? <span className="text-xs font-semibold text-warn">더 높아요</span> : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
              {picked !== null ? (
                <div className="space-y-3">
                  <p role="status" className="font-semibold text-ink">
                    {right ? "맞았어요! 탑이 한 층 올라갔어요." : `아쉬워요! 이번엔 ${higher?.name} 친구가 더 높았어요.`}
                  </p>
                  <button type="button" onClick={next} className={BUTTON}>
                    {index + 1 < rounds.length ? "다음 판" : "결과 보기"}
                  </button>
                </div>
              ) : null}
            </>
          ) : null}

          {done ? (
            <div className="space-y-3" role="status">
              <p className="text-ink">
                <span className="num font-semibold">
                  {score} / {rounds.length}
                </span>{" "}
                맞혔어요!
              </p>
              <p className="text-2xl font-bold text-ink">{titleFor(score, rounds.length)}</p>
              <button type="button" onClick={start} className={BUTTON}>
                다시 하기
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
