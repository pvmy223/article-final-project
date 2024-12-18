const express = require('express');
const connectDB = require('./config/db');
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Kết nối database
connectDB();

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/article', require('./routes/article'));
app.use('/api/categories', require('./routes/category'));
app.use('/api/comments', require('./routes/comments'));
app.use('/api/search', require('./routes/search'));
app.use('/api/tags', require('./routes/tag'));

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));