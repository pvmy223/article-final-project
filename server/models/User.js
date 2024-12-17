const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['guest', 'subscriber', 'writer', 'editor', 'admin'], default: 'guest' },
    subscriptionExpiresAt: { type: Date } 
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
