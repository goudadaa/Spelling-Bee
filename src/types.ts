export interface Word {
  word: string;
  sentence: string;
}

export interface WordList {
  id: string;
  name: string;
  description: string;
  level: 'Easy' | 'Medium' | 'Hard' | 'Adult';
  words: Word[];
  isCustom?: boolean;
}

export interface ScoreEntry {
  name: string;
  score: number;
  stars: number;
  date: string;
  badge: string;
  listName: string;
}

export interface AppData {
  wordLists: WordList[];
  customLists: WordList[];
  leaderboard: ScoreEntry[];
}
