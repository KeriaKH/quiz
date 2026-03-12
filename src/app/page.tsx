"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type Question = {
  id: number;
  question: string;
  options: string[];
  answer: string;
  explanation: string;
};

export default function Home() {
  const photos = [1, 2, 3];
  const [hasStarted, setHasStarted] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  useEffect(() => {
    const loadQuestions = async () => {
      const response = await fetch("/question.json");
      const data = (await response.json()) as Question[];
      setQuestions(data);
    };

    void loadQuestions();
  }, []);

  const openRandomQuestion = () => {
    if (questions.length === 0) {
      return;
    }

    const randomIndex = Math.floor(Math.random() * questions.length);
    setSelectedQuestion(questions[randomIndex]);
    setSelectedOption(null);
    setIsAnswered(false);
  };

  const chooseOption = (option: string) => {
    if (!selectedQuestion || isAnswered) {
      return;
    }

    setSelectedOption(option);
    setIsAnswered(true);
  };

  const backToHome = () => {
    setSelectedQuestion(null);
    setSelectedOption(null);
    setIsAnswered(false);
  };

  const getOptionClassName = (option: string) => {
    const baseClass =
      "w-full rounded-md border px-4 py-3 text-left font-semibold transition-colors duration-200";

    if (!selectedQuestion || !isAnswered) {
      return `${baseClass} border-[#f7dd5f] bg-black/15 text-[#fff1b5] hover:bg-black/30`;
    }

    if (option === selectedQuestion.answer) {
      return `${baseClass} border-emerald-300 bg-emerald-600/35 text-emerald-100`;
    }

    if (option === selectedOption) {
      return `${baseClass} border-rose-300 bg-rose-700/35 text-rose-100`;
    }

    return `${baseClass} border-[#f7dd5f]/50 bg-black/10 text-[#f4e4aa]/70`;
  };

  return (
    <main className={hasStarted ? "min-h-screen bg-[#b3272f] px-3 py-4 sm:px-6 sm:py-6" : "min-h-screen"}>
      {!hasStarted ? (
        <section className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden text-center">
          <div className="pointer-events-none absolute inset-0 grid grid-cols-2 grid-rows-2">
            <div className="relative">
              <Image src="/i2.png" alt="Nen goc tren trai" fill priority unoptimized className="object-cover" />
            </div>
            <div className="relative">
              <Image src="/i2.png" alt="Nen goc tren phai" fill priority unoptimized className="scale-x-[-1] object-cover" />
            </div>
            <div className="relative">
              <Image src="/i2.png" alt="Nen goc duoi trai" fill priority unoptimized className="scale-y-[-1] object-cover" />
            </div>
            <div className="relative">
              <Image src="/i2.png" alt="Nen goc duoi phai" fill priority unoptimized className="scale-[-1] object-cover" />
            </div>
          </div>

          <div className="relative z-10 rounded-xl border-2 border-yellow-400 bg-[#b3272f] px-6 py-8 sm:px-10">
            <div className="flex flex-col items-center gap-8 px-4">
              <h1 className="text-[clamp(1.8rem,4.5vw,3.6rem)] font-black uppercase tracking-wide text-[#f7dd5f]">
                Tư tưởng ngoại giao Hồ Chí Minh
              </h1>

              <button
                type="button"
                onClick={() => setHasStarted(true)}
                className="rounded-lg border-2 border-yellow-400 bg-yellow-400 px-8 py-3 text-lg font-bold text-[#7f1d1d] transition-colors duration-200 hover:bg-[#ffe98e]"
              >
                Bắt đầu
              </button>
            </div>
          </div>
        </section>
      ) : (
      <section className="mx-auto min-h-[92vh] w-full bg-[#b3272f] px-4 py-8 sm:px-8 md:px-10 md:py-10">
        <h1 className="text-center text-[clamp(1.35rem,2.6vw,2.85rem)] font-black uppercase tracking-wide text-[#f7dd5f]">
          GIẢI MÃ NỀN TẢNG TƯ TƯỞNG HỒ CHÍ MINH
        </h1>

        {!selectedQuestion ? (
          <ul className="mx-auto mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:mt-20 lg:grid-cols-3 lg:gap-10">
            {photos.map((photoNumber) => (
              <li key={photoNumber} className="group text-center">
                <p className="mb-2 inline-flex rounded-full border border-[#f7dd5f] bg-black/15 px-4 py-1 text-sm font-bold tracking-wide text-[#f7dd5f] transition-transform duration-300 group-hover:scale-105">
                  Câu {photoNumber}
                </p>

                <button
                  type="button"
                  onClick={openRandomQuestion}
                  className="w-full cursor-pointer overflow-hidden rounded-md bg-black/20 shadow-[0_8px_20px_rgba(0,0,0,0.35)] transition-all duration-300 group-hover:border-[#f7dd5f] group-hover:shadow-[0_14px_32px_rgba(0,0,0,0.48)]"
                >
                  <Image
                    src="/i1.png"
                    alt={`Hình ${photoNumber}`}
                    width={720}
                    height={800}
                    priority={photoNumber === 1}
                    className="h-[380px] w-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.03] sm:h-[450px] lg:h-[420px]"
                  />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mx-auto mt-10 w-full max-w-3xl rounded-xl border border-[#f7dd5f]/80 bg-black/20 p-5 text-[#fff1b5] shadow-[0_8px_24px_rgba(0,0,0,0.35)] sm:p-7">
            <p className="text-sm font-bold uppercase tracking-wide text-[#f7dd5f]">Câu hỏi ngẫu nhiên</p>
            <h2 className="mt-2 text-xl font-bold leading-relaxed">{selectedQuestion.question}</h2>

            <div className="mt-6 space-y-3">
              {selectedQuestion.options.map((option) => (
                <button
                  key={option}
                  type="button"
                  disabled={isAnswered}
                  onClick={() => chooseOption(option)}
                  className={getOptionClassName(option)}
                >
                  {option}
                </button>
              ))}
            </div>

            {isAnswered ? (
              <div className="mt-6 rounded-lg border border-[#f7dd5f]/60 bg-black/20 p-4">
                <p className="text-base font-bold text-[#f7dd5f]">
                  Đáp án đúng: <span className="text-emerald-200">{selectedQuestion.answer}</span>
                </p>
                <p className="mt-3 leading-relaxed text-[#fff4c8]">{selectedQuestion.explanation}</p>

                <button
                  type="button"
                  onClick={backToHome}
                  className="mt-6 rounded-md border border-[#f7dd5f] bg-[#f7dd5f] px-5 py-2 font-bold text-[#7f1d1d] transition-colors duration-200 hover:bg-[#ffe98e]"
                >
                  Về trang chủ
                </button>
              </div>
            ) : null}
          </div>
        )}
      </section>
      )}
    </main>
  );
}
