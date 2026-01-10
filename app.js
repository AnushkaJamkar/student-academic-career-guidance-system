const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// View engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Database connection
const dbPath = path.join(__dirname, "database", "workload.db");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.log("DB error:", err.message);
  } else {
    console.log("Connected to SQLite database");
  }
});

// Create tables
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT,
      password TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS weekly_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      study_hours INTEGER,
      sleep_hours INTEGER,
      assignments INTEGER,
      stress_level INTEGER,
      week TEXT
    )
  `);
});

/* ---------- ROUTES ---------- */

// Landing Page (Gold Hero UI)
app.get("/", (req, res) => {
  res.render("index");
});

// Entry Form
app.get("/entry", (req, res) => {
  res.render("entry");
});

// Form Submit + Logic
app.post("/submit", (req, res) => {
  const { study_hours, sleep_hours, assignments, stress_level, week } = req.body;

  const workload_score =
    Number(study_hours) * 2 +
    Number(assignments) * 3 -
    Number(sleep_hours);

  let burnout_level = "LOW";

  if (stress_level >= 4 && sleep_hours < 6) {
    burnout_level = "HIGH";
  } else if (workload_score > 20) {
    burnout_level = "MEDIUM";
  }

  const query = `
    INSERT INTO weekly_data
    (user_id, study_hours, sleep_hours, assignments, stress_level, week)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.run(
    query,
    [1, study_hours, sleep_hours, assignments, stress_level, week],
    (err) => {
      if (err) {
        console.log(err);
        return res.send("Error saving data");
      }

      res.render("result", {
        workload_score,
        burnout_level
      });
    }
  );
});


// Study Pressure Page
app.get("/study", (req, res) => {
  res.render("study");
});

app.post("/study", (req, res) => {
  const pressure = Number(req.body.pressure);

  let level = "Low";
  let message = "Your academic workload feels manageable and balanced.";

  if (pressure === 2) {
    level = "Moderate";
    message = "Your workload feels slightly heavy but still manageable with structure.";
  } else if (pressure === 3) {
    level = "High";
    message = "You often feel overwhelmed by studies. This indicates rising pressure.";
  } else if (pressure === 4) {
    level = "Very High";
    message = "Your workload feels mentally exhausting and may lead to burnout.";
  }

  res.render("study-result", { level, message });
});
// Time Management
app.get("/time", (req, res) => {
  res.render("time");
});

app.post("/time", (req, res) => {
  let habits = req.body.habits || [];
  if (!Array.isArray(habits)) habits = [habits];

  const score = habits.length;

  let level = "Good";
  let message = "You manage your time fairly well with minor inconsistencies.";

  if (score >= 3) {
    level = "Unstable";
    message = "Your time management lacks structure and causes unnecessary stress.";
  }

  if (score >= 4) {
    level = "Chaotic";
    message = "Poor time structure is heavily impacting your productivity.";
  }

  res.render("time-result", { level, message });
});
// Academic Pressure
app.get("/pressure", (req, res) => {
  res.render("pressure");
});

app.post("/pressure", (req, res) => {
  const value = Number(req.body.pressure);

  let level = "Low";
  let message = "Academic pressure feels manageable at the moment.";

  if (value >= 40 && value < 70) {
    level = "Moderate";
    message = "Academic pressure is noticeable and may affect focus.";
  }

  if (value >= 70) {
    level = "High";
    message = "High academic pressure detected. This may impact mental well-being.";
  }

  res.render("pressure-result", { level, message });
});
// Goals
app.get("/goals", (req, res) => {
  res.render("goals");
});
app.get("/entry", (req, res) => {
  res.redirect("/study");
});


app.post("/goals", (req, res) => {
  const { academic, health } = req.body;

  let academicPlan = [];
  let healthPlan = [];
  let weeklyRule = "";

  // Academic plans
  if (academic === "consistency") {
    academicPlan = [
      "Study in fixed daily slots instead of long irregular sessions",
      "Limit daily academic goals to 3 priority tasks",
      "Avoid last-minute study marathons"
    ];
    weeklyRule = "Review progress every Sunday and reset weekly goals.";
  }

  if (academic === "performance") {
    academicPlan = [
      "Identify weak subjects and revise them first",
      "Use active recall instead of rereading notes",
      "Solve at least 5 practice questions daily"
    ];
    weeklyRule = "Test yourself weekly instead of waiting for exams.";
  }

  if (academic === "placements") {
    academicPlan = [
      "Allocate 1 hour daily for skills or interview prep",
      "Build one small project or concept every week",
      "Track progress instead of comparing with peers"
    ];
    weeklyRule = "Every week, improve one employability skill.";
  }

  // Health plans
  if (health === "sleep") {
    healthPlan = [
      "Set a fixed sleep and wake-up time",
      "Avoid studying late at night",
      "Sleep is treated as non-negotiable"
    ];
  }

  if (health === "stress") {
    healthPlan = [
      "Break large tasks into smaller chunks",
      "Take short guilt-free breaks",
      "Stress indicates overload, not laziness"
    ];
  }

  if (health === "balance") {
    healthPlan = [
      "Balance academics with at least one daily non-study activity",
      "Avoid continuous screen time",
      "Consistency matters more than intensity"
    ];
  }

  res.render("roadmap", {
    academicPlan,
    healthPlan,
    weeklyRule
  });
});
// Career Path Analyzer
app.get("/career", (req, res) => {
  res.render("career");
});
// Tech Career Roadmap
app.get("/career/tech", (req, res) => {
  res.render("tech-roadmap");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
