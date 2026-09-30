require('dotenv').config();
const fs = require('fs');
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');

const app = express();
app.use(express.json({ limit: '10kb' }));
app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false }));

const registrationSchema = new mongoose.Schema(
  {
    teamName:   { type: String, required: true, maxlength: 80 },
    teamKey:    { type: String, required: true, unique: true }, // lowercase team name, blocks duplicates
    memberName: { type: String, required: true, maxlength: 80 },
    phone:      { type: String, required: true },
    email:      { type: String, required: true, lowercase: true, maxlength: 120 },
    college:    { type: String, required: true, maxlength: 150 },
    course:     { type: String, required: true, maxlength: 100 },
  },
  { timestamps: true }
);
const Registration = mongoose.model('Registration', registrationSchema);

const clean = (v) => String(v ?? '').trim().replace(/\s+/g, ' ');

function validate(body) {
  const data = {
    teamName: clean(body.teamName),
    memberName: clean(body.memberName),
    phone: clean(body.phone).replace(/\D/g, ''),
    email: clean(body.email).toLowerCase(),
    college: clean(body.college),
    course: clean(body.course),
  };
  if (data.phone.length === 12 && data.phone.startsWith('91')) data.phone = data.phone.slice(2);

  const errors = {};
  if (data.teamName.length < 2) errors.teamName = 'Enter your team name.';
  if (data.memberName.length < 2) errors.memberName = 'Enter the member\u2019s full name.';
  if (!/^[6-9]\d{9}$/.test(data.phone)) errors.phone = 'Enter a valid 10-digit mobile number.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email)) errors.email = 'Enter a valid email address.';
  if (data.college.length < 3) errors.college = 'Enter your college name.';
  if (data.course.length < 2) errors.course = 'Enter your course.';
  return { data, errors };
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
