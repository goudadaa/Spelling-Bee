/**
 * Speech synthesis utility to read words and example sentences aloud.
 * Employs the browser's native Window.SpeechSynthesis API with prioritized high-quality selections.
 */

/**
 * Gets a prioritized list of English voices from the browser.
 * This actively filters and sorts to prioritize crystal clear, natural voices (e.g. Google Cloud, premium OS voices).
 */
export function getEnglishVoices(): SpeechSynthesisVoice[] {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return [];
  
  const voices = window.speechSynthesis.getVoices();
  // Filter for English voices
  const englishVoices = voices.filter(voice => {
    const lang = voice.lang.toLowerCase();
    return lang.startsWith("en-") || lang === "en";
  });

  // Sort by priority (Google high-quality -> Apple Premium/Enhanced -> Microsoft Premium -> others)
  return englishVoices.sort((a, b) => {
    const getPriorityScore = (v: SpeechSynthesisVoice) => {
      const name = v.name.toLowerCase();
      
      // 1. Google Web/Dynamic voices are outstandingly smooth and natural
      if (name.includes("google") && (name.includes("uk") || name.includes("us") || name.includes("english"))) {
        return 100;
      }
      if (name.includes("google")) {
        return 90;
      }
      
      // 2. High fidelity Apple/Microsoft/Google OS voices with 'natural', 'enhanced', or 'premium' flags
      if (name.includes("natural") || name.includes("premium") || name.includes("enhanced")) {
        return 80;
      }

      // 3. Known clear OS voices that children love for clear phonetics
      const clearKidFriendlyOSVoices = [
        "samantha", "siri", "daniel", "serena", "kate", "stephanie", "david", "zira", "hazel", "susie", "karen", "moira"
      ];
      if (clearKidFriendlyOSVoices.some(vName => name.includes(vName))) {
        return 70;
      }

      // 4. Preferred British/American spelling regional clear accents
      if (v.lang === "en-GB" || v.lang === "en-US") {
        return 50;
      }
      
      return 10;
    };

    return getPriorityScore(b) - getPriorityScore(a);
  });
}

/**
 * Pronounces a word clearly and uses it in a custom sample sentence
 */
export function speakWordAndSentence(
  word: string, 
  sentence: string, 
  voiceName?: string, 
  rate: number = 0.8, 
  pitch: number = 1.05
) {
  if (!("speechSynthesis" in window)) {
    console.warn("Speech synthesis is not supported in this browser.");
    return;
  }

  // Cancel any active SpeechSynthesis utterance to escape sound queues
  window.speechSynthesis.cancel();

  // Structured prompt to introduce the word clearly
  const textToSpeak = `Can you spell ... ${word}. ... ${sentence}`;
  
  const utterance = new SpeechSynthesisUtterance(textToSpeak);

  const voices = window.speechSynthesis.getVoices();
  let selectedVoice = voices.find(v => v.name === voiceName);

  // Fallback to highest-priority English voice
  if (!selectedVoice) {
    const sorted = getEnglishVoices();
    if (sorted.length > 0) {
      selectedVoice = sorted[0];
    }
  }

  if (selectedVoice) {
    utterance.voice = selectedVoice;
  }

  utterance.rate = rate; // standard kid selection e.g. 0.8
  utterance.pitch = pitch; // normal e.g. 1.05

  window.speechSynthesis.speak(utterance);
}

/**
 * Repeat just the word and the spelling prompt clearly
 */
export function speakWordOnly(
  word: string, 
  voiceName?: string, 
  rate: number = 0.75, 
  pitch: number = 1.05
) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(word);
  const voices = window.speechSynthesis.getVoices();
  let selectedVoice = voices.find(v => v.name === voiceName);

  if (!selectedVoice) {
    const sorted = getEnglishVoices();
    if (sorted.length > 0) {
      selectedVoice = sorted[0];
    }
  }

  if (selectedVoice) {
    utterance.voice = selectedVoice;
  }

  utterance.rate = rate;
  utterance.pitch = pitch;

  window.speechSynthesis.speak(utterance);
}

/**
 * Sound out the word letter-by-letter to help a struggling child.
 * For example: "S . P . E . L . L ... spell!"
 */
export function soundOutWord(
  word: string,
  voiceName?: string,
  rate: number = 0.65,
  pitch: number = 1.05
) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();

  // Spell it out with slight structural pauses
  const spacedLetters = word.toUpperCase().split("").join(" ... ");
  const text = `Let's sound it out ... ${spacedLetters}. ... ${word}!`;

  const utterance = new SpeechSynthesisUtterance(text);
  const voices = window.speechSynthesis.getVoices();
  let selectedVoice = voices.find(v => v.name === voiceName);

  if (!selectedVoice) {
    const sorted = getEnglishVoices();
    if (sorted.length > 0) {
      selectedVoice = sorted[0];
    }
  }

  if (selectedVoice) {
    utterance.voice = selectedVoice;
  }

  utterance.rate = rate;
  utterance.pitch = pitch;

  window.speechSynthesis.speak(utterance);
}

/**
 * Plays a bright, positive "ding/chime" sound using the browser's Web Audio API. This synthesizes 
 * native harmonic oscillators to produce a crisp, cheerful, game-like notification.
 */
export function playSuccessDing() {
  if (typeof window === "undefined") return;
  const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContext) return;

  try {
    const ctx = new AudioContext();
    
    // Create twin oscillators for a beautiful harmonized physical bells / chime tone
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();

    // Primary note: E5 (659.25 Hz) raising quickly to G5 (783.99 Hz) for an enthusiastic uplift
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(659.25, ctx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.08);

    // Harmonic accent: High B5 (987.77 Hz) raising to D6 (1174.66 Hz) to add acoustic sparkle
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(987.77, ctx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(1174.66, ctx.currentTime + 0.12);

    // Setup smooth decay envelope for note 1
    gain1.gain.setValueAtTime(0.001, ctx.currentTime);
    gain1.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.02); // quick attack
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45); // smooth decay

    // Setup smooth decay envelope for note 2
    gain2.gain.setValueAtTime(0.001, ctx.currentTime);
    gain2.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.03); // slightly delayed sparkle attack
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.50); // ring out slightly longer

    // Connect nodes
    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    // Connect note 2
    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    // Trigger synthesis
    osc1.start(ctx.currentTime);
    osc2.start(ctx.currentTime);

    // Garbage collection stop times
    osc1.stop(ctx.currentTime + 0.55);
    osc2.stop(ctx.currentTime + 0.55);
  } catch (error) {
    console.warn("Failed to play success chime:", error);
  }
}

