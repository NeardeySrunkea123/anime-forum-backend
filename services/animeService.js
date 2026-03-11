const { CORE_ANIME_API_BASE_URL } = require('../config/env');

async function getAnimeById(animeId) {
  const response = await fetch(`${CORE_ANIME_API_BASE_URL}/anime/${animeId}`);

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  return data;
}

module.exports = {
  getAnimeById,
};