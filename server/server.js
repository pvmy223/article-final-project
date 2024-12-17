const express = require('express');
const connectDB = require('./config/db');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Kết nối database
connectDB();

// Routes
// app.use('/api/auth', require('./routes/auth'));
// app.use('/api/posts', require('./routes/post'));
// app.use('/api/categories', require('./routes/category'));
// // app.use('/api/tags', require('./routes/tags'));
// // app.use('/api/users', require('./routes/users'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
