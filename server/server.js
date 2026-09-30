require('dotenv').config();
const fs = require('fs');
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const cors = require('cors');

// Team size limits (keep in sync with client/src/components/RegistrationForm.jsx)
const MIN_MEMBERS = 2;
const MAX_MEMBERS = 4;

const app = express();
app.set('trust proxy', 1);
app.use(cors({ origin: (process.env.CLIENT_ORIGIN || '').replace(/\/+$/, '') }));
app.use(express.json({ limit: '20kb' }));
app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false }));

const memberSchema = new mongoose.Schema(
  {
    name:   { type: String, required: true, maxlength: 80 },
    phone:  { type: String, required: true },
    email:  { type: String, required: true, lowercase: true, maxlength: 120 },
    course: { type: String, required: true, maxlength: 100 },
  },
  { _id: false }
);

const registrationSchema = new mongoose.Schema(
  {
    teamName: { type: String, required: true, maxlength: 80 },
    teamKey:  { type: String, required: true, unique: true }, // lowercase team name, blocks duplicates
    college:  { type: String, required: true, maxlength: 150 },
    members:  { type: [memberSchema], validate: (m) => m.length >= MIN_MEMBERS && m.length <= MAX_MEMBERS },
  },
  { timestamps: true }
);
const Registration = mongoose.model('Registration', registrationSchema);

const clean = (v) => String(v ?? '').trim().replace(/\s+/g, ' ');

function validate(body) {
  const errors = {};
  const teamName = clean(body.teamName);
  const college = clean(body.college);
  if (teamName.length < 2) errors.teamName = 'Enter your team name.';
  if (college.length < 3) errors.college = 'Enter your college name.';

  const raw = Array.isArray(body.members) ? body.members : [];
  if (raw.length < MIN_MEMBERS || raw.length > MAX_MEMBERS) {
    errors.members = `A team needs ${MIN_MEMBERS} to ${MAX_MEMBERS} members.`;
  }

  const members = raw.slice(0, MAX_MEMBERS).map((m, i) => {
    m = m || {};
    const member = {
      name: clean(m.name),
      phone: clean(m.phone).replace(/\D/g, ''),
      email: clean(m.email).toLowerCase(),
      course: clean(m.course),
    };
    if (member.phone.length === 12 && member.phone.startsWith('91')) member.phone = member.phone.slice(2);

    if (member.name.length < 2) errors[`members.${i}.name`] = 'Enter the member\u2019s full name.';
    if (!/^[6-9]\d{9}$/.test(member.phone)) errors[`members.${i}.phone`] = 'Enter a valid 10-digit mobile number.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(member.email)) errors[`members.${i}.email`] = 'Enter a valid email address.';
    if (member.course.length < 2) errors[`members.${i}.course`] = 'Enter the course.';
    return member;
  });

  return { data: { teamName, college, members }, errors };
}

app.post('/api/register', async (req, res) => {
  const { data, errors } = validate(req.body || {});
  if (Object.keys(errors).length) {
    return res.status(400).json({ message: 'Please fix the highlighted fields.', errors });
  }
  try {
    const doc = await Registration.create({ ...data, teamKey: data.teamName.toLowerCase() });
    res.status(201).json({ message: 'Team registered.', id: doc._id });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        message: 'That team name is already registered.',
        errors: { teamName: 'This team name is taken. Try another one.' },
      });
    }
    console.error(err);
    res.status(500).json({ message: 'Something went wrong on our side. Please try again.' });
  }
});

// In production, serve the built React app (run "npm run build" inside /client first)
const dist = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

const PORT = process.env.PORT || 5000;
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  });