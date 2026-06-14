const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const app = express();

// IMPORTANT: Render port fix
const PORT = process.env.PORT || 3000;

const URL =
  "https://wis.ntu.edu.sg/webexe/owa/adm_appl.relevant_diploma?student_type=F";

app.use(express.static("public"));

/* -------------------- HOME ROUTE -------------------- */
app.get("/", (req, res) => {
  res.send("NTU Course Checker API is running 🚀");
});

/* -------------------- CACHE -------------------- */
let cachedData = null;
let lastFetch = 0;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

/* -------------------- API ROUTE -------------------- */
app.get("/api/diplomas", async (req, res) => {
  try {
    const now = Date.now();

    // Return cached data if still fresh
    if (cachedData && now - lastFetch < CACHE_DURATION) {
      return res.json(cachedData);
    }

    console.log("Fetching NTU data...");

    const response = await axios.get(URL, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
      timeout: 10000, // prevent hanging requests
    });

    const $ = cheerio.load(response.data);
    const diplomasMap = {};

    $("table tr").each((i, row) => {
      const cols = $(row).find("td");

      if (cols.length >= 3) {
        const institute = $(cols[0]).text().trim();
        const diplomaName = $(cols[1]).text().trim();
        const courseName = $(cols[2]).text().trim();

        if (!institute || !diplomaName) return;

        const key = institute + "|" + diplomaName;

        if (!diplomasMap[key]) {
          diplomasMap[key] = {
            institute,
            diploma: diplomaName,
            courses: [],
          };
        }

        if (
          courseName &&
          !diplomasMap[key].courses.includes(courseName)
        ) {
          diplomasMap[key].courses.push(courseName);
        }

        diplomasMap[key].count = diplomasMap[key].courses.length;
      }
    });

    const results = Object.values(diplomasMap);

    // Save to cache
    cachedData = results;
    lastFetch = now;

    res.json(results);
  } catch (err) {
    console.error("Scraping error:", err.message);

    res.status(500).json({
      error: "Scraping failed",
      message: err.message,
    });
  }
});

/* -------------------- START SERVER -------------------- */
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});