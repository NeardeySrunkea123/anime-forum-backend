// lib/coreLogger.js
export async function logToCore(userId, action, details = "", subsystem = "movie_forum") {
  try {
    const res = await fetch(`${process.env.CORE_URL}/api/logs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: userId,
        action: action,
        subsystem: subsystem,
        details: details,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Core logging failed:", text);
    }
  } catch (err) {
    console.error("Failed to log to Core:", err);
  }
}