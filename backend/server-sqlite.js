const express = require('express');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// DB file path
const DB_PATH = path.join(__dirname, 'gramconnect.db');

// Open SQLite database (automatically creates file if not exists)
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Failed to open SQLite DB:', err);
    process.exit(1);
  }
  console.log('SQLite DB opened at', DB_PATH);
});

// Create users table
const createUsersTable = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
`;

db.run(createUsersTable, (err) => {
  if (err) {
    console.error('Error creating users table:', err);
  } else {
    console.log('Users table ready.');
  }
});

// Helpers to use sqlite with promises
const run = (sql, params = []) =>
  new Promise((resolve, reject) => db.run(sql, params, function (err) { err ? reject(err) : resolve(this); }));
const getRow = (sql, params = []) =>
  new Promise((resolve, reject) => db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row))));

// DB tables for OTP + verification
const createOtpsTable = `
CREATE TABLE IF NOT EXISTS otps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  otp_hash TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  consumed INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (strftime('%s','now'))
);`;
const createVerificationsTable = `
CREATE TABLE IF NOT EXISTS email_verifications (
  email TEXT PRIMARY KEY,
  verified_at INTEGER
);`;

db.run(createOtpsTable, (err) => err && console.error('Error creating otps table:', err));
db.run(createVerificationsTable, (err) => err && console.error('Error creating email_verifications table:', err));

// Add SMTP env config (fixes "SMTP_HOST is not defined")
const SMTP_HOST = "smtp.gmail.com";
const SMTP_PORT = 587;
const SMTP_USER = "nisargpanchal2006@gmail.com";
const SMTP_PASS = "epyyubrwluhbqpjo";

// One mailer factory promise: uses your SMTP if provided, else Ethereal test
const transporterPromise = (async () => {
  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    return nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
  }
  const test = await nodemailer.createTestAccount();
  console.log('Using Ethereal test SMTP. Preview URLs will be returned in responses.');
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: { user: test.user, pass: test.pass },
  });
})();

const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

// Health check
app.get('/', (_req, res) => {
  res.json({ ok: true, db: 'sqlite3', file: DB_PATH });
});

// Register endpoint
app.post('/register', (req, res) => {
  const { email, password } = req.body;
  console.log(req.body)
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(password, salt);

  const sql = 'INSERT INTO users (email, password_hash) VALUES (?, ?)';
  db.run(sql, [email, hash], function (err) {
    if (err) {
      if (String(err.message).includes('UNIQUE')) {
        return res.status(409).json({ message: 'Email already registered.' });
      }
      console.error('Register DB error:', err);
      return res.status(500).json({ message: 'Database error.' });
    }
    return res.status(201).json({ message: 'User registered.', userId: this.lastID });
  });
});

// Login endpoint
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  console.log(req.body)
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }
  const sql = 'SELECT id, email, password_hash FROM users WHERE email = ? LIMIT 1';
  db.get(sql, [email], (err, row) => {
    if (err) {
      console.error('Login DB error:', err);
      return res.status(500).json({ message: 'Database error.' });
    }
    if (!row) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }
    const ok = bcrypt.compareSync(password, row.password_hash);
    if (!ok) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }
    return res.json({ message: 'Login successful.', userId: row.id, email: row.email });
  });
});

// Send OTP
app.post('/auth/send-otp', async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ message: 'Email is required.' });

    const otp = generateOtp();
    const otpHash = bcrypt.hashSync(otp, 10);
    const ttlMs = 10 * 60 * 1000; // 10 minutes
    const expiresAt = Date.now() + ttlMs;

    await run('INSERT INTO otps (email, otp_hash, expires_at) VALUES (?, ?, ?)', [email, otpHash, expiresAt]);

    const transporter = await transporterPromise; // works with env or Ethereal
    const info = await transporter.sendMail({
      from: 'nisargpanchal2006@gmail.com',
      to: email,
      subject: 'Your OTP Code',
      text: `Your OTP is ${otp}. It will expire in 10 minutes.`,
      html: `<p>Your OTP is <b style="font-size:18px;">${otp}</b></p><p>It will expire in 10 minutes.</p>`
    });
    const previewUrl = nodemailer.getTestMessageUrl ? nodemailer.getTestMessageUrl(info) : undefined;
    return res.json({ message: 'OTP sent.', expiresInSec: 600, previewUrl });
  } catch (e) {
    console.error('send-otp error:', e);
    return res.status(500).json({ message: 'Failed to send OTP.' });
  }
});

// Verify OTP
app.post('/auth/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body || {};
    if (!email || !otp) return res.status(400).json({ message: 'Email and otp are required.' });

    const row = await getRow(
      'SELECT * FROM otps WHERE email = ? AND consumed = 0 ORDER BY created_at DESC LIMIT 1',
      [email]
    );
    if (!row) return res.status(400).json({ message: 'No OTP found. Please request a new one.' });
    if (Date.now() > Number(row.expires_at)) return res.status(400).json({ message: 'OTP expired. Request a new one.' });

    const ok = bcrypt.compareSync(otp, row.otp_hash);
    if (!ok) return res.status(401).json({ message: 'Invalid OTP.' });

    await run('UPDATE otps SET consumed = 1 WHERE id = ?', [row.id]);
    await run(
      "INSERT INTO email_verifications (email, verified_at) VALUES (?, strftime('%s','now')) ON CONFLICT(email) DO UPDATE SET verified_at = excluded.verified_at",
      [email]
    );

    return res.json({ message: 'OTP verified.', email });
  } catch (e) {
    console.error('verify-otp error:', e);
    return res.status(500).json({ message: 'Failed to verify OTP.' });
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  db.close();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`SQLite server running at http://localhost:${PORT}`);
});





const schemesData =  [
    {
      "name": "National Means-cum-Merit Scholarship Scheme (NMMSS)",
      "launch_year": 2008,
      "category": "Students",
      "description": "Provides scholarships to meritorious students from economically weaker sections to prevent dropouts at class 8th and encourage them to continue education at secondary stage.",
      "beneficiaries": "Class 9-12 students from EWS background.",
      "benefits": [
        "₹12,000 annual scholarship",
        "Direct Benefit Transfer (DBT) to bank accounts"
      ]
    },
    {
      "name": "Central Sector Scheme of Scholarship for College and University Students",
      "launch_year": 2008,
      "category": "Students",
      "description": "Supports meritorious students from economically weaker families to pursue higher education.",
      "beneficiaries": "College and university students from low-income families.",
      "benefits": [
        "₹10,000 per annum for graduation",
        "₹20,000 per annum for post-graduation"
      ]
    },
    {
      "name": "Pragati Scholarship Scheme for Girl Students",
      "launch_year": 2014,
      "category": "Girls / Women",
      "description": "Provides financial assistance to girl students pursuing technical education.",
      "beneficiaries": "Girls in AICTE approved technical institutions.",
      "benefits": [
        "₹50,000 per annum for tuition and other expenses"
      ]
    },
    {
      "name": "Saksham Scholarship Scheme",
      "launch_year": 2014,
      "category": "Students / Disabled",
      "description": "Scholarship scheme for differently-abled students pursuing technical education.",
      "beneficiaries": "Differently-abled students with more than 40% disability.",
      "benefits": [
        "₹50,000 per annum for tuition, books, and living expenses"
      ]
    },
    {
      "name": "Beti Bachao Beti Padhao (BBBP)",
      "launch_year": 2015,
      "category": "Girls / Women",
      "description": "A national campaign to prevent gender-biased sex selective elimination, ensure survival and protection of the girl child, and promote education.",
      "beneficiaries": "Girl children across India.",
      "benefits": [
        "Awareness campaigns",
        "Financial incentives for girl child education"
      ]
    },
    {
      "name": "Sukanya Samriddhi Yojana (SSY)",
      "launch_year": 2015,
      "category": "Girls / Women",
      "description": "A savings scheme under Beti Bachao Beti Padhao for the girl child’s education and marriage.",
      "beneficiaries": "Parents of girl children below 10 years.",
      "benefits": [
        "High interest rate on deposits",
        "Tax benefits under Section 80C",
        "Account maturity at 21 years"
      ]
    },
    {
      "name": "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)",
      "launch_year": 2019,
      "category": "Farmers",
      "description": "Provides income support to all farmer families across the country.",
      "beneficiaries": "All small and marginal farmers.",
      "benefits": [
        "₹6,000 per year in three installments",
        "Direct transfer to bank account"
      ]
    },
    {
      "name": "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
      "launch_year": 2016,
      "category": "Farmers",
      "description": "Crop insurance scheme to provide financial support to farmers in case of crop failure.",
      "beneficiaries": "All farmers including tenant farmers.",
      "benefits": [
        "Low premium rates for Kharif and Rabi crops",
        "Coverage for natural calamities, pests, and diseases"
      ]
    },
    {
      "name": "Kisan Credit Card (KCC)",
      "launch_year": 1998,
      "category": "Farmers",
      "description": "Provides timely credit to farmers for cultivation and other needs.",
      "beneficiaries": "Small and marginal farmers.",
      "benefits": [
        "Loan up to ₹3 lakh at low interest",
        "Insurance coverage for crops"
      ]
    },
    {
      "name": "Ayushman Bharat Pradhan Mantri Jan Arogya Yojana (PM-JAY)",
      "launch_year": 2018,
      "category": "Healthcare",
      "description": "Health insurance scheme providing ₹5 lakh per family per year for secondary and tertiary care hospitalization.",
      "beneficiaries": "Poor and vulnerable families (SECC data).",
      "benefits": [
        "Cashless treatment at empaneled hospitals",
        "Coverage for pre-existing conditions"
      ]
    },
    {
      "name": "National Health Mission (NHM)",
      "launch_year": 2013,
      "category": "Healthcare",
      "description": "Ensures universal access to equitable, affordable, and quality healthcare services.",
      "beneficiaries": "Entire population with focus on rural and vulnerable groups.",
      "benefits": [
        "Strengthened primary health centers",
        "Maternal and child healthcare services"
      ]
    },
    {
      "name": "Janani Suraksha Yojana (JSY)",
      "launch_year": 2005,
      "category": "Healthcare / Women",
      "description": "A safe motherhood intervention to promote institutional delivery among poor pregnant women.",
      "beneficiaries": "Pregnant women from BPL families.",
      "benefits": [
        "Cash incentives for institutional delivery",
        "Free delivery services in government hospitals"
      ]
    },
    {
      "name": "Pradhan Mantri Ujjwala Yojana (PMUY)",
      "launch_year": 2016,
      "category": "Women / Energy",
      "description": "Provides LPG connections to women from BPL households.",
      "beneficiaries": "Women from BPL households.",
      "benefits": [
        "Free LPG connection",
        "Financial assistance of ₹1600",
        "First refill and stove free"
      ]
    },
    {
      "name": "Pradhan Mantri Awas Yojana (PMAY)",
      "launch_year": 2015,
      "category": "Housing",
      "description": "Affordable housing for all by 2022 through financial assistance.",
      "beneficiaries": "EWS, LIG, MIG categories.",
      "benefits": [
        "Interest subsidy on home loans",
        "Financial aid for house construction"
      ]
    },
    {
      "name": "Atal Pension Yojana (APY)",
      "launch_year": 2015,
      "category": "General / Social Security",
      "description": "A pension scheme targeted at unorganized sector workers.",
      "beneficiaries": "Citizens aged 18–40 years.",
      "benefits": [
        "Guaranteed minimum pension ₹1,000–₹5,000",
        "Government co-contribution"
      ]
    },
    {
      "name": "Pradhan Mantri Jan Dhan Yojana (PMJDY)",
      "launch_year": 2014,
      "category": "Financial Inclusion",
      "description": "Ensures access to banking and financial services for all households.",
      "beneficiaries": "Unbanked population.",
      "benefits": [
        "Zero balance savings account",
        "RuPay debit card with insurance",
        "Overdraft facility up to ₹10,000"
      ]
    },
    {
      "name": "Digital India Programme",
      "launch_year": 2015,
      "category": "General / Digital",
      "description": "Transform India into a digitally empowered society and knowledge economy.",
      "beneficiaries": "Citizens, businesses, and government services.",
      "benefits": [
        "Digital infrastructure",
        "E-Governance",
        "Digital literacy"
      ]
    },
    {
      "name": "Skill India Mission",
      "launch_year": 2015,
      "category": "Employment / Students",
      "description": "Equips youth with skills to enhance employability.",
      "beneficiaries": "Youth and job seekers.",
      "benefits": [
        "Skill development programs",
        "Certification and placement support"
      ]
    },
    {
      "name": "Startup India Scheme",
      "launch_year": 2016,
      "category": "Entrepreneurship",
      "description": "Promotes entrepreneurship with tax benefits and funding support.",
      "beneficiaries": "Startups and entrepreneurs.",
      "benefits": [
        "Tax holiday for 3 years",
        "₹10,000 crore Fund of Funds",
        "Fast-tracking patent applications"
      ]
    }
    // ---- More schemes (50+) would continue in the same structure ----
];

// API endpoint to get all schemes
app.get('/schemes', (req, res) => {
  res.json({ schemes: schemesData });
});

