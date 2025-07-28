const express = require('express');
const cors = require('cors');
const path = require('path');
const ComboGenerator = require('./utils/comboGenerator');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const comboGenerator = new ComboGenerator();

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Updated endpoint for single day - now returns JSON format
app.get('/api/combos/:day', (req, res) => {
  try {
    const day = req.params.day;
    const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    if (!validDays.includes(day)) {
      return res.status(400).json({ error: 'Invalid day. Please use Monday, Tuesday, etc.' });
    }
    
    const result = comboGenerator.generateSingleDayMenu(day);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// Updated endpoint for three days - now returns JSON format
app.get('/api/three-day-menu/:startDay', (req, res) => {
  try {
    const startDay = req.params.startDay;
    const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    if (!validDays.includes(startDay)) {
      return res.status(400).json({ error: 'Invalid day. Please use Monday, Tuesday, etc.' });
    }
    
    const result = comboGenerator.generateThreeDayMenu(startDay);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// Seven day menu endpoint
app.get('/api/seven-day-menu', (req, res) => {
  try {
    const result = comboGenerator.generateSevenDayMenu();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// Get master menu
app.get('/api/master-menu', (req, res) => {
  const masterMenu = require('./data/menu');
  res.json(masterMenu);
});

app.listen(PORT, () => {
  console.log(`🍅 Sticky Tomatoes server running on http://localhost:${PORT}`);
  console.log(`📱 API endpoints:`);
  console.log(`   GET /api/combos/:day - Get single day meal (JSON format)`);
  console.log(`   GET /api/three-day-menu/:startDay - Get three-day menu (JSON format)`);
  console.log(`   GET /api/seven-day-menu - Get seven-day menu (JSON format)`);
  console.log(`   GET /api/master-menu - Get master menu`);
});
