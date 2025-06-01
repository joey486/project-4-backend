const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const session = require('express-session');

app.use(session({
  secret: 'super-secret-key', // change this to an env var in production
  resave: false,
  saveUninitialized: true,
   cookie: {
    sameSite: 'none',   
    secure: true       
  }
}));

const ROWS = 3;
const COLS = 3;

const SYMBOLS_COUNT = { A: 2, B: 4, C: 6, D: 8 };
const SYMBOL_VALUE = { A: 5, B: 4, C: 3, D: 2 };

const transpose = (reels) => {
  const rows = [];
  for (let i = 0; i < ROWS; i++) {
    rows.push([]);
    for (let j = 0; j < COLS; j++) {
      rows[i].push(reels[j][i]);
    }
  }
  return rows;
};

const getWinnings = (rows, bet, lines) => {
  let winnings = 0;
  for (let row = 0; row < lines; row++) {
    const symbols = rows[row];
    if (symbols.every(s => s === symbols[0])) {
      winnings += bet * SYMBOL_VALUE[symbols[0]];
    }
  }
  return winnings;
};

const spinReels = () => {
  const symbols = [];
  for (const [symbol, count] of Object.entries(SYMBOLS_COUNT)) {
    for (let i = 0; i < count; i++) {
      symbols.push(symbol);
    }
  }

  const reels = [];
  for (let i = 0; i < COLS; i++) {
    const reelSymbols = [...symbols];
    const column = [];
    for (let j = 0; j < ROWS; j++) {
      const index = Math.floor(Math.random() * reelSymbols.length);
      column.push(reelSymbols.splice(index, 1)[0]);
    }
    reels.push(column);
  }
  return transpose(reels);
};


// Test route
app.get("/", (req, res) => {
  res.send("Server is running.");
});

// Spin route
app.post('/spin', (req, res) => {
  const { lines, bet } = req.body;
  const balance = req.session.balance || 0;

  if (lines < 1 || lines > 3 || bet <= 0 || bet * lines > balance) {
    return res.status(400).json({ error: 'Invalid bet or lines' });
  }

  const rows = spinReels();
  const winnings = getWinnings(rows, bet, lines);
  const newBalance = balance - bet * lines + winnings;

  req.session.balance = newBalance;

  res.json({ rows, winnings, newBalance });
});

// Deposit route
app.post("/deposit", (req, res) => {
  const { amount } = req.body;

  if (typeof amount !== "number" || amount <= 0) {
    return res.status(400).json({ message: "Invalid deposit amount" });
  }

  req.session.balance = (req.session.balance || 0) + amount;

  res.json({ message: "Deposit successful", balance: req.session.balance });
});


// Get current balance
app.get("/balance", (req, res) => {
  res.json({ balance: req.session.balance || 0 });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
