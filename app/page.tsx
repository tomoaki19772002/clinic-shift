"use client";

import { useState, useEffect, useCallback, useRef } from "react";

type Op = "+" | "-" | "×";
type Phase = "start" | "playing" | "result";

interface Question {
  a: number;
  b: number;
  op: Op;
  answer: number;
}

function generateQuestion(): Question {
  const ops: Op[] = ["+", "-", "×"];
  const op = ops[Math.floor(Math.random() * ops.length)];
  let a = Math.floor(Math.random() * 9) + 1;
  let b = Math.floor(Math.random() * 9) + 1;

  if (op === "-") {
    if (a < b) [a, b] = [b, a];
  }

  const answer =
    op === "+" ? a + b : op === "-" ? a - b : a * b;

  return { a, b, op, answer };
}

const TOTAL_TIME = 180;

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function CalcApp() {
  const [phase, setPhase] = useState<Phase>("start");
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [question, setQuestion] = useState<Question>(() => generateQuestion());
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // タイマー
  useEffect(() => {
    if (phase !== "playing") return;
    if (timeLeft <= 0) {
      setPhase("result");
      return;
    }
    const id = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [phase, timeLeft]);

  const nextQuestion = useCallback(() => {
    setQuestion(generateQuestion());
    setInput("");
    setFeedback(null);
  }, []);

  const handleAnswer = useCallback(() => {
    if (!input || feedback) return;
    const userAnswer = parseInt(input, 10);
    if (isNaN(userAnswer)) return;

    if (userAnswer === question.answer) {
      setScore((s) => s + 1);
      setCorrectCount((c) => c + 1);
      setFeedback("correct");
    } else {
      setScore((s) => s - 1);
      setWrongCount((w) => w + 1);
      setFeedback("wrong");
    }

    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => {
      nextQuestion();
    }, 700);
  }, [input, question.answer, feedback, nextQuestion]);

  const handleTap = useCallback(
    (val: string) => {
      if (feedback) return;
      if (val === "DEL") {
        setInput((prev) => prev.slice(0, -1));
      } else if (val === "OK") {
        handleAnswer();
      } else {
        if (input.length >= 3) return;
        // マイナス記号は先頭のみ
        if (val === "-") {
          if (input.length === 0) setInput("-");
          return;
        }
        setInput((prev) => prev + val);
      }
    },
    [feedback, input, handleAnswer]
  );

  const startGame = () => {
    setScore(0);
    setCorrectCount(0);
    setWrongCount(0);
    setTimeLeft(TOTAL_TIME);
    setQuestion(generateQuestion());
    setInput("");
    setFeedback(null);
    setPhase("playing");
  };

  const timerColor =
    timeLeft > 60 ? "text-emerald-600" : timeLeft > 30 ? "text-orange-500" : "text-red-500";

  // --------- スタート画面 ---------
  if (phase === "start") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-sky-200 to-indigo-200 px-6">
        <div className="text-center mb-10">
          <div className="text-7xl mb-4">🧮</div>
          <h1 className="text-4xl font-black text-indigo-800 mb-2">けいさん チャレンジ</h1>
          <p className="text-indigo-600 text-lg font-bold mt-1">3ぷんかん　いくつ　できるかな？</p>
        </div>

        <div className="bg-white rounded-3xl shadow-lg px-8 py-6 mb-10 w-full max-w-xs text-center">
          <p className="text-slate-600 text-base font-bold mb-3">ルール</p>
          <div className="space-y-2 text-left text-sm text-slate-700">
            <div className="flex items-center gap-2">
              <span className="text-2xl">➕ ➖ ✖️</span>
              <span>たし算・ひき算・かけ算</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-500 font-black text-lg">◯</span>
              <span>あたり → <span className="font-bold text-green-600">+1ポイント</span></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-red-500 font-black text-lg">✕</span>
              <span>はずれ → <span className="font-bold text-red-500">-1ポイント</span></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl">⏱</span>
              <span>3ぷんかん　チャレンジ！</span>
            </div>
          </div>
        </div>

        <button
          onClick={startGame}
          className="w-full max-w-xs py-5 bg-indigo-600 text-white text-2xl font-black rounded-3xl shadow-xl active:scale-95 transition-transform"
        >
          スタート！
        </button>
      </div>
    );
  }

  // --------- リザルト画面 ---------
  if (phase === "result") {
    const grade =
      score >= 40
        ? { label: "かんぺき！🏆", color: "text-yellow-500" }
        : score >= 25
        ? { label: "すごい！⭐", color: "text-indigo-600" }
        : score >= 10
        ? { label: "よくできた！😊", color: "text-emerald-600" }
        : score >= 0
        ? { label: "がんばった！👏", color: "text-orange-500" }
        : { label: "もう一度！💪", color: "text-red-500" };

    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-sky-200 to-indigo-200 px-6">
        <div className="bg-white rounded-3xl shadow-xl px-8 py-8 w-full max-w-xs text-center mb-8">
          <p className="text-2xl font-black text-slate-600 mb-1">けっか</p>
          <p className={`text-3xl font-black mt-2 mb-4 ${grade.color}`}>{grade.label}</p>

          <div className="bg-indigo-50 rounded-2xl py-5 px-4 mb-5">
            <p className="text-slate-500 text-sm font-bold mb-1">ごうけいポイント</p>
            <p className="text-6xl font-black text-indigo-700">{score}</p>
            <p className="text-slate-400 text-sm mt-1">ポイント</p>
          </div>

          <div className="flex gap-3 text-center">
            <div className="flex-1 bg-green-50 rounded-xl py-3">
              <p className="text-green-600 text-2xl font-black">{correctCount}</p>
              <p className="text-green-500 text-xs font-bold mt-0.5">せいかい</p>
            </div>
            <div className="flex-1 bg-red-50 rounded-xl py-3">
              <p className="text-red-500 text-2xl font-black">{wrongCount}</p>
              <p className="text-red-400 text-xs font-bold mt-0.5">まちがい</p>
            </div>
            <div className="flex-1 bg-slate-50 rounded-xl py-3">
              <p className="text-slate-600 text-2xl font-black">{correctCount + wrongCount}</p>
              <p className="text-slate-400 text-xs font-bold mt-0.5">もんだい</p>
            </div>
          </div>
        </div>

        <button
          onClick={startGame}
          className="w-full max-w-xs py-5 bg-indigo-600 text-white text-2xl font-black rounded-3xl shadow-xl active:scale-95 transition-transform mb-3"
        >
          もう一度！
        </button>
        <button
          onClick={() => setPhase("start")}
          className="w-full max-w-xs py-4 bg-white text-indigo-600 text-lg font-black rounded-3xl shadow active:scale-95 transition-transform"
        >
          タイトルへ
        </button>
      </div>
    );
  }

  // --------- ゲーム画面 ---------
  const bgFeedback =
    feedback === "correct"
      ? "bg-green-100"
      : feedback === "wrong"
      ? "bg-red-100"
      : "bg-gradient-to-b from-sky-100 to-indigo-100";

  return (
    <div className={`min-h-screen flex flex-col ${bgFeedback} transition-colors duration-200`}>
      {/* ステータスバー */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div className="bg-white rounded-2xl px-4 py-2 shadow text-center min-w-[90px]">
          <p className="text-xs text-slate-400 font-bold">ポイント</p>
          <p
            className={`text-2xl font-black leading-tight ${
              score >= 0 ? "text-indigo-700" : "text-red-500"
            }`}
          >
            {score >= 0 ? `+${score}` : score}
          </p>
        </div>

        <div className={`bg-white rounded-2xl px-4 py-2 shadow text-center min-w-[90px] ${timerColor}`}>
          <p className="text-xs text-slate-400 font-bold">のこり</p>
          <p className={`text-2xl font-black leading-tight ${timerColor}`}>{formatTime(timeLeft)}</p>
        </div>
      </div>

      {/* 問題エリア */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-xs">
          {/* フィードバック */}
          <div className="h-14 flex items-center justify-center mb-2">
            {feedback === "correct" && (
              <p className="text-4xl font-black text-green-600 animate-bounce">せいかい！ +1</p>
            )}
            {feedback === "wrong" && (
              <p className="text-4xl font-black text-red-500">ざんねん… -1</p>
            )}
          </div>

          {/* 問題 */}
          <div className="bg-white rounded-3xl shadow-lg py-8 px-6 text-center mb-5">
            <p className="text-5xl font-black text-slate-800 tracking-wider">
              {question.a} {question.op} {question.b} ＝
            </p>
          </div>

          {/* 入力表示 */}
          <div className="bg-white rounded-2xl shadow px-6 py-4 text-center mb-4 h-16 flex items-center justify-center">
            <p
              className={`text-4xl font-black ${
                input ? "text-indigo-700" : "text-slate-300"
              }`}
            >
              {input || "？"}
            </p>
          </div>
        </div>
      </div>

      {/* テンキー */}
      <div className="pb-6 px-4">
        <div className="max-w-xs mx-auto grid grid-cols-3 gap-3">
          {[
            "7", "8", "9",
            "4", "5", "6",
            "1", "2", "3",
            "-", "0", "DEL",
          ].map((key) => (
            <button
              key={key}
              onPointerDown={(e) => {
                e.preventDefault();
                handleTap(key);
              }}
              className={`
                py-5 rounded-2xl text-2xl font-black shadow
                active:scale-95 transition-transform select-none
                ${key === "DEL"
                  ? "bg-rose-100 text-rose-600"
                  : key === "-"
                  ? "bg-slate-100 text-slate-600"
                  : "bg-white text-slate-800"}
              `}
            >
              {key === "DEL" ? "⌫" : key}
            </button>
          ))}
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              handleTap("OK");
            }}
            disabled={!input || !!feedback}
            className="col-span-3 py-5 bg-indigo-600 text-white text-2xl font-black rounded-2xl shadow-lg active:scale-95 transition-transform disabled:opacity-40 select-none"
          >
            こたえる！
          </button>
        </div>
      </div>
    </div>
  );
}
