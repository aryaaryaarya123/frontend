const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ──
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── Database ──
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// ── Init Tables ──
async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS expenses (
      id BIGINT PRIMARY KEY,
      name TEXT NOT NULL,
      amount NUMERIC NOT NULL,
      cat TEXT,
      date TEXT,
      paid_by TEXT,
      split_type TEXT,
      shares JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS incomes (
      id BIGINT PRIMARY KEY,
      person TEXT,
      name TEXT NOT NULL,
      amount NUMERIC NOT NULL,
      source TEXT,
      date TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS debts (
      id BIGINT PRIMARY KEY,
      from_person TEXT,
      to_person TEXT,
      amount NUMERIC,
      description TEXT,
      date TEXT,
      settled BOOLEAN DEFAULT FALSE,
      settled_date TEXT,
      is_payment BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  console.log('✅ Database tables ready');
}

// ══════════════════════════════════════
//  ROUTES
// ══════════════════════════════════════

// GET all data in one shot (used on page load)
app.get('/api/data', async (req, res) => {
  try {
    const [expRes, incRes, debtRes] = await Promise.all([
      pool.query('SELECT * FROM expenses ORDER BY created_at DESC'),
      pool.query('SELECT * FROM incomes ORDER BY created_at DESC'),
      pool.query('SELECT * FROM debts ORDER BY created_at DESC')
    ]);

    const mapExp = row => ({
      id:        Number(row.id),
      name:      row.name,
      amount:    Number(row.amount),
      cat:       row.cat,
      date:      row.date,
      paidBy:    row.paid_by,
      splitType: row.split_type,
      shares:    row.shares || {}
    });

    const mapInc = row => ({
      id:     Number(row.id),
      person: row.person,
      name:   row.name,
      amount: Number(row.amount),
      source: row.source,
      date:   row.date
    });

    const mapDebt = row => ({
      id:          Number(row.id),
      from:        row.from_person,
      to:          row.to_person,
      amount:      Number(row.amount),
      desc:        row.description,
      date:        row.date,
      settled:     row.settled,
      settledDate: row.settled_date,
      isPayment:   row.is_payment
    });

    res.json({
      expenses: expRes.rows.map(mapExp),
      incomes:  incRes.rows.map(mapInc),
      debts:    debtRes.rows.map(mapDebt)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load data' });
  }
});

// ── EXPENSES ──
app.post('/api/expenses', async (req, res) => {
  const { id, name, amount, cat, date, paidBy, splitType, shares } = req.body;
  try {
    await pool.query(
      `INSERT INTO expenses (id, name, amount, cat, date, paid_by, split_type, shares)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (id) DO NOTHING`,
      [id, name, amount, cat, date, paidBy, splitType, JSON.stringify(shares || {})]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save expense' });
  }
});

app.delete('/api/expenses/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM expenses WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

// ── INCOMES ──
app.post('/api/incomes', async (req, res) => {
  const { id, person, name, amount, source, date } = req.body;
  try {
    await pool.query(
      `INSERT INTO incomes (id, person, name, amount, source, date)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (id) DO NOTHING`,
      [id, person, name, amount, source, date]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save income' });
  }
});

app.delete('/api/incomes/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM incomes WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete income' });
  }
});

// ── DEBTS ──
app.post('/api/debts', async (req, res) => {
  const { id, from, to, amount, desc, date, settled, settledDate, isPayment } = req.body;
  try {
    await pool.query(
      `INSERT INTO debts (id, from_person, to_person, amount, description, date, settled, settled_date, is_payment)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (id) DO NOTHING`,
      [id, from, to, amount, desc, date, settled || false, settledDate || null, isPayment || false]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save debt' });
  }
});

app.put('/api/debts/:id', async (req, res) => {
  const { settled, settledDate } = req.body;
  try {
    await pool.query(
      'UPDATE debts SET settled = $1, settled_date = $2 WHERE id = $3',
      [settled, settledDate || null, req.params.id]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update debt' });
  }
});

app.delete('/api/debts/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM debts WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete debt' });
  }
});

// ── Catch-all: serve index.html ──
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Start ──
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Ledger running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to init DB:', err);
  process.exit(1);
});
