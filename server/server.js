const express = require("express");
const connectDB = require("./config/db");
const { errorHandler, notFoundHandler } = require("./middlewares/errorHandler");
const cors = require("cors");
const path = require("path");
const session = require("express-session");
const passport = require("passport");
const User = require("./models/User");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
require("dotenv").config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: "http://127.0.0.1:5500",
  credentials: true,
}));
app.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: true,
  })
);

// Serve static files from the client directory
app.use(express.static(path.join(__dirname, "../client")));
app.use(passport.initialize());
app.use(passport.session());

// Kết nối database
connectDB();

// Configure Passport for Google OAuth
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:5000/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Find or create user
        let user = await User.findOne({ googleId: profile.id });
        if (!user) {
          user = new User({
            username: profile.displayName,
            email: profile.emails[0].value,
            googleId: profile.id,
            role: "guest",
          });
          await user.save();
        }
        done(null, user);
      } catch (error) {
        done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/article", require("./routes/article"));
app.use("/api/categories", require("./routes/category"));
app.use("/api/comments", require("./routes/comments"));
app.use("/api/tags", require("./routes/tag"));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/admin', require('./routes/admin'));

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));