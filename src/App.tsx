import { useState, useEffect } from "react";
import { AppData, WordList } from "./types";
import PlayArena from "./components/PlayArena";
import AdminDashboard from "./components/AdminDashboard";
import { ListTodo, Trophy, Award, Lock, ShieldCheck, Play, PlusCircle, RefreshCw, Star, Info, Volume2 } from "lucide-react";

export default function App() {
  const [data, setData] = useState<AppData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [currentView, setCurrentView] = useState<"home" | "play" | "admin">("home");
  const [selectedList, setSelectedList] = useState<WordList | null>(null);

  // PWA (Progressive Web App) Install States
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [showIOSHint, setShowIOSHint] = useState(false);
  const [showInstructionModal, setShowInstructionModal] = useState(false);
  const [isDismissed, setIsDismissed] = useState(() => {
    return localStorage.getItem("pwa_install_dismissed") === "true";
  });

  // Track the install prompt event and iOS PWA compatibility
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent browser default mini-infobar dialog in Chrome
      e.preventDefault();
      // Stash prompt event for custom trigger
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Detect if app is already running in standalone mode (fullscreen/installed)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;
    if (isStandalone) {
      setIsInstallable(false);
      setShowIOSHint(false);
    } else {
      // Detect iPad/iPhone to display helpful iOS Safari add instructions
      const ua = navigator.userAgent;
      const isIOSDevice = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
      if (isIOSDevice) {
        setShowIOSHint(true);
      }
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log("PWA install choice outcome:", outcome);
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  const handleDismissBanner = () => {
    localStorage.setItem("pwa_install_dismissed", "true");
    setIsDismissed(true);
  };

  // Load API data on mount
  const fetchAPIData = async () => {
    try {
      const res = await fetch("/api/data");
      if (res.ok) {
        const payload = await res.json() as AppData;
        setData(payload);
        setErrorMsg("");
      } else {
        setErrorMsg("Failed to read lists from server database.");
      }
    } catch (e) {
      console.error(e);
      setErrorMsg("Failed to connect to the spelling server.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAPIData();
  }, []);

  const handleStartPlay = (list: WordList) => {
    setSelectedList(list);
    setCurrentView("play");
  };

  const handleBackToHome = () => {
    setCurrentView("home");
    setSelectedList(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-natural-bg flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white rounded-3xl p-8 border-4 border-natural-cream shadow-2xl flex flex-col items-center max-w-sm space-y-4">
          <RefreshCw className="w-12 h-12 text-natural-sage animate-spin" />
          <h3 className="text-2xl font-black text-natural-title">Spelling Bee Wizard</h3>
          <p className="text-natural-warmgray text-sm font-medium animate-pulse">Loading spelling books and high scores...</p>
        </div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-natural-bg flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white rounded-3xl p-8 border-4 border-natural-terracotta/40 shadow-2xl flex flex-col items-center max-w-md space-y-4">
          <div className="text-natural-terracotta text-5xl">⚠️</div>
          <h3 className="text-2xl font-black text-natural-title">Connection Error</h3>
          <p className="text-natural-text text-sm font-medium">{errorMsg}</p>
          <button
            id="retry-connection-btn"
            onClick={fetchAPIData}
            className="px-6 py-3 bg-natural-terracotta hover:bg-opacity-90 text-white font-extrabold rounded-xl transition-all shadow-md active:scale-95 text-sm cursor-pointer"
          >
            Try Reconnecting
          </button>
        </div>
      </div>
    );
  }

  // Combined array for user interface
  const allPlaylists = [
    ...(data?.wordLists || []),
    ...(data?.customLists || [])
  ];

  return (
    <div className="min-h-screen bg-natural-bg text-natural-text">
      
      {/* Playful Top Navbar Banner */}
      <header className="bg-white/85 backdrop-blur-md border-b-4 border-natural-cream sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          
          {/* Logo element */}
          <div 
            className="flex items-center gap-3 cursor-pointer select-none"
            onClick={handleBackToHome}
          >
            <div className="bg-natural-sand text-natural-sage w-11 h-11 rounded-full flex items-center justify-center text-2xl border-2 border-natural-cream animate-bouncer">
              🐝
            </div>
            <div>
              <h1 className="text-2xl font-black text-natural-title tracking-tight leading-none">Spelling Bee</h1>
              <span className="text-[10px] font-bold text-natural-khaki uppercase tracking-widest bg-natural-light px-1.5 py-0.5 rounded border border-natural-cream">
                WIZARD ARENA
              </span>
            </div>
          </div>

          {/* Nav zone toggle */}
          <div className="flex items-center gap-2">
            {(isInstallable || showIOSHint) && (
              <button
                id="header-install-btn"
                onClick={isInstallable ? handleInstallApp : () => setShowInstructionModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-400 hover:bg-yellow-300 text-natural-title font-black text-[11px] rounded-xl transition-all border-2 border-natural-title cursor-pointer active:scale-95 shadow-sm"
                title="Install Spell Bee Wizard to your home screen"
              >
                <span>📱 Install App</span>
              </button>
            )}
            <button
              id="top-nav-home"
              onClick={handleBackToHome}
              className={`px-4 py-2 cursor-pointer text-sm font-extrabold rounded-xl transition-all border-2 ${
                currentView === "home"
                  ? "bg-natural-cream text-natural-title border-natural-border"
                  : "text-natural-warmgray hover:text-natural-title hover:bg-natural-light border-transparent"
              }`}
            >
              Play Arena
            </button>
            <button
              id="top-nav-admin"
              onClick={() => setCurrentView("admin")}
              className={`px-4 py-2 cursor-pointer text-sm font-extrabold rounded-xl transition-all flex items-center gap-1.5 border-2 ${
                currentView === "admin"
                  ? "bg-natural-title text-natural-light border-natural-title shadow-md"
                  : "bg-natural-light hover:bg-[#EAE2D6] text-natural-text border-natural-cream/70"
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-natural-sage" />
              Parent Zone
            </button>
          </div>

        </div>
      </header>

      {/* Primary Context View Router */}
      <main className="pb-16">
        {currentView === "play" && selectedList ? (
          <PlayArena
            list={selectedList}
            onBack={handleBackToHome}
            onScoreSaved={fetchAPIData}
          />
        ) : currentView === "admin" && data ? (
          <AdminDashboard
            wordLists={data.wordLists}
            customLists={data.customLists}
            leaderboard={data.leaderboard}
            onBack={handleBackToHome}
            onRefreshData={fetchAPIData}
          />
        ) : (
          /* "home" Main Grid Selection View */
          <div className="max-w-5xl mx-auto px-4 py-8 text-center space-y-8 animate-fade-in">
            
            {/* Install PWA Prompt Banner */}
            {((isInstallable || showIOSHint) && !isDismissed) && (
              <div className="bg-gradient-to-r from-yellow-450/15 via-natural-sand to-natural-cream/60 rounded-[32px] p-5 sm:p-6 border-4 border-yellow-400/40 text-left flex flex-col sm:flex-row items-center justify-between gap-5 relative overflow-hidden shadow-sm">
                <div className="flex items-center gap-4 z-10">
                  <div className="bg-yellow-400 text-natural-title text-2xl w-14 h-14 rounded-2xl flex items-center justify-center shadow-md animate-pulse border-2 border-natural-title">
                    📱
                  </div>
                  <div>
                    <h4 className="font-black text-natural-title text-lg leading-tight">
                      Install Spelling Bee Wizard!
                    </h4>
                    <p className="text-natural-warmgray text-xs mt-1 max-w-xl leading-relaxed">
                      {isInstallable 
                        ? "Install this modern spelling app directly on your mobile home-screen to study words faster and practice offline!"
                        : "To install on your iPad or iPhone: tap standard share icon in Safari (the square with up-arrow), scroll, and tap 'Add to Home Screen'!"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 z-10 w-full sm:w-auto justify-end">
                  {isInstallable && (
                    <button
                      id="btn-pwa-install-banner"
                      onClick={handleInstallApp}
                      className="py-2.5 px-5 bg-natural-sage hover:bg-opacity-95 text-white font-extrabold rounded-xl text-xs cursor-pointer shadow active:scale-95 transition-all text-center flex-1 sm:flex-initial"
                    >
                      Install App
                    </button>
                  )}
                  {showIOSHint && (
                    <button
                      id="btn-pwa-ios-banner"
                      onClick={() => setShowInstructionModal(true)}
                      className="py-2.5 px-5 bg-natural-sage hover:bg-opacity-95 text-white font-extrabold rounded-xl text-xs cursor-pointer shadow active:scale-95 transition-all text-center flex-1 sm:flex-initial"
                    >
                      Show Guide
                    </button>
                  )}
                  <button
                    id="btn-pwa-dismiss"
                    onClick={handleDismissBanner}
                    className="py-2.5 px-4 bg-white hover:bg-natural-cream text-natural-title font-extrabold rounded-xl text-xs cursor-pointer transition-all border border-natural-cream flex-1 sm:flex-initial text-center"
                  >
                    Maybe Later
                  </button>
                </div>
                
                {/* Visual back highlight */}
                <div className="absolute right-[-10px] top-[-10px] opacity-[0.03] text-9xl pointer-events-none select-none">
                  📱
                </div>
              </div>
            )}
            
            {/* Whimsical Welcomer Card */}
            <div className="bg-natural-sand text-natural-text rounded-[36px] p-6 sm:p-10 shadow-sm border-4 border-natural-cream relative overflow-hidden flex flex-col md:flex-row items-center justify-between text-left gap-6">
              <div className="space-y-3 z-10">
                <div className="inline-flex items-center gap-1 bg-natural-sage/20 border border-natural-sage/30 px-3 py-1 rounded-full text-xs font-bold leading-none backdrop-blur-sm text-natural-title">
                  <Star className="w-4 h-4 fill-current animate-pulse text-natural-sage" />
                  <span>Fun Interactive Spelling For Kids</span>
                </div>
                <h2 className="text-4xl font-extrabold tracking-tight text-natural-title">Become a Spelling Champion!</h2>
                <p className="text-natural-warmgray text-sm max-w-lg leading-relaxed">
                  Practice spellings with real, helpful voice pronunciations, earn golden stars, and collect virtual badges to showcase your incredible knowledge!
                </p>
              </div>

              {/* Action Parent Zone shortcut button */}
              <button
                id="btn-goto-create"
                onClick={() => setCurrentView("admin")}
                className="z-10 py-3.5 px-6 font-extrabold cursor-pointer bg-natural-terracotta hover:bg-opacity-95 text-white rounded-2xl shadow-md transition-all active:scale-95 text-sm flex items-center justify-between gap-2.5 min-w-[200px]"
              >
                <span>🆕 Create Spelling List</span>
                <PlusCircle className="w-5 h-5 text-white" />
              </button>
              
              {/* Cute floating SVG background highlights */}
              <div className="absolute right-[-4%] bottom-[-20%] opacity-10 font-black text-[200px] select-none pointer-events-none p-0 leading-none">
                🐝
              </div>
            </div>

            {/* Selecting Word Playlists */}
            <div className="space-y-6">
              <div className="text-left flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black text-natural-title">Select a Spelling Book</h3>
                  <p className="text-natural-warmgray text-xs font-semibold">Choose an easy, medium, or hard list to study!</p>
                </div>
                <span className="text-[11px] font-bold text-natural-warmgray border border-natural-cream rounded-lg px-2.5 py-1 bg-white">
                  {allPlaylists.length} Playlists loaded
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {allPlaylists.map((list) => {
                  const isEasy = list.level === "Easy";
                  const isHard = list.level === "Hard";
                  const isAdult = list.level === "Adult";
                  
                  const borderClass = isEasy 
                    ? "border-natural-sage/50 hover:border-natural-sage" 
                    : isHard 
                    ? "border-natural-terracotta/50 hover:border-natural-terracotta" 
                    : isAdult
                    ? "border-purple-350 hover:border-purple-500"
                    : "border-natural-cream hover:border-natural-warmgray";

                  const badgeClass = isEasy
                    ? "bg-natural-sage/15 text-natural-title border-natural-sage/30"
                    : isHard
                    ? "bg-natural-terracotta/15 text-natural-title border-natural-terracotta/30"
                    : isAdult
                    ? "bg-purple-50 text-purple-700 border-purple-200"
                    : "bg-natural-sand text-natural-title border-natural-cream";

                  const levelEmoji = isEasy ? "🍃" : isHard ? "🦖" : isAdult ? "🎓" : "🦁";

                  return (
                    <div
                      key={list.id}
                      className={`bg-white rounded-3xl p-5 border-2 ${borderClass} shadow-sm hover:shadow-md flex flex-col justify-between text-left transition-all group`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-1">
                          <span className={`text-[10px] font-bold tracking-widest px-2.5 py-1 rounded-full border uppercase ${badgeClass}`}>
                            {levelEmoji} {list.level}
                          </span>
                          
                          {list.isCustom && (
                            <span className="text-[10px] font-bold text-natural-terracotta bg-natural-light border border-natural-cream rounded-md px-1.5 py-0.5">
                              Homework
                            </span>
                          )}
                        </div>

                        <h4 className="text-lg font-extrabold text-natural-title tracking-tight group-hover:text-natural-sage transition-colors">
                          {list.name}
                        </h4>
                        
                        <p className="text-natural-warmgray text-xs min-h-[36px] line-clamp-2 leading-relaxed">
                          {list.description}
                        </p>
                      </div>

                      {/* Detail overview */}
                      <div className="mt-5 pt-3 border-t border-natural-cream flex items-center justify-between gap-2">
                        <span className="text-xs font-extrabold text-natural-title bg-natural-light border border-natural-cream px-2.5 py-1 rounded-lg">
                          ★ {list.words.length} Words
                        </span>

                        <button
                          id={`start-list-${list.id}`}
                          onClick={() => handleStartPlay(list)}
                          className="px-4 py-2 cursor-pointer bg-natural-sage hover:bg-opacity-90 text-white font-extrabold rounded-xl transition-all shadow active:scale-95 text-xs flex items-center gap-1"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          Start Challenge
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Leaderboard Preview widget */}
            {data && data.leaderboard && data.leaderboard.length > 0 && (
              <div className="bg-natural-sand rounded-3xl p-6 border-2 border-natural-border text-left max-w-3xl mx-auto space-y-4">
                <div className="flex items-center justify-between border-b border-natural-border pb-2 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-natural-terracotta" />
                    <h4 className="font-extrabold text-natural-title text-base">Top 3 Spelling Champions</h4>
                  </div>
                  <button
                    id="hall-fame-nav"
                    onClick={() => {
                      setCurrentView("admin");
                    }}
                    className="text-xs font-bold text-natural-sage hover:text-opacity-85 underline active:scale-95 transition-all cursor-pointer"
                  >
                    View full leaderboard →
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {data.leaderboard.slice(0, 3).map((champion, idx) => (
                    <div key={idx} className="bg-white rounded-2xl p-3 border border-natural-cream flex items-center gap-3">
                      <span className="font-black text-natural-title text-lg bg-natural-light w-8 h-8 rounded-full flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <div className="text-xs">
                        <p className="font-bold text-natural-title truncate max-w-[120px]">{champion.name}</p>
                        <p className="text-natural-sage font-extrabold">{champion.score} pts</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Speech info card */}
            <div className="bg-natural-light rounded-2xl p-4 text-xs text-natural-warmgray border border-natural-cream max-w-sm mx-auto flex items-center gap-2.5">
              <Info className="w-4 h-4 text-natural-khaki flex-shrink-0" />
              <p className="text-left leading-normal">
                Uses the HTML5 speech engine to read spellings contextually. Works best in modern browsers (Chrome, Safari, Edge).
              </p>
            </div>

          </div>
        )}
      </main>

      {/* iOS App Installation Instructions Modal */}
      {showInstructionModal && (
        <div className="fixed inset-0 bg-natural-title/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] p-6 sm:p-8 max-w-sm w-full border-4 border-natural-cream shadow-2xl relative space-y-5 animate-scale-up">
            <button
              onClick={() => setShowInstructionModal(false)}
              className="absolute top-4 right-4 bg-natural-sand hover:bg-natural-cream text-natural-title w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm cursor-pointer border border-natural-cream"
              title="Close Dialog"
            >
              ✕
            </button>
            
            <div className="text-center">
              <span className="text-4xl">🍎</span>
              <h3 className="text-2xl font-black text-natural-title mt-2">Add to Home Screen</h3>
              <p className="text-natural-warmgray text-xs mt-1">Get standard app icons and practice spelling entirely offline!</p>
            </div>

            <div className="bg-natural-sand p-4 rounded-2xl border border-natural-cream text-xs text-natural-text font-medium space-y-4">
              <div className="flex gap-3 items-start">
                <span className="bg-natural-sage text-white font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0">1</span>
                <p className="leading-relaxed">Tap Safari's <span className="font-extrabold text-natural-title">Share button</span> (square box with an arrow pointing up) at the base of the webpage.</p>
              </div>
              <div className="flex gap-3 items-start">
                <span className="bg-natural-sage text-white font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0">2</span>
                <p className="leading-relaxed">Scroll down the menu list and tap option <span className="font-extrabold text-natural-title">"Add to Home Screen"</span>.</p>
              </div>
              <div className="flex gap-3 items-start">
                <span className="bg-natural-sage text-white font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0">3</span>
                <p className="leading-relaxed">Tap blue text <span className="font-extrabold text-natural-sage">"Add"</span> in top-right corner to complete! 🐝</p>
              </div>
            </div>

            <button
              onClick={() => setShowInstructionModal(false)}
              className="w-full py-3 bg-natural-title hover:bg-opacity-95 text-white font-extrabold text-sm rounded-xl cursor-pointer shadow active:scale-95 transition-all text-center"
            >
              Okay, I understand!
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
