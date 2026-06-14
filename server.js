const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const app = express();
const PORT = process.env.PORT || 3000;

const URL = "https://wis.ntu.edu.sg/webexe/owa/adm_appl.relevant_diploma?student_type=F";

app.use(express.static("public"));
app.get("/", (req, res) => {
    res.send("NTU Course Checker API is running 🚀");
});
app.get("/api/diplomas", async (req, res) => {
    try {
        const response = await axios.get(URL, {
            headers: { "User-Agent": "Mozilla/5.0" }
        });

        const $ = cheerio.load(response.data);
        const diplomasMap = {};

        $("table tr").each((i, row) => {
            const cols = $(row).find("td");

            if (cols.length >= 3) {
                const institute = $(cols[0]).text().trim();
                const diplomaName = $(cols[1]).text().trim();

                if (!institute || !diplomaName) return;

                const courseText = $(cols[2]).clone().children().remove().end().text().trim();
                const courseName = courseText;

                const key = institute + "|" + diplomaName;

                if (!diplomasMap[key]) {
                    diplomasMap[key] = {
                        institute,
                        diploma: diplomaName,
                        courses: []
                    };
                }

                if (courseName && !diplomasMap[key].courses.includes(courseName)) {
                    diplomasMap[key].courses.push(courseName);
                }

                // Update count dynamically
                diplomasMap[key].count = diplomasMap[key].courses.length;
            }
        });

        const results = Object.values(diplomasMap);
        res.json(results);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Scraping failed" });
    }
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));