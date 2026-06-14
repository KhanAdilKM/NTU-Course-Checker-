const express = require("express");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

const URL =
  "https://wis.ntu.edu.sg/webexe/owa/adm_appl.relevant_diploma?student_type=F";

app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

let cachedData = null;
let lastFetch = 0;
const CACHE_DURATION = 10 * 60 * 1000;

app.get("/api/diplomas", async (req, res) => {
  try {
    const now = Date.now();

    if (cachedData && now - lastFetch < CACHE_DURATION) {
      return res.json(cachedData);
    }

    console.log("Scraping NTU...");

    const response = await axios.get(URL, {
      headers: { "User-Agent": "Mozilla/5.0" },
      timeout: 15000,
    });

    const html = response.data;
    response.data = null;

    const map = {};
    const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    const tagRegex = /<[^>]+>/g;

    let rowMatch;
    while ((rowMatch = rowRegex.exec(html)) !== null) {
      const rowHtml = rowMatch[1];
      const cells = [];
      let cellMatch;
      cellRegex.lastIndex = 0;
      while ((cellMatch = cellRegex.exec(rowHtml)) !== null) {
        cells.push(cellMatch[1].replace(tagRegex, "").trim());
      }

      if (cells.length >= 3) {
        const institute = cells[0];
        const diploma = cells[1];
        const course = cells[2];

        if (!institute || !diploma) continue;

        const key = institute + "|" + diploma;

        if (!map[key]) {
          map[key] = { institute, diploma, courses: [] };
        }

        if (course && !map[key].courses.includes(course)) {
          map[key].courses.push(course);
        }

        map[key].count = map[key].courses.length;
      }
    }

    const result = Object.values(map);
    cachedData = result;
    lastFetch = now;

    res.json(result);
  } catch (err) {
    console.error("API Error:", err.message);
    res.status(500).json({ error: "Scraping failed", message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});