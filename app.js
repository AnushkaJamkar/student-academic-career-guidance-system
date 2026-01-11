const express = require("express");
const path = require("path");
const Database = require("better-sqlite3");

const app = express();

/* ---------- MIDDLEWARE ---------- */
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

/* ---------- VIEW ENGINE ---------- */
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

/* ---------- DATABASE ---------- */
const dbPath = path.join(__dirname, "database", "workload.db");
const db = new Database(dbPath);
console.log("Connected to SQLite database");

/* ---------- TABLES ---------- */
db.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT,
    password TEXT
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS weekly_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    study_hours INTEGER,
    sleep_hours INTEGER,
    assignments INTEGER,
    stress_level INTEGER,
    week TEXT
  )
`).run();

/* ---------- ROUTES ---------- */

/* Home */
app.get("/", (req, res) => {
  res.render("index");
});

/* Redirect old entry */
app.get("/entry", (req, res) => {
  res.redirect("/study");
});

/* ---------- OLD WORKLOAD FORM (OPTIONAL) ---------- */
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

  db.prepare(`
    INSERT INTO weekly_data
    (user_id, study_hours, sleep_hours, assignments, stress_level, week)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(1, study_hours, sleep_hours, assignments, stress_level, week);

  res.render("result", {
    workload_score,
    burnout_level
  });
});

/* ---------- ACADEMIC ASSESSMENT ---------- */

/* Study Pattern */
app.get("/study", (req, res) => {
  res.render("study");
});

app.post("/study", (req, res) => {
  const pressure = Number(req.body.pressure);

  let level = "Low";
  let message = "Your academic workload feels manageable and balanced.";

  if (pressure === 2) {
    level = "Moderate";
    message = "Your workload feels slightly heavy but manageable with structure.";
  } else if (pressure === 3) {
    level = "High";
    message = "You often feel overwhelmed by studies.";
  } else if (pressure === 4) {
    level = "Very High";
    message = "Your workload feels mentally exhausting.";
  }

  res.render("study-result", { level, message });
});

/* Time Management */
app.get("/time", (req, res) => {
  res.render("time");
});

app.post("/time", (req, res) => {
  let habits = req.body.habits || [];
  if (!Array.isArray(habits)) habits = [habits];

  const score = habits.length;

  let level = "Good";
  let message = "You manage your time fairly well.";

  if (score >= 3) {
    level = "Unstable";
    message = "Your time management lacks structure.";
  }
  if (score >= 4) {
    level = "Chaotic";
    message = "Poor time structure is affecting productivity.";
  }

  res.render("time-result", { level, message });
});

/* Academic Pressure */
app.get("/pressure", (req, res) => {
  res.render("pressure");
});

app.post("/pressure", (req, res) => {
  const value = Number(req.body.pressure);

  let level = "Low";
  let message = "Academic pressure feels manageable.";

  if (value >= 40 && value < 70) {
    level = "Moderate";
    message = "Academic pressure is noticeable.";
  }
  if (value >= 70) {
    level = "High";
    message = "High academic pressure detected.";
  }

  res.render("pressure-result", { level, message });
});

/* Goals & Roadmap */
app.get("/goals", (req, res) => {
  res.render("goals");
});

app.post("/goals", (req, res) => {
  const { academic, health } = req.body;

  let academicPlan = [];
  let healthPlan = [];
  let weeklyRule = "";

  if (academic === "consistency") {
    academicPlan = [
      "Study in fixed daily slots",
      "Limit tasks to 3 priorities",
      "Avoid last-minute cramming"
    ];
    weeklyRule = "Weekly progress review every Sunday.";
  }

  if (academic === "performance") {
    academicPlan = [
      "Focus on weak subjects",
      "Use active recall",
      "Practice daily problems"
    ];
    weeklyRule = "Weekly self-test.";
  }

  if (academic === "placements") {
    academicPlan = [
      "Daily 1-hour skill prep",
      "Weekly mini-project",
      "Track skill progress"
    ];
    weeklyRule = "Improve one employability skill weekly.";
  }

  if (health === "sleep") {
    healthPlan = [
      "Fixed sleep schedule",
      "No late-night study",
      "Sleep is non-negotiable"
    ];
  }

  if (health === "stress") {
    healthPlan = [
      "Break tasks into chunks",
      "Short guilt-free breaks",
      "Stress = overload, not laziness"
    ];
  }

  if (health === "balance") {
    healthPlan = [
      "Daily non-study activity",
      "Avoid continuous screen time",
      "Consistency over intensity"
    ];
  }

  res.render("roadmap", {
    academicPlan,
    healthPlan,
    weeklyRule
  });
});

/* ---------- CAREER MODULE ---------- */

app.get("/career", (req, res) => {
  res.render("career");
});

app.get("/career/tech", (req, res) => {
  res.render("tech-roadmap");
});

/* ---------- SERVER ---------- */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
