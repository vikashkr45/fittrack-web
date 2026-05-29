const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'db.json');

app.use(express.json());
app.use(express.static(__dirname));

// Helper function to read from DB file safely
function readDB() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const defaultState = getInitialState();
      fs.writeFileSync(DB_FILE, JSON.stringify(defaultState, null, 2), 'utf-8');
      return defaultState;
    }
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    
    // Ensure nested fields exist
    if (!parsed.profile) parsed.profile = {};
    if (!parsed.workout) parsed.workout = { currentGoal: 'loss', completedSets: {}, customExercises: { loss: [], gain: [], maintain: [] } };
    if (!parsed.workout.customExercises) parsed.workout.customExercises = { loss: [], gain: [], maintain: [] };
    if (!parsed.steps) parsed.steps = { steps: 0, stepGoal: 10000, history: {} };
    if (!parsed.steps.history) parsed.steps.history = {};
    if (!parsed.foodLog) parsed.foodLog = [];
    
    return parsed;
  } catch (err) {
    console.error('Error reading database file:', err);
    return getInitialState();
  }
}

function getInitialState() {
  return {
    profile: {},
    workout: {
      currentGoal: 'loss',
      completedSets: {},
      customExercises: { loss: [], gain: [], maintain: [] }
    },
    steps: {
      steps: 0,
      stepGoal: 10000,
      history: {}
    },
    foodLog: []
  };
}

// Helper function to write to DB file safely
function writeDB(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing to database file:', err);
  }
}

// Helper to get formatted date string for today (YYYY-MM-DD)
function getTodayString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Route to serve the main HTML page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'fittrack.html'));
});

// PROFILE API
app.get('/api/profile', (req, res) => {
  const db = readDB();
  res.json(db.profile);
});

app.post('/api/profile', (req, res) => {
  const db = readDB();
  db.profile = req.body;
  writeDB(db);
  console.log('Saved profile details:', req.body);
  res.json({ success: true, profile: db.profile });
});

// WORKOUT API
app.get('/api/workout', (req, res) => {
  const db = readDB();
  res.json(db.workout);
});

app.post('/api/workout', (req, res) => {
  const db = readDB();
  db.workout = {
    currentGoal: req.body.currentGoal || 'loss',
    completedSets: req.body.completedSets || {},
    customExercises: req.body.customExercises || db.workout.customExercises || { loss: [], gain: [], maintain: [] }
  };
  writeDB(db);
  console.log('Saved workout state:', db.workout);
  res.json({ success: true, workout: db.workout });
});

// STEPS API (includes 7-day history logic)
app.get('/api/steps', (req, res) => {
  const db = readDB();
  const todayStr = getTodayString();
  
  // Make sure today exists in history
  if (db.steps.steps > 0 && !db.steps.history[todayStr]) {
    db.steps.history[todayStr] = db.steps.steps;
  }
  
  // Build a structured 7-day history list for the frontend to graph easily
  const historyList = [];
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  for (let i = 6; i >= 0; i--) {
    const tempDate = new Date();
    tempDate.setDate(tempDate.getDate() - i);
    const year = tempDate.getFullYear();
    const month = String(tempDate.getMonth() + 1).padStart(2, '0');
    const day = String(tempDate.getDate()).padStart(2, '0');
    const dateKey = `${year}-${month}-${day}`;
    
    // If it's today, return the current step count, otherwise fetch from history
    let stepsVal = 0;
    if (dateKey === todayStr) {
      stepsVal = db.steps.steps;
    } else {
      stepsVal = db.steps.history[dateKey] || 0;
    }
    
    historyList.push({
      date: dateKey,
      dayName: daysOfWeek[tempDate.getDay()],
      steps: stepsVal
    });
  }
  
  res.json({
    steps: db.steps.steps,
    stepGoal: db.steps.stepGoal,
    history: historyList
  });
});

app.post('/api/steps', (req, res) => {
  const db = readDB();
  const todayStr = getTodayString();
  
  const oldSteps = db.steps.steps;
  db.steps.steps = typeof req.body.steps === 'number' ? req.body.steps : 0;
  db.steps.stepGoal = typeof req.body.stepGoal === 'number' ? req.body.stepGoal : 10000;
  
  // Record/update steps in the history dictionary
  db.steps.history[todayStr] = db.steps.steps;
  
  writeDB(db);
  console.log(`Updated steps today to ${db.steps.steps} (was ${oldSteps})`);
  res.json({ success: true, steps: db.steps });
});

// FOOD LOGGER API
app.get('/api/nutrition/log', (req, res) => {
  const db = readDB();
  res.json(db.foodLog);
});

app.post('/api/nutrition/log', (req, res) => {
  const db = readDB();
  const newFood = {
    name: String(req.body.name || 'Unnamed food'),
    calories: Math.round(Number(req.body.calories || 0)),
    protein: Math.round(Number(req.body.protein || 0))
  };
  db.foodLog.push(newFood);
  writeDB(db);
  console.log('Added food log entry:', newFood);
  res.json({ success: true, foodLog: db.foodLog });
});

app.delete('/api/nutrition/log/:index', (req, res) => {
  const db = readDB();
  const index = parseInt(req.params.index);
  if (isNaN(index) || index < 0 || index >= db.foodLog.length) {
    return res.status(400).json({ error: 'Invalid index' });
  }
  const removed = db.foodLog.splice(index, 1);
  writeDB(db);
  console.log('Deleted food log entry:', removed[0]);
  res.json({ success: true, foodLog: db.foodLog });
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`FitTrack server started with advanced features!`);
  console.log(`Local url: http://localhost:${PORT}`);
  console.log(`Database file: ${DB_FILE}`);
  console.log(`====================================================`);
});
