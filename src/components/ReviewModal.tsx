import React, { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { Sparkles, RefreshCw, Smile, AlertCircle } from "lucide-react";
import { speakWordOnly } from "../utils/tts";

interface ReviewModalProps {
  word: string;
  sentence: string;
  onComplete: () => void;
}

export default function ReviewModal({ word, sentence, onComplete }: ReviewModalProps) {
  const [userInput, setUserInput] = useState("");
  const [isMatch, setIsMatch] = useState(false);
  const [triedSubmit, setTriedSubmit] = useState(false);
  const [selectedVoiceName] = useState(() => {
    return localStorage.getItem("spelling_wizard_voice") || undefined;
  });
  const [speechRate] = useState(() => {
    const r = localStorage.getItem("spelling_wizard_rate");
    return r ? Math.max(0.4, parseFloat(r) - 0.1) : 0.65; // keep pronunciation slightly slower in review
  });
  const [speechPitch] = useState(() => {
    const p = localStorage.getItem("spelling_wizard_pitch");
    return p ? parseFloat(p) : 1.05;
  });

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus the input automatically
    if (inputRef.current) {
      inputRef.current.focus();
    }
    // Speak the correct spelling to aid reinforcement with the customized voice setup
    speakWordOnly(`The correct spelling is, ${word.split("").join(" ")} ... ${word}`, selectedVoiceName, speechRate, speechPitch);
  }, [word]);

  const handleInputChange = (val: string) => {
    setUserInput(val);
    if (val.trim().toLowerCase() === word.toLowerCase()) {
      setIsMatch(true);
    } else {
      setIsMatch(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    setTriedSubmit(true);
    if (userInput.trim().toLowerCase() === word.toLowerCase()) {
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 bg-[#4F4A45]/45 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full text-center border-4 border-natural-cream relative overflow-hidden shadow-xl"
      >
        <div className="absolute top-0 inset-x-0 h-2 bg-natural-terracotta"></div>

        <div className="mx-auto bg-natural-sand rounded-full w-16 h-16 flex items-center justify-center mb-4 text-natural-terracotta border border-natural-cream">
          <AlertCircle className="w-8 h-8 animate-pulse" />
        </div>

        <h3 className="text-2xl font-bold text-natural-title tracking-tight mb-2">
          Let's Practice and Learn!
        </h3>

        <p className="text-natural-text mb-6">
          Oops! Not quite. Spelled correctly, it is:
        </p>

        {/* Large stylized target word display */}
        <div className="bg-natural-sand border border-natural-cream rounded-2xl py-4 px-6 mb-6 inline-block font-mono tracking-widest text-3xl font-extrabold text-natural-title select-none">
          {word}
        </div>

        <p className="text-sm text-natural-warmgray italic mb-6">
          "{sentence}"
        </p>

        {/* Action instructions to type it out to learn */}
        <div className="bg-natural-light/60 rounded-2xl p-4 border border-natural-cream text-left mb-6">
          <label className="block text-xs font-bold text-natural-warmgray uppercase tracking-widest mb-2">
            Type it exactly as shown to proceed:
          </label>
          <div className="relative">
            <input
              id="review-spelling-input"
              ref={inputRef}
              type="text"
              className={`w-full px-4 py-3 rounded-xl border-2 font-mono text-xl text-center uppercase tracking-widest outline-none transition-all ${
                isMatch
                  ? "border-natural-sage bg-natural-light text-natural-title font-bold"
                  : "border-natural-cream bg-white focus:border-natural-sage focus:ring-4 focus:ring-natural-sand"
              }`}
              value={userInput}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="TYPE THE WORD HERE"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
            {isMatch && (
              <span className="absolute right-3 top-3 bg-natural-sage text-white rounded-full p-0.5">
                <Smile className="w-5 h-5" />
              </span>
            )}
          </div>
          {triedSubmit && !isMatch && (
            <p className="text-natural-terracotta text-xs mt-1 text-center font-medium">
              Keep trying! Make sure your spelling matches: <strong className="font-mono">{word}</strong>
            </p>
          )}
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            id="speak-again-btn"
            onClick={() => speakWordOnly(word, selectedVoiceName, Math.max(0.4, speechRate - 0.1), speechPitch)}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-2xl border-2 border-natural-cream text-natural-title bg-natural-sand hover:bg-natural-cream font-bold text-sm transition-all active:scale-95 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 text-natural-sage" />
            Listen Phonetically
          </button>
          
          <button
            id="continue-gameplay-btn"
            onClick={handleSubmit}
            disabled={!isMatch}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-bold text-base transition-all active:scale-95 cursor-pointer ${
              isMatch
                ? "bg-natural-sage hover:bg-opacity-95 text-white"
                : "bg-natural-light text-natural-khaki border border-natural-cream cursor-not-allowed"
            }`}
          >
            <Sparkles className="w-5 h-5" />
            Super! Let’s Go!
          </button>
        </div>
      </motion.div>
    </div>
  );
}
