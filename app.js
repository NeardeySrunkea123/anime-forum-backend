import express from "express";
const { PORT } = require('./config/env');
const threadRoutes = require('./routes/threadRoutes');
const errorHandler = require('./middleware/errorHandler');
const express = require('express');
const cors = require('cors');
const animeRoutes = require('./routes/animeRoutes');
// Middleware to parse JSON
app.use(express.json());

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', animeRoutes);
app.use('/api', threadRoutes);
// Home route
app.get("/", (req, res) => {
  res.send("Anime Forum Backend is running!");
});

// Admin route
app.get("/admin", (req, res) => {
  res.send("Welcome to the Admin Dashboard!");
});
app.get("/admin/login", (req, res) => {
    res.render("admin");
  });
  
  // Handle admin login
  app.post("/admin/login", (req, res) => {
    const { email, password } = req.body;
  
    // TEMP logic (replace with DB + hashing)
    if (email === "admin@animeforum.com" && password === "admin123") {
      return res.redirect("/admin");
    }
  
    res.send("Invalid admin credentials");
  });
  let users = [
    { id: 1, username: "naruto", email: "naruto@mail.com", role: "User" },
    { id: 2, username: "admin", email: "admin@mail.com", role: "Admin" },
];
app.get("/dashboard/users", (req, res) => {
    res.render("users", { users });
  });
// Start server
app.listen(PORT, () => {
  console.log(`Forum backend running on http://localhost:${PORT}`);
});


app.use(errorHandler);
