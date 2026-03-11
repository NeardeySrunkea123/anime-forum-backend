const express = require('express');
const router = express.Router();

router.get('/dashboard/anime', async (req, res) => {
  try {
    const response = await fetch("http://localhost:3003/api/anime");
    const result = await response.json();

    if (!result.success) {
      return res.render("anime", { anime: [] });
    }

    res.render("anime", {
      anime: result.data || [],
    });
  } catch (err) {
    console.error("Failed to load anime page:", err);
    res.render("anime", { anime: [] });
  }
  });

module.exports = router;

app.get("/anime", async (req, res) => {
  try {
    const response = await fetch("http://localhost:3003/api/anime");
    const result = await response.json();

    if (!result.success) {
      return res.render("anime", { anime: [] });
    }

    const anime = result.data || [];

    res.render("anime", { anime });
  } catch (err) {
    console.error(err);
    res.render("anime", { anime: [] });
  }
});