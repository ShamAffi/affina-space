import { useState } from 'react';
import type { Question as QuestionType } from '../types';

interface Props {
  question: QuestionType;
  questionNumber: number;
  totalQuestions: number;
  initialValue: string;
  onNext: (value: string) => void;
}

export default function Question({
  question,
  questionNumber,
  totalQuestions,
  initialValue,
  onNext,
}: Props) {
  const [value, setValue] = useState(initialValue);

  const canAdvance =
    question.type === 'text' ? value.trim().length > 0 : value.length > 0;

  function handleSubmit() {
    if (!canAdvance) return;
    onNext(value);
    setValue('');
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="flex items-center px-6 py-5 border-b border-gray-100">
        <span className="text-purple-700 font-bold text-xl tracking-tight">
          Affina<span className="text-gray-900">Space</span>
        </span>
      </header>

      {/* Progress */}
      <div className="w-full bg-gray-100 h-1">
        <div
          className="bg-purple-600 h-1 transition-all duration-500"
          style={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
        />
      </div>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-xl animate-slide-up">
          {/* Step label */}
          <p className="text-sm font-medium text-purple-500 mb-4">
            Question {questionNumber} of {totalQuestions}
          </p>

          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8 leading-snug">
            {question.label}
          </h2>

          {question.type === 'text' && (
            <textarea
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none px-5 py-4 text-base text-gray-800 placeholder-gray-400 resize-none transition min-h-[140px]"
              placeholder="Type your answer here…"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.metaKey) handleSubmit();
              }}
              autoFocus
            />
          )}

          {question.type === 'choice' && (
            <div className="flex flex-col gap-3">
              {question.options?.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setValue(opt)}
                  className={`w-full text-left px-5 py-4 rounded-2xl border-2 text-base font-medium transition-all duration-150 ${
                    value === opt
                      ? 'border-purple-600 bg-purple-50 text-purple-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-purple-300 hover:bg-purple-50'
                  }`}
                >
                  <span
                    className={`inline-flex items-center justify-center w-5 h-5 rounded-full border-2 mr-3 flex-shrink-0 align-middle transition-all ${
                      value === opt
                        ? 'border-purple-600 bg-purple-600'
                        : 'border-gray-300'
                    }`}
                  >
                    {value === opt && (
                      <span className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </span>
                  {opt}
                </button>
              ))}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={!canAdvance}
            className="mt-8 w-full sm:w-auto bg-purple-600 hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 text-white text-base font-semibold px-10 py-4 rounded-2xl transition-all duration-150"
          >
            Next →
          </button>

          {question.type === 'text' && (
            <p className="mt-3 text-xs text-gray-400">
              Press <kbd className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">⌘ Enter</kbd> to continue
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
