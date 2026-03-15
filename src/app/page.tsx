"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties } from "react";

type Question = {
  id: number;
  question: string;
  options: string[];
  answer: string;
  explanation: string;
};

type ThemeKey = "red" | "blue" | "green";

const THEME_PALETTE: Record<
  ThemeKey,
  { page: string; panel: string; panelDark: string; card: string }
> = {
  red: {
    page: "#b3272f",
    panel: "#7a0f1f",
    panelDark: "#5a0814",
    card: "#a61026",
  },
  blue: {
    page: "#1f3f8f",
    panel: "#173170",
    panelDark: "#10224f",
    card: "#2563eb",
  },
  green: {
    page: "#1f6a3a",
    panel: "#1b5a34",
    panelDark: "#123b23",
    card: "#22c55e",
  },
};

const ANSWER_PALETTE = [
  { from: "#ef4444", to: "#b91c1c", text: "#fff7d4" },
  { from: "#2563eb", to: "#1e40af", text: "#eff6ff" },
  { from: "#22c55e", to: "#166534", text: "#ecfdf5" },
  { from: "#facc15", to: "#ca8a04", text: "#3f2b00" },
];

const QUESTION_CARD_CLASS =
  "h-60 w-40 rounded-xl border p-4 text-center text-[#fff7d4] shadow-[0_10px_24px_rgba(0,0,0,0.28)] transition-all duration-200 hover:-translate-y-1 sm:h-64 sm:w-44 md:h-72 md:w-48";

const OPTION_CARD_CLASS =
  "group relative flex min-h-52 w-full max-w-[26rem] items-center justify-center overflow-hidden rounded-xl border text-center text-[clamp(1.25rem,1.9vw,2.2rem)] font-semibold leading-snug shadow-[0_10px_24px_rgba(0,0,0,0.35)] transition-all duration-200";

const CORRECT_SOUND_URL = "/correct.mp3";
const WRONG_SOUND_URL = "/wrong.mp3";

const getThemeFromRotation = (rotation: number): ThemeKey => {
  const normalized = ((rotation % 360) + 360) % 360;
  // Conic gradients start at the top (0deg). The pointer is fixed at the top,
  // so we read the wheel angle under pointer by reversing wheel rotation.
  const pointerAngle = (360 - normalized) % 360;

  if (pointerAngle < 120) {
    return "red";
  }

  if (pointerAngle < 240) {
    return "blue";
  }

  return "green";
};

export default function Home() {
  const [hasStarted, setHasStarted] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [turnCount, setTurnCount] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [showQuestionBoard, setShowQuestionBoard] = useState(false);
  const [activeTheme, setActiveTheme] = useState<ThemeKey>("red");
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(
    null,
  );
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);

  const activePalette = THEME_PALETTE[activeTheme];
  const correctAudioRef = useRef<HTMLAudioElement | null>(null);
  const wrongAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    correctAudioRef.current = new Audio(CORRECT_SOUND_URL);
    wrongAudioRef.current = new Audio(WRONG_SOUND_URL);
    correctAudioRef.current.preload = "auto";
    wrongAudioRef.current.preload = "auto";
    correctAudioRef.current.volume = 0.7;
    wrongAudioRef.current.volume = 0.7;
  }, []);

  useEffect(() => {
    const savedTurnCount = window.localStorage.getItem("quiz_turn_count");
    if (!savedTurnCount) {
      return;
    }

    const parsedTurnCount = Number(savedTurnCount);
    if (Number.isFinite(parsedTurnCount) && parsedTurnCount >= 0) {
      setTurnCount(parsedTurnCount);
    }
  }, []);

  useEffect(() => {
    const loadQuestions = async () => {
      const response = await fetch("/question.json");
      const data = (await response.json()) as Question[];
      setQuestions(data);
    };

    void loadQuestions();
  }, []);

  const spinWheel = () => {
    if (
      questions.length === 0 ||
      isSpinning ||
      playerName.trim().length === 0
    ) {
      return;
    }

    setIsSpinning(true);
    const nextTurnCount = turnCount + 1;
    setTurnCount(nextTurnCount);
    window.localStorage.setItem("quiz_turn_count", String(nextTurnCount));

    const historyRaw = window.localStorage.getItem("quiz_turn_history");
    const history = historyRaw
      ? (JSON.parse(historyRaw) as Array<{ name: string; playedAt: string }>)
      : [];
    history.push({
      name: playerName.trim(),
      playedAt: new Date().toISOString(),
    });
    window.localStorage.setItem("quiz_turn_history", JSON.stringify(history));

    const extraTurns = 5 + Math.floor(Math.random() * 4);
    const randomStop = Math.floor(Math.random() * 360);
    const spinDelta = extraTurns * 360 + randomStop;

    setWheelRotation((prev) => {
      const nextRotation = prev + spinDelta;
      setActiveTheme(getThemeFromRotation(nextRotation));
      return nextRotation;
    });

    setTimeout(() => {
      setIsSpinning(false);
      setShowQuestionBoard(true);
    }, 4200);
  };

  const openQuestionCard = (question: Question) => {
    setSelectedQuestion(question);
    setSelectedOption(null);
    setIsAnswered(false);
  };

  const chooseOption = (option: string) => {
    if (!selectedQuestion || isAnswered) {
      return;
    }

    setSelectedOption(option);
    setIsAnswered(true);

    const isCorrect = option === selectedQuestion.answer;
    const audio = isCorrect ? correctAudioRef.current : wrongAudioRef.current;
    if (audio) {
      audio.currentTime = 0;
      void audio.play().catch((error) => {
        console.error("Khong the phat am thanh:", error);
      });
    }
  };

  const backToQuestionBoard = () => {
    setSelectedQuestion(null);
    setSelectedOption(null);
    setIsAnswered(false);
    setShowQuestionBoard(false);
    setPlayerName("");
  };

  const resetPlayerStats = () => {
    const shouldReset = window.confirm(
      "Bạn có chắc chắn muốn reset lượt chơi? Dữ liệu lượt tham gia sẽ bị xóa.",
    );

    if (!shouldReset) {
      return;
    }

    window.localStorage.removeItem("quiz_turn_count");
    window.localStorage.removeItem("quiz_turn_history");
    setTurnCount(0);
  };

  const questionCards = questions.slice(0, 7);
  const questionCardRows = [
    questionCards.slice(0, 4),
    questionCards.slice(4, 7),
  ];
  const isCurrentAnswerCorrect = Boolean(
    selectedQuestion &&
    selectedOption &&
    selectedOption === selectedQuestion.answer,
  );

  const questionCardStyle: CSSProperties = {
    background: `linear-gradient(180deg, ${activePalette.card}, ${activePalette.panel})`,
    borderColor: "#f7dd5f",
  };

  const getOptionStyle = (option: string, index: number): CSSProperties => {
    const palette = ANSWER_PALETTE[index % ANSWER_PALETTE.length];
    const isCorrect = option === selectedQuestion?.answer;
    const isPicked = option === selectedOption;

    if (isAnswered && isCorrect) {
      return {
        background: "linear-gradient(180deg, #22c55e, #166534)",
        borderColor: "#f7dd5f",
        color: "#ecfdf5",
        opacity: 1,
      };
    }

    if (isAnswered && isPicked) {
      return {
        background: "linear-gradient(180deg, #ef4444, #b91c1c)",
        borderColor: "#f7dd5f",
        color: "#fff7d4",
        opacity: 1,
      };
    }

    return {
      background: `linear-gradient(180deg, ${palette.from}, ${palette.to})`,
      borderColor: "#f7dd5f",
      color: palette.text,
      opacity: isAnswered ? 0.45 : 1,
    };
  };

  return (
    <main
      className={
        hasStarted
          ? "min-h-screen bg-[#b3272f] px-3 py-4 sm:px-6 sm:py-6"
          : "min-h-screen"
      }
    >
      {!hasStarted ? (
        <section className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden text-center">
          <div className="pointer-events-none absolute inset-0 grid grid-cols-2 grid-rows-2">
            <div className="relative">
              <Image
                src="/i2.png"
                alt="Nen goc tren trai"
                fill
                priority
                unoptimized
                className="object-cover"
              />
            </div>
            <div className="relative">
              <Image
                src="/i2.png"
                alt="Nen goc tren phai"
                fill
                priority
                unoptimized
                className="scale-x-[-1] object-cover"
              />
            </div>
            <div className="relative">
              <Image
                src="/i2.png"
                alt="Nen goc duoi trai"
                fill
                priority
                unoptimized
                className="scale-y-[-1] object-cover"
              />
            </div>
            <div className="relative">
              <Image
                src="/i2.png"
                alt="Nen goc duoi phai"
                fill
                priority
                unoptimized
                className="scale-[-1] object-cover"
              />
            </div>
          </div>

          <div className="relative z-10 rounded-xl border-2 border-yellow-400 bg-[#b3272f] px-6 py-8 sm:px-10">
            <div className="flex flex-col items-center gap-8 px-4">
              <h1 className="text-[clamp(1.8rem,4.5vw,3.6rem)] font-black uppercase tracking-wide text-[#f7dd5f]">
                Tư tưởng ngoại giao Hồ Chí Minh
              </h1>

              <p className="rounded-md border border-yellow-300/70 bg-black/25 px-4 py-2 text-sm font-semibold text-[#fff1b5] sm:text-base">
                Tổng lượt tham gia : {turnCount}
              </p>

              <div className="space-x-2">
                <button
                  type="button"
                  onClick={() => setHasStarted(true)}
                  className="rounded-lg border-2 border-yellow-400 bg-yellow-400 px-8 py-3 text-lg font-bold text-[#7f1d1d] transition-colors duration-200 hover:bg-[#ffe98e]"
                >
                  Bắt đầu
                </button>

                <button
                  type="button"
                  onClick={resetPlayerStats}
                  className="rounded-lg border-2 border-blue-400 bg-blue-400 px-8 py-3 text-lg font-bold text-white transition-colors duration-200 hover:bg-blue-300"
                >
                  Reset lượt chơi
                </button>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="relative mx-auto min-h-[92vh] w-full overflow-hidden px-4 py-8 sm:px-8 md:px-10 md:py-10 bg-[#b3272f]">
          {selectedQuestion ? (
            <>
              <div className="pointer-events-none absolute inset-0 opacity-25 [background:radial-gradient(circle_at_18%_18%,rgba(255,230,153,0.16),transparent_32%),radial-gradient(circle_at_85%_10%,rgba(122,15,31,0.35),transparent_35%),radial-gradient(circle_at_72%_80%,rgba(90,8,20,0.3),transparent_40%)]" />
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(247,221,95,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(247,221,95,0.12)_1px,transparent_1px)] bg-size-[180px_180px] opacity-10" />
            </>
          ) : null}

          {!selectedQuestion ? (
            <h1 className="text-center text-[clamp(1.35rem,2.6vw,2.85rem)] font-black uppercase tracking-wide text-[#f7dd5f]">
              GIẢI MÃ NỀN TẢNG TƯ TƯỞNG HỒ CHÍ MINH
            </h1>
          ) : null}

          {!showQuestionBoard ? (
            <div className="mx-auto mt-10 flex w-full max-w-3xl flex-col items-center gap-6 rounded-xl border border-[#f7dd5f]/70 bg-black/15 p-6 text-center sm:mt-16 sm:p-8">
              <div className="w-full max-w-md text-left">
                <label
                  htmlFor="playerName"
                  className="mb-2 block text-sm font-bold uppercase tracking-wide text-[#f7dd5f]"
                >
                  Nhập tên người chơi
                </label>
                <input
                  id="playerName"
                  type="text"
                  value={playerName}
                  onChange={(event) => setPlayerName(event.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn A"
                  className="w-full rounded-lg border border-[#f7dd5f] bg-[#5a0814]/60 px-4 py-3 text-base text-[#fff7d4] outline-none placeholder:text-[#ffe7a3]/80 focus:ring-2 focus:ring-[#f7dd5f]/70"
                />
              </div>
              <p className=" mb-2 rounded-md border border-yellow-300/70 bg-black/25 px-4 py-2 text-sm font-semibold text-[#fff1b5] sm:text-base">
                Tổng lượt tham gia: {turnCount}
              </p>

              <div className="relative h-72 w-72 sm:h-80 sm:w-80">
                <div className="absolute left-1/2 top-[-7%] z-20 h-0 w-0 -translate-x-1/2 border-l-14 border-r-14 border-t-24 border-l-transparent border-r-transparent border-t-[#f7dd5f]" />

                <div
                  className="relative h-full w-full rounded-full border-8 border-[#f7dd5f] shadow-[0_10px_24px_rgba(0,0,0,0.35)]"
                  style={{
                    transform: `rotate(${wheelRotation}deg)`,
                    transition: isSpinning
                      ? "transform 4.2s cubic-bezier(0.2, 0.85, 0.2, 1)"
                      : "none",
                    background:
                      "conic-gradient(#ef4444 0deg 120deg, #2563eb 120deg 240deg, #22c55e 240deg 360deg)",
                  }}
                >
                  <div className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#7f1d1d] bg-black" />
                </div>
              </div>

              <button
                type="button"
                onClick={spinWheel}
                disabled={
                  isSpinning ||
                  questions.length === 0 ||
                  playerName.trim().length === 0
                }
                className="rounded-lg border-2 border-[#f7dd5f] bg-[#f7dd5f] px-8 py-3 text-lg font-bold text-[#7f1d1d] transition-colors duration-200 hover:bg-[#ffe98e] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSpinning ? "Đang quay..." : "Quay"}
              </button>
            </div>
          ) : !selectedQuestion ? (
            <div className="mx-auto flex min-h-[76vh] w-full max-w-6xl flex-col justify-center text-[#fff1b5]">
              <div className="mx-auto mb-4 inline-flex max-w-fit items-center rounded-full border border-[#f7dd5f]/80 bg-linear-to-r from-[#5a0814]/85 to-[#7a0f1f]/85 px-6 py-2 text-base font-semibold text-[#fff3bf] shadow-[0_8px_20px_rgba(0,0,0,0.28)] sm:text-lg">
                Mời{" "}
                <span className="mx-1 font-black text-[#f7dd5f]">
                  {playerName || "Người chơi"}
                </span>{" "}
                chọn một câu hỏi
              </div>
              {questionCardRows.map((row, rowIndex) => (
                <div
                  key={`row-${rowIndex}`}
                  className={`${rowIndex === 0 ? "mt-6" : "mt-5"} flex flex-wrap items-center justify-center gap-10 lg:flex-nowrap`}
                >
                  {row.map((question) => (
                    <button
                      key={question.id}
                      type="button"
                      onClick={() => openQuestionCard(question)}
                      className={QUESTION_CARD_CLASS}
                      style={questionCardStyle}
                    >
                      <div className="flex h-full flex-col items-center justify-center rounded-lg border border-white/20">
                        <p className="text-[1.1rem] font-black uppercase tracking-wider">
                          Câu {question.id}
                        </p>
                        <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-white/75">
                          Nhấn để mở
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col z-10">
              <div
                className="mx-auto mt-3 w-full max-w-5xl rounded-xl border px-5 py-6 text-center text-[#fff7d4] shadow-[0_12px_28px_rgba(0,0,0,0.45)] sm:px-8"
                style={{ backgroundColor: `#7a0f1fe8`, borderColor: "#f7dd5f" }}
              >
                <span
                  className="inline-flex rounded-full border px-3 py-1 text-sm font-bold"
                  style={{
                    backgroundColor: `#5a081459`,
                    borderColor: "#f7dd5f",
                    color: "#f7dd5f",
                  }}
                >
                  Câu hỏi
                </span>
                <h2 className="mt-3 text-[clamp(1.4rem,2.8vw,2.1rem)] font-semibold leading-relaxed">
                  {selectedQuestion.question}
                </h2>
              </div>

              <div className="mx-auto justify-center flex w-full flex-wrap items-center gap-5 mt-20">
                {selectedQuestion.options.map((option, index) => (
                  <button
                    key={option}
                    type="button"
                    disabled={isAnswered}
                    onClick={() => chooseOption(option)}
                    className={OPTION_CARD_CLASS}
                    style={getOptionStyle(option, index)}
                  >
                    <span
                      className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-md border text-base font-semibold"
                      style={{
                        borderColor: "#f7dd5f99",
                        backgroundColor: "#5a081459",
                        color: "#f7dd5f",
                      }}
                    >
                      {index + 1}
                    </span>
                    <span className="px-6">{option}</span>
                  </button>
                ))}
              </div>

              {isAnswered ? (
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 px-4">
                  <div className="w-full max-w-2xl rounded-2xl border border-[#f7dd5f]/70 bg-[#6f0f1dd9] p-6 text-white shadow-[0_14px_36px_rgba(0,0,0,0.45)] sm:p-8">
                    <h3
                      className={`${isCurrentAnswerCorrect ? "text-emerald-400" : "text-red-400"} text-xl font-bold sm:text-2xl text-center`}
                    >
                      {isCurrentAnswerCorrect
                        ? "🎉🎉Bạn đã trả lời chính xác câu hỏi này🎉🎉"
                        : "❌❌Bạn chưa chọn đúng đáp án ở lượt này❌❌"}
                    </h3>

                    <p className="mt-4 text-base font-semibold text-yellow-200">
                      Đáp án đúng:{" "}
                      <span className="text-white">
                        {selectedQuestion.answer}
                      </span>
                    </p>

                    <p className="mt-3 leading-relaxed text-zinc-100">
                      {selectedQuestion.explanation}
                    </p>

                    <div className="mt-7 flex justify-end">
                      <button
                        type="button"
                        onClick={backToQuestionBoard}
                        className="rounded-md border border-yellow-300 bg-yellow-300 px-5 py-2 font-bold text-[#4a002f] transition-colors duration-200 hover:bg-yellow-200"
                      >
                        Quay lại danh sách
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </section>
      )}
    </main>
  );
}
