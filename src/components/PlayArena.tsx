import React, { useState, useEffect, useRef } from "react";
import { WordList, Word, ScoreEntry } from "../types";
import { speakWordAndSentence, speakWordOnly, getEnglishVoices, playSuccessDing } from "../utils/tts";
import Confetti from "./Confetti";
import ReviewModal from "./ReviewModal";
import { Volume2, VolumeX, Sparkles, Star, Award, CheckCircle2, RotateCcw, HelpCircle, Trophy } from "lucide-react";

interface PlayArenaProps {
  list: WordList;
  onBack: () => void;
  onScoreSaved: () => Promise<void>;
}

export default function PlayArena({ list, onBack, onScoreSaved }: PlayArenaProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState("");
  const [score, setScore] = useState(0);
  const [stars, setStars] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [feedback, setFeedback] = useState<"idle" | "correct" | "review">("idle");
  const [showConfetti, setShowConfetti] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);

  // Custom high precision Voice Settings States
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>(() => {
    return localStorage.getItem("spelling_wizard_voice") || "";
  });
  const [speechRate, setSpeechRate] = useState<number>(() => {
    const r = localStorage.getItem("spelling_wizard_rate");
    return r ? parseFloat(r) : 0.8;
  });
  const [speechPitch, setSpeechPitch] = useState<number>(() => {
    const p = localStorage.getItem("spelling_wizard_pitch");
    return p ? parseFloat(p) : 1.05;
  });
  const [showSettings, setShowSettings] = useState(false);

  // Review state variables (in case they spelling incorrectly)
  const [misspelledWord, setMisspelledWord] = useState<Word | null>(null);

  // Completion states
  const [isCompleted, setIsCompleted] = useState(false);
  const [childName, setChildName] = useState("");
  const [isSavingScore, setIsSavingScore] = useState(false);
  const [scoreSaved, setScoreSaved] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // Randomized session words
  const [arenaWords, setArenaWords] = useState<Word[]>([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [sessionSize, setSessionSize] = useState<number>(10);

  // Access active word
  const activeWordItem: Word | undefined = arenaWords[currentIndex];

  const startSession = (size: number) => {
    // Shuffle the list.words
    const shuffled = [...list.words].sort(() => Math.random() - 0.5);
    const selected = size === -1 ? shuffled : shuffled.slice(0, size);
    setArenaWords(selected);
    setSessionSize(selected.length);
    setCurrentIndex(0);
    setUserInput("");
    setScore(0);
    setStars(0);
    setCurrentStreak(0);
    setMaxStreak(0);
    setFeedback("idle");
    setIsCompleted(false);
    setScoreSaved(false);
    setChildName("");
    setGameStarted(true);
  };

  useEffect(() => {
    // Automatically speak the word when it loads
    if (gameStarted && activeWordItem && !isCompleted && feedback === "idle") {
      if (audioEnabled) {
        speakWordAndSentence(
          activeWordItem.word,
          activeWordItem.sentence,
          selectedVoiceName,
          speechRate,
          speechPitch
        );
      }
      // Re-focus input
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 350);
    }
  }, [currentIndex, isCompleted, feedback, activeWordItem, audioEnabled, gameStarted]);

  // Handle browser speech synthesis voice loading lag & registration
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const loadVoices = () => {
        const engVoices = getEnglishVoices();
        setVoices(engVoices);
        
        // If no custom voice is saved, auto-default to the #1 premium voice!
        const saved = localStorage.getItem("spelling_wizard_voice");
        if (!saved && engVoices.length > 0) {
          setSelectedVoiceName(engVoices[0].name);
        }
      };

      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
      
      return () => {
        if (window.speechSynthesis) {
          window.speechSynthesis.onvoiceschanged = null;
        }
      };
    }
  }, []);

  const handleSpeak = () => {
    if (activeWordItem) {
      speakWordAndSentence(
        activeWordItem.word,
        activeWordItem.sentence,
        selectedVoiceName,
        speechRate,
        speechPitch
      );
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  const handleVoiceChange = (name: string) => {
    setSelectedVoiceName(name);
    localStorage.setItem("spelling_wizard_voice", name);
    // Play a preview
    if (audioEnabled) {
      speakWordOnly("Hello spelling champion!", name, speechRate, speechPitch);
    }
  };

  const handleRateChange = (rateStr: string) => {
    const r = parseFloat(rateStr);
    setSpeechRate(r);
    localStorage.setItem("spelling_wizard_rate", rateStr);
    if (audioEnabled && activeWordItem) {
      speakWordOnly(activeWordItem.word, selectedVoiceName, r, speechPitch);
    }
  };

  const handlePitchChange = (pitchStr: string) => {
    const p = parseFloat(pitchStr);
    setSpeechPitch(p);
    localStorage.setItem("spelling_wizard_pitch", pitchStr);
    if (audioEnabled && activeWordItem) {
      speakWordOnly(activeWordItem.word, selectedVoiceName, speechRate, p);
    }
  };

  const calculateBadge = (finalStars: number, streak: number): string => {
    if (streak >= 10) return "Master Speller 🌟";
    if (streak >= 7) return "Spelling Star 🏅";
    if (streak >= 5) return "Word Wizard 🪄";
    if (streak >= 3) return "Spelling Scout 🐝";
    if (finalStars >= 1) return "Rising Star ⭐";
    return "Enthusiastic Learner ✨";
  };

  const handleNextWord = () => {
    setFeedback("idle");
    setUserInput("");
    
    if (currentIndex + 1 < arenaWords.length) {
       setCurrentIndex(currentIndex + 1);
    } else {
       setIsCompleted(true);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeWordItem || feedback !== "idle") return;

    const guess = userInput.trim().toLowerCase();
    const correctTarget = activeWordItem.word.toLowerCase();

    if (guess === correctTarget) {
      // 1. Correct spelling Celebration!
      setFeedback("correct");
      setShowConfetti(true);
      
      const newStreak = currentStreak + 1;
      setCurrentStreak(newStreak);
      if (newStreak > maxStreak) {
        setMaxStreak(newStreak);
      }

      setScore((prev) => prev + 10);
      setStars((prev) => prev + 1);

      // Play a positive synthesized "ding/chime" sound
      if (audioEnabled) {
        playSuccessDing();
      }

      // Hide confetti after a bit and proceed
      setTimeout(() => {
        setShowConfetti(false);
        handleNextWord();
      }, 1500);

    } else {
      // 2. Misspelled, trigger constructive parent review modal!
      setCurrentStreak(0); // Reset streak of perfect spellings
      setMisspelledWord({ ...activeWordItem });
      setFeedback("review");
    }
  };

  const handleReviewComplete = () => {
    // They typed the spelling correctly, let them move to the next word with confidence
    setFeedback("idle");
    setMisspelledWord(null);
    setUserInput("");
    // Give half-score (+5 points, +1 star) so they are still rewarded for their correction work!
    setScore((prev) => prev + 5);
    setStars((prev) => prev + 1);

    handleNextWord();
  };

  const handleSaveScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!childName.trim() || isSavingScore) return;

    setIsSavingScore(true);
    const dateStr = new Date().toISOString();
    const badgeUnlocks = calculateBadge(stars, maxStreak);

    const scorePayload: ScoreEntry = {
      name: childName.trim(),
      score: score,
      stars: stars,
      date: dateStr,
      badge: badgeUnlocks,
      listName: list.name,
    };

    try {
      const res = await fetch("/api/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scorePayload),
      });

      if (res.ok) {
        setScoreSaved(true);
        await onScoreSaved();
      } else {
        alert("Failed to submit score record.");
      }
    } catch (err) {
      console.error(err);
      alert("Error submitting score.");
    } finally {
      setIsSavingScore(false);
    }
  };

  // Re-focus the input box
  const refocusInput = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 relative">
      {/* Confetti Celebration */}
      {showConfetti && <Confetti />}

      {/* Constructive Review Modal */}
      {feedback === "review" && misspelledWord && (
        <ReviewModal
          word={misspelledWord.word}
          sentence={misspelledWord.sentence}
          onComplete={handleReviewComplete}
        />
      )}

      {/* Main Container Card */}
      {!gameStarted ? (
        <div className="bg-white rounded-[32px] p-6 sm:p-10 shadow-sm border-4 border-natural-cream text-center relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-2 bg-natural-sage"></div>
          
          <div className="mx-auto my-4 w-20 h-20 bg-natural-sand border-2 border-natural-cream rounded-full flex items-center justify-center text-3xl animate-bounce">
            🐝
          </div>

          <h2 className="text-3xl font-black text-natural-title tracking-tight mb-2">
            Spelling Bee Arena!
          </h2>
          <p className="text-natural-warmgray text-sm max-w-md mx-auto mb-6">
            You chose <span className="font-bold text-natural-title text-base">{list.name}</span>. We have <span className="font-bold text-natural-title">{list.words.length} words</span> waiting in this list!
          </p>

          <div className="bg-natural-sand border border-natural-cream rounded-2xl p-5 text-left mb-6 space-y-4">
            <label className="block text-xs font-extrabold text-natural-title uppercase tracking-wider">
              🎮 Choose Practice Session Length
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {list.words.length > 5 && (
                <button
                  id="btn-session-10"
                  type="button"
                  onClick={() => startSession(Math.min(10, list.words.length))}
                  className="p-3 bg-white hover:bg-natural-cream border-2 border-natural-cream rounded-xl text-center font-bold text-xs text-natural-title cursor-pointer active:scale-95 transition-all text-left flex flex-col justify-between h-20 shadow-sm"
                >
                  <span className="text-sm font-black text-natural-sage text-left w-full">Quick Run 🍃</span>
                  <span className="text-[10px] text-natural-warmgray text-left w-full">{Math.min(10, list.words.length)} Random Words</span>
                </button>
              )}
              {list.words.length > 15 && (
                <button
                  id="btn-session-25"
                  type="button"
                  onClick={() => startSession(Math.min(25, list.words.length))}
                  className="p-3 bg-white hover:bg-natural-cream border-2 border-natural-cream rounded-xl text-center font-bold text-xs text-natural-title cursor-pointer active:scale-95 transition-all text-left flex flex-col justify-between h-20 shadow-sm"
                >
                  <span className="text-sm font-black text-natural-terracotta text-left w-full">Marathon 🦖</span>
                  <span className="text-[10px] text-natural-warmgray text-left w-full">{Math.min(25, list.words.length)} Random Words</span>
                </button>
              )}
              <button
                id="btn-session-all"
                type="button"
                onClick={() => startSession(-1)}
                className="p-3 bg-white hover:bg-natural-cream border-2 border-natural-cream rounded-xl text-center font-bold text-xs text-natural-title cursor-pointer active:scale-95 transition-all text-left flex flex-col justify-between h-20 shadow-sm"
              >
                <span className="text-sm font-black text-natural-khaki text-left w-full font-sans">Full Book 🪄</span>
                <span className="text-[10px] text-natural-warmgray text-left w-full">{list.words.length} Shuffled Words</span>
              </button>
            </div>
            
            <p className="text-[11px] text-natural-warmgray leading-relaxed text-center pt-2">
              For every practice session, spelling words are randomized so you always get a fresh challenge!
            </p>
          </div>

          <div className="flex gap-3">
            <button
              id="back-list-btn"
              onClick={onBack}
              className="flex-1 py-3 bg-natural-light hover:bg-[#EAE2D6] text-natural-text font-extrabold rounded-xl active:scale-95 transition-all text-sm cursor-pointer border border-natural-border"
            >
              Go Back
            </button>
          </div>
        </div>
      ) : !isCompleted ? (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border-4 border-natural-cream relative overflow-hidden text-center">
          
          {/* Header Progress and Stats Bar */}
          <div className="flex items-center justify-between gap-2 border-b border-natural-cream pb-4 mb-6">
            <button
              id="abort-play-btn"
              onClick={onBack}
              className="text-xs font-bold text-natural-khaki hover:text-natural-title cursor-pointer bg-natural-light border border-natural-cream py-1.5 px-3 rounded-xl transition-all"
            >
              ← Give up
            </button>

            {/* Stars Count Indicator */}
            <div className="flex items-center gap-1.5 font-extrabold text-natural-terracotta bg-natural-sand border border-natural-cream px-3.5 py-1.5 rounded-2xl">
              <Star className="w-5 h-5 fill-current animate-bounce" />
              <span>{stars} Stars</span>
            </div>

            {/* Streak count indicator */}
            <div className="flex items-center gap-1.5 font-extrabold text-natural-sage bg-natural-light border border-natural-border px-3.5 py-1.5 rounded-2xl">
              <Award className="w-5 h-5" />
              <span>Streak: {currentStreak}</span>
            </div>

            {/* TTS Sound toggle button */}
            <button
              id="audio-toggle-btn"
              onClick={() => setAudioEnabled(!audioEnabled)}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                audioEnabled
                  ? "bg-natural-sand hover:bg-[#EAE2D6] text-natural-sage border-natural-border"
                  : "bg-natural-light hover:bg-[#EAE2D6] text-natural-khaki border-natural-cream"
              }`}
              title={audioEnabled ? "Mute Pronunciation" : "Enable Pronunciation"}
            >
              {audioEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
          </div>

          {/* Kid Progress Tracker Dots */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-xs text-natural-warmgray font-bold uppercase tracking-wider mb-2">
              <span>Playing List: {list.name}</span>
              <span>Word {currentIndex + 1} of {arenaWords.length}</span>
            </div>
            
            {/* Visual multi-segmented progress bar */}
            <div className="flex gap-1.5 w-full h-3 bg-natural-light rounded-full overflow-hidden p-0.5 border border-natural-cream">
              {arenaWords.map((_, i) => {
                const isPassed = i < currentIndex;
                const isActive = i === currentIndex;
                return (
                  <div
                    key={i}
                    className={`h-full rounded-full transition-all ${
                      isPassed
                        ? "bg-natural-sage flex-1"
                        : isActive
                        ? "bg-natural-terracotta flex-1 animate-pulse"
                        : "bg-natural-cream w-4"
                    }`}
                  />
                );
              })}
            </div>
          </div>

          {/* Core Interactive Speaker Card */}
          <div className="bg-natural-sand border-2 border-dashed border-natural-border rounded-3xl p-6 sm:p-8 mb-6 relative">
            <div className="absolute top-2 right-2 flex items-center gap-1 text-[10px] font-bold text-natural-khaki">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Spelling Challenge</span>
            </div>

            <p className="text-natural-text text-sm font-medium mb-3">
              Listen carefully to the voice, then spell the word below!
            </p>

            {/* Giant voice triggers */}
            <div className="flex items-center justify-center my-4">
              <button
                id="repeat-audio-btn"
                type="button"
                onClick={handleSpeak}
                className="group w-28 h-28 rounded-full bg-natural-sage hover:bg-opacity-95 text-white flex flex-col items-center justify-center gap-1 transition-all hover:scale-105 active:scale-95 shadow-md border-4 border-white cursor-pointer"
                title="Hear word & context sentence"
              >
                <Volume2 className="w-10 h-10 group-hover:scale-110 transition-transform" />
                <span className="font-extrabold text-xs tracking-wider uppercase">REPEAT</span>
              </button>
            </div>

            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="text-[11px] font-bold text-natural-title bg-natural-cream px-3 py-1 rounded-full border border-natural-border">
                Level: {list.level}
              </span>
            </div>

            {/* Collapsible Voice Settings */}
            <div className="pt-3 border-t border-natural-cream">
              <button
                id="toggle-voice-settings-btn"
                type="button"
                onClick={() => setShowSettings(!showSettings)}
                className="mx-auto flex items-center justify-center gap-1.5 text-[11px] font-extrabold text-natural-text hover:text-natural-title transition-all rounded px-3 py-1.5 bg-white border border-natural-cream active:scale-95 cursor-pointer shadow-none"
              >
                <span>⚙️ {showSettings ? "Hide" : "Customize"} Voice & Accent Settings</span>
              </button>

              {showSettings && (
                <div className="mt-4 p-4 rounded-2xl bg-white border border-natural-cream grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-left">
                  {/* Voice accent option */}
                  <div className="space-y-1.5 flex flex-col">
                    <label className="font-bold text-natural-title uppercase tracking-wider text-[10px]">
                      🗣️ Spelling Voice
                    </label>
                    <select
                      id="voice-picker-select"
                      className="w-full p-2 py-1.5 rounded-xl border border-natural-cream bg-natural-light text-natural-title font-semibold text-xs outline-none focus:border-natural-sage cursor-pointer"
                      value={selectedVoiceName}
                      onChange={(e) => handleVoiceChange(e.target.value)}
                    >
                      {voices.length === 0 ? (
                        <option value="">Default System Voice</option>
                      ) : (
                        voices.map((voice, idx) => (
                          <option key={idx} value={voice.name}>
                            {voice.name} ({voice.lang})
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  {/* Pitch setting option */}
                  <div className="space-y-1.5 flex flex-col">
                    <label className="font-bold text-natural-title uppercase tracking-wider text-[10px]">
                      🎵 Voice Tone / Pitch
                    </label>
                    <div className="grid grid-cols-3 gap-1">
                      {[
                        { label: "Normal", val: 0.95 },
                        { label: "Cheerful", val: 1.05 },
                        { label: "Cute", val: 1.15 }
                      ].map((pitchOpt) => (
                        <button
                          key={pitchOpt.label}
                          type="button"
                          onClick={() => handlePitchChange(pitchOpt.val.toString())}
                          className={`p-1.5 rounded-xl border text-center font-bold text-[10px] transition-all cursor-pointer ${
                            speechPitch === pitchOpt.val
                              ? "bg-natural-sage text-white border-natural-sage"
                              : "bg-natural-light text-natural-warmgray border-natural-cream hover:bg-natural-sand"
                          }`}
                        >
                          {pitchOpt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Speed options panel */}
                  <div className="space-y-1.5 flex flex-col">
                    <label className="font-bold text-natural-title uppercase tracking-wider text-[10px]">
                      ⏳ Reading Speed
                    </label>
                    <div className="grid grid-cols-3 gap-1">
                      {[
                        { label: "Slower", val: 0.65 },
                        { label: "Normal", val: 0.8 },
                        { label: "Faster", val: 0.95 }
                      ].map((rateOpt) => (
                        <button
                          key={rateOpt.label}
                          type="button"
                          onClick={() => handleRateChange(rateOpt.val.toString())}
                          className={`p-1.5 rounded-xl border text-center font-bold text-[10px] transition-all cursor-pointer ${
                            speechRate === rateOpt.val
                              ? "bg-natural-sage text-white border-natural-sage"
                              : "bg-natural-light text-natural-warmgray border-natural-cream hover:bg-natural-sand"
                          }`}
                        >
                          {rateOpt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Form to submit the child's input */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <input
                id="word-type-input"
                ref={inputRef}
                type="text"
                disabled={feedback === "correct"}
                className={`w-full text-center py-4 px-6 rounded-2xl border-4 text-3xl font-extrabold uppercase tracking-widest outline-none transition-all ${
                  feedback === "correct"
                    ? "border-natural-sage bg-natural-light text-natural-title"
                    : "border-natural-cream focus:border-natural-sage focus:ring-8 focus:ring-natural-sand bg-natural-light"
                }`}
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="TYPE HERE"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                autoFocus
              />
              {feedback === "correct" && (
                <div className="absolute inset-y-0 right-4 flex items-center text-natural-sage">
                  <CheckCircle2 className="w-8 h-8 animate-bounce" />
                </div>
              )}
            </div>

            {feedback === "correct" ? (
              <div className="bg-natural-light border border-natural-cream text-natural-title py-3 rounded-xl font-bold flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5 text-natural-sage animate-spin-slow" />
                <span>Well done! Spelling is correct!</span>
              </div>
            ) : (
              <button
                id="submit-spelling-btn"
                type="submit"
                className="w-full py-4 bg-natural-sage hover:bg-opacity-95 text-white font-extrabold text-xl rounded-2xl shadow-sm transition-all active:scale-[0.98] cursor-pointer"
              >
                Check Spelling 🌟
              </button>
            )}
          </form>

          {/* Bottom helper tip */}
          <div className="mt-4 pt-4 border-t border-natural-cream flex items-center justify-center gap-2 text-xs text-natural-warmgray">
            <span>Tip: Keep your sound turned up! Press</span>
            <kbd className="bg-natural-light font-bold px-1.5 py-0.5 rounded border border-natural-border">Enter</kbd>
            <span>to check.</span>
          </div>

        </div>
      ) : (
        /* Reward Completion screen */
        <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border-4 border-natural-cream text-center relative overflow-hidden">
          
          <div className="absolute top-0 inset-x-0 h-2 bg-natural-sage"></div>

          {/* Giant Trophy Icon */}
          <div className="mx-auto my-4 w-24 h-24 bg-natural-sand border-2 border-natural-cream rounded-full flex items-center justify-center text-natural-terracotta">
            <Trophy className="w-12 h-12" />
          </div>

          <h2 className="text-4xl font-extrabold text-natural-title tracking-tight mb-2">
            Fantastic Spellings!
          </h2>
          <p className="text-natural-warmgray text-md max-w-md mx-auto mb-6">
            Congratulations! You completed the spelling list: <strong className="text-natural-title font-semibold">{list.name}</strong>.
          </p>

          {/* Stats Bento Grid for Kids */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            <div className="bg-natural-light border border-natural-cream p-4 rounded-2xl">
              <span className="block text-xs font-bold text-natural-sage uppercase tracking-wide">Final Score</span>
              <span className="text-2xl font-black text-natural-title">{score} pts</span>
            </div>
            
            <div className="bg-natural-sand border border-natural-cream p-4 rounded-2xl">
              <span className="block text-xs font-bold text-natural-terracotta uppercase tracking-wide">Stars</span>
              <span className="text-2xl font-black text-natural-title">★ {stars}</span>
            </div>

            <div className="bg-natural-cream border border-natural-border p-4 rounded-2xl">
              <span className="block text-xs font-bold text-natural-warmgray uppercase tracking-wide">Max Streak</span>
              <span className="text-2xl font-black text-natural-title">{maxStreak}/{arenaWords.length}</span>
            </div>
          </div>

          {/* Medal Earned Display */}
          <div className="bg-natural-light border border-natural-cream rounded-2xl p-6 mb-8 flex flex-col md:flex-row items-center justify-center gap-4 text-left">
            <div className="bg-natural-cream text-natural-title w-16 h-16 rounded-full flex items-center justify-center border-2 border-natural-border flex-shrink-0 animate-bounce">
              <Award className="w-8 h-8 text-natural-sage" />
            </div>
            <div>
              <p className="text-xs text-natural-khaki uppercase tracking-widest font-bold">Virtual Badge Unlocked</p>
              <h3 className="text-lg font-extrabold text-natural-title">{calculateBadge(stars, maxStreak)}</h3>
              <p className="text-xs text-natural-warmgray">Wear this badge with pride spelling star!</p>
            </div>
          </div>

          {/* Save score onto high score leaderboard */}
          {!scoreSaved ? (
            <form onSubmit={handleSaveScore} className="bg-natural-sand border border-natural-cream rounded-2xl p-5 text-left space-y-4">
              <h4 className="text-natural-title font-bold text-sm flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-natural-sage" />
                Add your score to the Spelling Hall of Fame!
              </h4>
              <div className="relative">
                <input
                  id="child-hero-name"
                  type="text"
                  required
                  maxLength={25}
                  placeholder="Type your first name (e.g. Leo)!"
                  className="w-full px-4 py-3 rounded-xl border border-natural-cream focus:border-natural-sage bg-white font-bold tracking-wide outline-none"
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                />
              </div>
              <button
                id="submit-leaderboard-btn"
                type="submit"
                disabled={isSavingScore || !childName.trim()}
                className="w-full py-3 bg-natural-terracotta hover:bg-opacity-95 text-white font-extrabold rounded-xl transition-all shadow-md active:scale-[0.98] cursor-pointer"
              >
                {isSavingScore ? "Saving Score..." : "Put My Name on the Leaderboard! 🏆"}
              </button>
            </form>
          ) : (
            <div id="score-saved-msg" className="p-4 bg-natural-sand border border-natural-sage/30 text-natural-title font-bold rounded-2xl mb-6">
              Saved! Go check your rank on the Leaderboard tab! 🏆🌟
            </div>
          )}

          {/* End Buttons */}
          <div className="mt-8 flex gap-3">
            <button
              id="replay-list-btn"
              onClick={() => {
                startSession(sessionSize);
              }}
              className="flex-1 py-3 bg-natural-sage hover:bg-opacity-90 text-white font-bold rounded-xl active:scale-95 transition-all text-sm cursor-pointer shadow-sm"
            >
              Replay Playlist
            </button>
            <button
              id="back-home-btn"
              onClick={onBack}
              className="flex-1 py-3 bg-natural-light hover:bg-[#EAE2D6] text-natural-text font-bold rounded-xl active:scale-95 transition-all text-sm cursor-pointer border border-natural-border"
            >
              Pick Another List
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
