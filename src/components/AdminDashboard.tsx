import React, { useState, useEffect } from "react";
import { WordList, Word, ScoreEntry } from "../types";
import { Plus, Trash2, Trophy, ListTodo, Award, Sparkles, RefreshCw, X, HelpCircle } from "lucide-react";

interface AdminDashboardProps {
  onBack: () => void;
  wordLists: WordList[];
  customLists: WordList[];
  leaderboard: ScoreEntry[];
  onRefreshData: () => Promise<void>;
}

export default function AdminDashboard({
  onBack,
  wordLists,
  customLists,
  leaderboard,
  onRefreshData,
}: AdminDashboardProps) {
  // Navigation tabs of Dashboard
  const [activeTab, setActiveTab] = useState<"lists" | "leaderboard">("lists");

  // New list creation state
  const [listName, setListName] = useState("");
  const [listDesc, setListDesc] = useState("");
  const [listLevel, setListLevel] = useState<"Easy" | "Medium" | "Hard" | "Adult">("Medium");
  const [wordRows, setWordRows] = useState<Word[]>([{ word: "", sentence: "" }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const handleAddRow = () => {
    setWordRows([...wordRows, { word: "", sentence: "" }]);
  };

  const handleRemoveRow = (index: number) => {
    if (wordRows.length === 1) return;
    setWordRows(wordRows.filter((_, idx) => idx !== index));
  };

  const handleRowChange = (index: number, field: keyof Word, value: string) => {
    const updated = [...wordRows];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setWordRows(updated);
  };

  const handleDeleteList = async (id: string) => {
    if (!confirm("Are you sure you want to delete this custom spelling list?")) return;

    try {
      const res = await fetch(`/api/custom-lists/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await onRefreshData();
      } else {
        alert("Failed to delete list");
      }
    } catch (e) {
      console.error(e);
      alert("Error occurred deleting list");
    }
  };

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!listName.trim()) {
      setFormError("Please enter a list name.");
      return;
    }

    // Clean up empty spelling words
    const finalWords = wordRows
      .map((r) => ({
        word: r.word.trim().toLowerCase(),
        sentence: r.sentence.trim(),
      }))
      .filter((r) => r.word.length > 0);

    if (finalWords.length === 0) {
      setFormError("Please add at least one spelling word.");
      return;
    }

    // Assign automatically populated sample sentence if empty to make it easier for kids
    const promptWords = finalWords.map((item) => {
      if (!item.sentence) {
        return {
          word: item.word,
          sentence: `Can you show me how to spell ${item.word}?`,
        };
      }
      return item;
    });

    const uniqueId = `custom-list-${Date.now()}`;
    const newList: WordList = {
      id: uniqueId,
      name: listName.trim(),
      description: listDesc.trim() || `Custom list created on ${new Date().toLocaleDateString()}`,
      level: listLevel,
      words: promptWords,
    };

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/custom-lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newList),
      });

      if (res.ok) {
        setListName("");
        setListDesc("");
        setListLevel("Medium");
        setWordRows([{ word: "", sentence: "" }]);
        setFormSuccess("Amazing! Your custom spelling list has been saved successfully!");
        await onRefreshData();
      } else {
        const err = await res.json();
        setFormError(err.error || "Failed to save spelling list.");
      }
    } catch (err) {
      console.error(err);
      setFormError("A network error occurred while saving.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 relative">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border-4 border-natural-cream mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-left">
          <div className="bg-natural-sand p-3 rounded-2xl border border-natural-cream">
            <ListTodo className="w-8 h-8 text-natural-sage" />
          </div>
          <div>
            <h2 className="text-3xl font-extrabold text-natural-title tracking-tight">Parent & Teacher Zone</h2>
            <p className="text-sm text-natural-warmgray font-medium">Create spelling challenges, review progress, and view our top wizards.</p>
          </div>
        </div>

        <button
          id="dashboard-back-btn"
          onClick={onBack}
          className="px-6 py-3 cursor-pointer bg-natural-light hover:bg-[#EAE2D6] text-natural-text font-bold rounded-2xl transition-all border border-natural-border active:scale-95 text-sm"
        >
          ← Go back to play game
        </button>
      </div>

      {/* Primary Dashboard Navigation Tabs */}
      <div className="grid grid-cols-2 gap-3 mb-8 bg-natural-light p-2 rounded-2xl border border-natural-cream">
        <button
          id="tab-lists-btn"
          onClick={() => setActiveTab("lists")}
          className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all cursor-pointer ${
            activeTab === "lists"
              ? "bg-white text-natural-sage border border-natural-cream shadow-sm"
              : "text-natural-warmgray hover:text-natural-title hover:bg-natural-sand"
          }`}
        >
          <ListTodo className="w-5 h-5" />
          Manage Spelling Lists
        </button>
        <button
          id="tab-leaderboard-btn"
          onClick={() => setActiveTab("leaderboard")}
          className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all cursor-pointer ${
            activeTab === "leaderboard"
              ? "bg-white text-natural-terracotta border border-natural-cream shadow-sm"
              : "text-natural-warmgray hover:text-natural-title hover:bg-natural-sand"
          }`}
        >
          <Trophy className="w-5 h-5" />
          Leaderboard Record
        </button>
      </div>

      {activeTab === "lists" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* List display section */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm border-2 border-natural-cream text-left">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-natural-cream">
                <h3 className="text-xl font-bold text-natural-title">Spelling Playlists</h3>
                <span className="text-xs font-bold text-natural-title bg-natural-light border border-natural-cream px-2 py-1 rounded-md">
                  {wordLists.length + customLists.length} Lists Active
                </span>
              </div>

              {/* Core Built-in Lists */}
              <div className="space-y-4 mb-8">
                <h4 className="text-xs font-bold text-natural-warmgray uppercase tracking-wider">Built-In Playlists</h4>
                {wordLists.map((list) => {
                  const badgeColor =
                    list.level === "Easy"
                      ? "bg-natural-sage/15 text-natural-title border-natural-sage/30"
                      : list.level === "Medium"
                      ? "bg-natural-sand text-natural-title border-natural-cream"
                      : list.level === "Adult"
                      ? "bg-purple-15 text-purple-700 border-purple-200/60"
                      : "bg-natural-terracotta/15 text-natural-title border-natural-terracotta/30";

                  return (
                    <div
                      key={list.id}
                      className="p-4 rounded-2xl bg-natural-light border border-natural-cream flex items-start justify-between gap-3 shadow-none hover:border-natural-border transition-all"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-natural-title text-sm">{list.name}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeColor}`}>
                            {list.level}
                          </span>
                        </div>
                        <p className="text-xs text-natural-warmgray">{list.description}</p>
                        <p className="text-xs font-medium text-natural-sage">
                          {list.words.length} Words: {list.words.map((w) => w.word).slice(0, 5).join(", ")}...
                        </p>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-natural-khaki select-none bg-natural-sand border border-natural-cream px-2 py-1 rounded-lg">
                        Locked
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Custom Lists */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-natural-warmgray uppercase tracking-wider">Your Custom Playlists</h4>
                {customLists.length === 0 ? (
                  <div className="p-6 rounded-2xl border-2 border-dashed border-natural-border bg-natural-light text-center text-natural-warmgray text-sm">
                    No custom spelling lists created yet. Fill out the form to make your first custom spelling homework!
                  </div>
                ) : (
                  customLists.map((list) => {
                    const badgeColor =
                      list.level === "Easy"
                        ? "bg-natural-sage/15 text-natural-title border-natural-sage/30"
                        : list.level === "Medium"
                        ? "bg-natural-sand text-natural-title border-natural-cream"
                        : list.level === "Adult"
                        ? "bg-purple-15 text-purple-700 border-purple-200/60"
                        : "bg-natural-terracotta/15 text-natural-title border-natural-terracotta/30";

                    return (
                      <div
                        key={list.id}
                        className="p-4 rounded-2xl bg-natural-sand/50 border border-natural-cream flex items-start justify-between gap-3 shadow-sm hover:border-natural-border transition-all"
                      >
                        <div className="space-y-1 text-left">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-natural-title">{list.name}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeColor}`}>
                              {list.level}
                            </span>
                          </div>
                          <p className="text-xs text-natural-warmgray">{list.description}</p>
                          <p className="text-xs font-medium text-natural-sage">
                            {list.words.length} Words: {list.words.map((w) => w.word).join(", ")}
                          </p>
                        </div>
                        <button
                          id={`delete-list-${list.id}`}
                          onClick={() => handleDeleteList(list.id)}
                          className="p-2 cursor-pointer text-natural-khaki hover:text-natural-terracotta hover:bg-white rounded-xl transition-all"
                          title="Delete Custom List"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* List creation section */}
          <div className="lg:col-span-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm border-4 border-natural-cream text-left">
              <h3 className="text-xl font-bold text-natural-title pb-2 border-b border-natural-cream mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-natural-sage" />
                Create Custom Homework List
              </h3>

              {formError && (
                <div id="create-err" className="p-3 mb-4 bg-natural-sand border border-natural-terracotta/40 text-natural-terracotta text-sm font-medium rounded-xl">
                  {formError}
                </div>
              )}

              {formSuccess && (
                <div id="create-ok" className="p-3 mb-4 bg-natural-sand border border-natural-sage text-natural-title text-sm font-medium rounded-xl">
                  {formSuccess}
                </div>
              )}

              <form onSubmit={handleCreateList} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-natural-warmgray uppercase tracking-widest mb-1.5">
                    1. Playlist Name
                  </label>
                  <input
                    id="new-list-name"
                    type="text"
                    required
                    placeholder="e.g. Week 4 Spellings - Plurals"
                    className="w-full px-4 py-2.5 rounded-xl border border-natural-cream bg-natural-light focus:border-natural-sage focus:ring-4 focus:ring-natural-sand outline-none transition-all text-sm font-bold placeholder-natural-khaki"
                    value={listName}
                    onChange={(e) => setListName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-natural-warmgray uppercase tracking-widest mb-1.5">
                    2. Description / Focus Rule (Optional)
                  </label>
                  <input
                    id="new-list-desc"
                    type="text"
                    placeholder="e.g. Practicing words ending in -ies"
                    className="w-full px-4 py-2.5 rounded-xl border border-natural-cream bg-natural-light focus:border-natural-sage focus:ring-4 focus:ring-natural-sand outline-none transition-all text-sm placeholder-natural-khaki"
                    value={listDesc}
                    onChange={(e) => setListDesc(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-natural-warmgray uppercase tracking-widest mb-1.5">
                    3. Target Level / Difficulty
                  </label>
                  <select
                    id="new-list-level"
                    className="w-full px-4 py-2.5 rounded-xl border border-natural-cream bg-natural-light focus:border-natural-sage focus:ring-4 focus:ring-natural-sand outline-none transition-all text-sm font-bold text-natural-text"
                    value={listLevel}
                    onChange={(e) => setListLevel(e.target.value as any)}
                  >
                    <option value="Easy">Easy (CVC / Reception / Year 1)</option>
                    <option value="Medium">Medium (Year 2 / Year 3)</option>
                    <option value="Hard">Hard (Year 4 / Year 5 / Year 6)</option>
                    <option value="Adult">Adult (Adulthood / Expert Spelling Champions)</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-natural-warmgray uppercase tracking-widest">
                      4. Spelling Words ({wordRows.length})
                    </label>
                    <button
                      id="add-word-row-btn"
                      type="button"
                      onClick={handleAddRow}
                      className="text-xs font-bold cursor-pointer text-natural-sage hover:text-opacity-90 bg-natural-light border border-natural-cream px-3 py-1.5 rounded-lg transition-all"
                    >
                      + Add Word Row
                    </button>
                  </div>

                  <div className="max-h-80 overflow-y-auto space-y-3 pr-1 border border-natural-cream p-2 rounded-2xl bg-natural-light/60">
                    {wordRows.map((row, index) => (
                      <div key={index} className="flex gap-2 items-start bg-white p-3 rounded-xl border border-natural-cream shadow-none relative">
                        <div className="font-bold text-xs text-natural-khaki self-center bg-natural-sand border border-natural-cream rounded-full w-5 h-5 flex items-center justify-center">
                          {index + 1}
                        </div>
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-2">
                          <div className="md:col-span-4">
                            <input
                              id={`new-word-val-${index}`}
                              type="text"
                              required
                              placeholder="Spelling Word"
                              className="w-full px-3 py-1.5 rounded-lg border border-natural-cream bg-natural-light focus:border-natural-sage hover:border-natural-border outline-none transition-all text-sm uppercase font-bold"
                              value={row.word}
                              onChange={(e) => handleRowChange(index, "word", e.target.value)}
                            />
                          </div>
                          <div className="md:col-span-8">
                            <input
                              id={`new-word-sentence-${index}`}
                              type="text"
                              placeholder="Sentence context (highly recommended!)"
                              className="w-full px-3 py-1.5 rounded-lg border border-natural-cream bg-natural-light focus:border-natural-sage outline-none transition-all text-sm placeholder-natural-khaki"
                              value={row.sentence}
                              onChange={(e) => handleRowChange(index, "sentence", e.target.value)}
                            />
                          </div>
                        </div>
                        <button
                          id={`remove-word-row-${index}`}
                          type="button"
                          onClick={() => handleRemoveRow(index)}
                          disabled={wordRows.length === 1}
                          className="text-natural-khaki hover:text-natural-terracotta rounded p-1 transition-all disabled:opacity-30 self-center"
                          title="Remove Word"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  id="submit-new-list-btn"
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 cursor-pointer bg-natural-sage hover:bg-opacity-95 text-white font-extrabold text-base rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Save & Create Spelling Playlist
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : (
        /* Leaderboard Record */
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border-4 border-natural-cream text-left">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-natural-cream flex-wrap gap-2">
            <div>
              <h3 className="text-2xl font-bold text-natural-title flex items-center gap-2">
                <Trophy className="w-6 h-6 text-natural-terracotta" />
                Spelling Bee Hall of Fame
              </h3>
              <p className="text-natural-warmgray text-sm">Real-time leaderboard scores of spelling champions!</p>
            </div>
            <div className="bg-natural-sand text-natural-title px-4 py-2 rounded-2xl border border-natural-cream font-bold text-sm">
              🏆 Max Score: {leaderboard[0]?.score || 0}
            </div>
          </div>

          {leaderboard.length === 0 ? (
            <div className="p-12 text-center text-natural-warmgray border border-natural-cream rounded-2xl bg-natural-light">
              <Trophy className="w-12 h-12 stroke-1 text-natural-khaki mx-auto mb-3 animate-bounce" />
              There are no scores on the board yet! Start practicing to record your spelling high-score!
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-natural-cream">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-natural-sand text-natural-title border-b border-natural-cream text-xs font-bold uppercase tracking-wider">
                    <th className="px-6 py-4 rounded-tl-2xl">Rank</th>
                    <th className="px-6 py-4">Wizard Name</th>
                    <th className="px-6 py-4">Spelling Board</th>
                    <th className="px-6 py-4">Score</th>
                    <th className="px-6 py-4">Stars Earned</th>
                    <th className="px-6 py-4">Badge Achieved</th>
                    <th className="px-6 py-4 rounded-tr-2xl">Date Achieved</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-natural-cream text-sm text-natural-text font-medium bg-white">
                  {leaderboard.map((entry, index) => {
                    const rowBg = index === 0 ? "bg-natural-sand" : index === 1 ? "bg-natural-light" : "bg-white";
                    
                    return (
                      <tr key={index} className={`hover:bg-natural-sand/50 transition-colors ${rowBg}`}>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full font-bold ${
                            index === 0
                              ? "bg-natural-terracotta text-white text-xs border border-natural-cream"
                              : index === 1
                              ? "bg-natural-sage text-white text-xs"
                              : index === 2
                              ? "bg-natural-khaki text-white text-xs"
                              : "bg-natural-light text-natural-warmgray text-xs border border-natural-cream"
                          }`}>
                            {index + 1}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-bold text-natural-title">
                          {entry.name}
                        </td>
                        <td className="px-6 py-4 text-xs text-natural-warmgray">
                          {entry.listName}
                        </td>
                        <td className="px-6 py-4 text-natural-sage font-extrabold">
                          {entry.score} pts
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 text-xs text-natural-title bg-natural-light border border-natural-cream px-2 py-1 rounded-xl">
                            ★ {entry.stars}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1 text-xs text-natural-title bg-natural-sand border border-natural-cream px-2.5 py-1 rounded-2xl font-bold">
                            <Award className="w-3.5 h-3.5" />
                            {entry.badge}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-natural-warmgray text-xs">
                          {new Date(entry.date).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
