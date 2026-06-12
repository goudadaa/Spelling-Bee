import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { AppData, WordList, ScoreEntry } from "./src/types";

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Determine database path. Default to ./data/spellings.json
const DB_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "spellings.json");

// Default initial data if database doesn't exist
const DEFAULT_DATA: AppData = {
  wordLists: [
    {
      id: "phonics-easy",
      name: "Phonics / Easy (Ages 4-6)",
      description: "Simple CVC (consonant-vowel-consonant) words for younger spelling wizards.",
      level: "Easy",
      words: [
        { word: "cat", sentence: "The sleeping cat purred softly." },
        { word: "dog", sentence: "The friendly dog wagged its tail." },
        { word: "sun", sentence: "The summer sun is hot and bright." },
        { word: "red", sentence: "She has the pretty red balloon." },
        { word: "hop", "sentence": "A tiny frog can hop very high." },
        { word: "pig", sentence: "The playful pink pig rolled in mud." },
        { word: "pen", sentence: "Write your name with a blue pen." },
        { word: "bug", sentence: "There is a ladybug on the leaf." },
        { word: "zip", sentence: "Remember to zip up your warm winter coat." },
        { word: "fox", sentence: "The clever orange fox ran into the woods." }
      ]
    },
    {
      id: "ks1-medium",
      name: "KS1 Year 1-2 / Medium (Ages 6-8)",
      description: "Common exceptions, compound words, and standard school spellings.",
      level: "Medium",
      words: [
        { word: "friend", sentence: "Max is my best friend in school." },
        { word: "happy", sentence: "Going to the park makes me feel happy." },
        { word: "school", sentence: "We read lots of interesting books at school." },
        { word: "because", sentence: "I stayed inside because it was raining." },
        { word: "house", sentence: "They live in a beautiful blue house." },
        { word: "dream", sentence: "I had a wonderful dream about flying." },
        { word: "laugh", sentence: "His funny joke made everyone laugh." },
        { word: "bright", sentence: "The yellow stars are very bright tonight." },
        { word: "pencil", sentence: "Please write clearly with a sharp pencil." },
        { word: "climb", sentence: "We love to climb the tree in our garden." }
      ]
    },
    {
      id: "ks2-hard",
      name: "KS2 Year 3-6 / Hard (Ages 8-11)",
      description: "Advanced vocabulary, tricky double letters, and complex prefixes/suffixes.",
      level: "Hard",
      words: [
        { word: "necessary", sentence: "Proper nutrition is necessary for a healthy body." },
        { word: "beautiful", sentence: "We walked through a field of beautiful flowers." },
        { word: "delicious", sentence: "My grandmother baked a delicious apple pie." },
        { word: "tomorrow", sentence: "Our school class is going on a field trip tomorrow." },
        { word: "calendar", sentence: "I marked the holiday date on my calendar." },
        { word: "experience", sentence: "Swimming with dolphins was an unforgettable experience." },
        { word: "government", sentence: "The government made a law to protect the forests." },
        { word: "rhythm", sentence: "It is fun to dance and clap to the rhythm of the drums." },
        { word: "separate", sentence: "Please keep the recycling in a separate bin." },
        { word: "library", sentence: "The library has hundreds of adventure books to read." }
      ]
    }
  ],
  customLists: [],
  leaderboard: [
    { name: "Leo the Lion", score: 250, stars: 25, date: "2026-06-11T09:00:00.000Z", badge: "Spelling Ruler", listName: "Phonics / Easy (Ages 4-6)" },
    { name: "Mia the Monkey", score: 180, stars: 18, date: "2026-06-11T09:12:00.000Z", badge: "Word Wizard", listName: "KS1 Year 1-2 / Medium (Ages 6-8)" },
    { name: "Zoe the Zebra", score: 120, stars: 12, date: "2026-06-11T09:15:00.000Z", badge: "Word Wizard", listName: "KS2 Year 3-6 / Hard (Ages 8-11)" },
    { name: "Barnaby Bear", score: 80, stars: 8, date: "2026-06-11T09:25:00.000Z", badge: "Rising Star", listName: "Phonics / Easy (Ages 4-6)" }
  ]
};

// Ensure database file functions
function loadDatabase(): AppData {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_PATH)) {
      fs.writeFileSync(DB_PATH, JSON.stringify(DEFAULT_DATA, null, 2), "utf-8");
      return DEFAULT_DATA;
    }
    const content = fs.readFileSync(DB_PATH, "utf-8");
    const data = JSON.parse(content) as AppData;
    
    // Perform self-healing or validation of required structures
    if (!data.wordLists) data.wordLists = DEFAULT_DATA.wordLists;
    if (!data.customLists) data.customLists = [];
    if (!data.leaderboard) data.leaderboard = [];
    return data;
  } catch (error) {
    console.error("Error loading spelling database:", error);
    return DEFAULT_DATA;
  }
}

function saveDatabase(data: AppData): boolean {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
    return true;
  } catch (error) {
    console.error("Error saving spelling database:", error);
    return false;
  }
}

// REST APIs
app.get("/api/data", (req, res) => {
  const data = loadDatabase();
  res.json(data);
});

app.post("/api/custom-lists", (req, res) => {
  const newList = req.body as WordList;
  if (!newList.id || !newList.name || !newList.words || !Array.isArray(newList.words)) {
    return res.status(400).json({ error: "Invalid list format" });
  }
  
  const data = loadDatabase();
  const existingIndex = data.customLists.findIndex(l => l.id === newList.id);
  
  if (existingIndex > -1) {
    data.customLists[existingIndex] = { ...newList, isCustom: true };
  } else {
    data.customLists.push({ ...newList, isCustom: true });
  }
  
  if (saveDatabase(data)) {
    res.json({ success: true, customLists: data.customLists });
  } else {
    res.status(500).json({ error: "Failed to save to database" });
  }
});

app.delete("/api/custom-lists/:id", (req, res) => {
  const { id } = req.params;
  const data = loadDatabase();
  const initialLength = data.customLists.length;
  data.customLists = data.customLists.filter(l => l.id !== id);
  
  if (data.customLists.length === initialLength) {
    return res.status(404).json({ error: "List not found" });
  }
  
  if (saveDatabase(data)) {
    res.json({ success: true, customLists: data.customLists });
  } else {
    res.status(500).json({ error: "Failed to save change" });
  }
});

app.post("/api/scores", (req, res) => {
  const newScore = req.body as ScoreEntry;
  if (!newScore.name || typeof newScore.score !== "number" || typeof newScore.stars !== "number") {
    return res.status(400).json({ error: "Invalid score entry format" });
  }
  
  const data = loadDatabase();
  data.leaderboard.push({
    name: newScore.name,
    score: newScore.score,
    stars: newScore.stars,
    date: newScore.date || new Date().toISOString(),
    badge: newScore.badge || "Rising Star",
    listName: newScore.listName || "Practice Session"
  });
  
  // Sort leaderboard by score descending, limit to top 50
  data.leaderboard.sort((a, b) => b.score - a.score);
  data.leaderboard = data.leaderboard.slice(0, 50);
  
  if (saveDatabase(data)) {
    res.json({ success: true, leaderboard: data.leaderboard });
  } else {
    res.status(500).json({ error: "Failed to save score" });
  }
});

app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", dbPath: DB_PATH });
});

// Setup Vite Dev Server / Serve Static Frontend
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting dev server with Vite integration...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Serving compiled production assets...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Spelling App server listening at http://0.0.0.0:${PORT}`);
  });
}

setupServer().catch((err) => {
  console.error("Failed to start server:", err);
});
