const container = document.getElementById("dataContainer");
const loading = document.getElementById("loading");
const instituteNav = document.getElementById("instituteNav");

let allData = [];

async function loadData() {
  try {
    loading.style.display = "flex";

    const response = await fetch("/api/diplomas");

    if (!response.ok) {
      throw new Error("API error: " + response.status);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error("Invalid API response");
    }

    allData = data;

    populateNav();
    displayData();

  } catch (err) {
    console.error(err);

    container.innerHTML = `
      <div style="color:red;padding:20px">
        Failed to load data.<br>
        Check server or try again later.
      </div>
    `;

  } finally {
    loading.style.display = "none";
  }
}

/* ---------------- NAV ---------------- */
function populateNav() {
  const institutes = [...new Set(allData.map(d => d.institute))];

  instituteNav.innerHTML = "";

  institutes.forEach(inst => {
    const btn = document.createElement("button");
    btn.textContent = inst;
    btn.className = "institute-btn";
    btn.onclick = () => displayData(inst);
    instituteNav.appendChild(btn);
  });
}

/* ---------------- DISPLAY ---------------- */
function displayData(selectedInstitute = null) {
  container.innerHTML = "";

  let filtered = selectedInstitute
    ? allData.filter(d => d.institute === selectedInstitute)
    : allData;

  const grouped = {};

  filtered.forEach(d => {
    if (!grouped[d.institute]) grouped[d.institute] = [];
    grouped[d.institute].push(d);
  });

  for (const inst in grouped) {
    const section = document.createElement("div");
    section.className = "programme-section";

    const header = document.createElement("h2");
    header.textContent = inst;
    section.appendChild(header);

    const diplomas = grouped[inst].sort((a, b) =>
      a.diploma.localeCompare(b.diploma)
    );

    const alpha = {};

    diplomas.forEach(d => {
      const letter = d.diploma.charAt(0).toUpperCase();
      if (!alpha[letter]) alpha[letter] = [];
      alpha[letter].push(d);
    });

    Object.keys(alpha).sort().forEach(letter => {
      const h = document.createElement("h3");
      h.textContent = letter;
      section.appendChild(h);

      alpha[letter].forEach(d => {
        const card = document.createElement("div");
        card.className = "diploma-card";

        card.innerHTML = `
          <strong>${d.diploma}</strong>
          <span>Courses: ${d.count}</span>
          <div class="card-controls">
            <input class="card-course-search" placeholder="Search courses">
            <button class="view-btn">View Courses</button>
          </div>
          <ul class="course-list" style="display:none;"></ul>
        `;

        const ul = card.querySelector(".course-list");
        const btn = card.querySelector(".view-btn");
        const search = card.querySelector(".card-course-search");

        btn.onclick = () => {
          if (ul.style.display === "none") {
            const courses = search.value
              ? d.courses.filter(c =>
                  c.toLowerCase().includes(search.value.toLowerCase())
                )
              : d.courses;

            ul.innerHTML = courses.map(c => `<li>${c}</li>`).join("");
            ul.style.display = "grid";
            btn.textContent = "Hide Courses";
          } else {
            ul.style.display = "none";
            btn.textContent = "View Courses";
          }
        };

        search.oninput = () => {
          if (ul.style.display !== "none") {
            const courses = search.value
              ? d.courses.filter(c =>
                  c.toLowerCase().includes(search.value.toLowerCase())
                )
              : d.courses;

            ul.innerHTML = courses.map(c => `<li>${c}</li>`).join("");
          }
        };

        section.appendChild(card);
      });
    });

    container.appendChild(section);
  }
}

/* ---------------- START ---------------- */
loadData();