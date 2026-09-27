require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const tripRoutes = require('./routes/tripRoutes');
const driverRoutes = require('./routes/driverRoutes');
const userRoutes = require('./routes/userRoutes');
const { notFound, errorHandler } = require('./utils/errors');

const app = express();
app.use(
  cors({
    origin: process.env.FRONTEND_URL || process.env.BETTER_AUTH_URL || 'http://localhost:3000',
    credentials: true,
  })
);
app.use(express.json());

app.get('/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/trip', tripRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/driver', driverRoutes);
app.use('/api', userRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`[uberBackend] listening on http://localhost:${PORT}`);
});