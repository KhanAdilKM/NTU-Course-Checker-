const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const app = express();
const PORT = process.env.PORT || 3000;

const URL =
  "https://wis.ntu.edu.sg/webexe/owa/adm_appl.relevant_diploma?student_type=F";

app.use(express.static("public"));

/* ---------------- HOME ---------------- */
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

/* ---------------- CACHE ---------------- */
let cachedData = null;
let lastFetch = 0;
const CACHE_DURATION = 10 * 60 * 1000; // 10 min

/* ---------------- API ---------------- */
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

    if (!response.data) {
      throw new Error("Empty NTU response");
    }

    const $ = cheerio.load(response.data);
    const map = {};

    $("table tr").each((_, row) => {
      const cols = $(row).find("td");

      if (cols.length >= 3) {
        const institute = $(cols[0]).text().trim();
        const diploma = $(cols[1]).text().trim();
        const course = $(cols[2]).text().trim();

        if (!institute || !diploma) return;

        const key = institute + "|" + diploma;

        if (!map[key]) {
          map[key] = {
            institute,
            diploma,
            courses: [],
          };
        }

        if (course && !map[key].courses.includes(course)) {
          map[key].courses.push(course);
        }

        map[key].count = map[key].courses.length;
      }
    });

    const result = Object.values(map);

    cachedData = result;
    lastFetch = now;

    res.json(result);
  } catch (err) {
    console.error("API Error:", err.message);

    res.status(500).json({
      error: "Scraping failed",
      message: err.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});