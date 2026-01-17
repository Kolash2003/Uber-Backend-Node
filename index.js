const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// app.use('/api/auth', authRoutes);

app.use((req, res) => {
    res.status(404).json({
        error: 'Not found'
    });
});