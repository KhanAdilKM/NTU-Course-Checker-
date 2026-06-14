const container = document.getElementById("dataContainer")
const loading = document.getElementById("loading")
const instituteNav = document.getElementById("instituteNav")

let allData = []

async function loadData(){

loading.style.display="flex"

const response = await fetch("/api/diplomas")

allData = await response.json()

populateNav()

displayData()

loading.style.display="none"

}

function populateNav(){

const institutes = [...new Set(allData.map(d=>d.institute))]

instituteNav.innerHTML=""

institutes.forEach(inst=>{

const btn=document.createElement("button")

btn.textContent=inst

btn.className="institute-btn"

btn.onclick=()=>displayData(inst)

instituteNav.appendChild(btn)

})

}

function displayData(selectedInstitute=null){

container.innerHTML=""

let filtered = selectedInstitute
? allData.filter(d=>d.institute===selectedInstitute)
: allData

const grouped={}

filtered.forEach(d=>{

if(!grouped[d.institute]) grouped[d.institute]=[]

grouped[d.institute].push(d)

})

for(const inst in grouped){

const section=document.createElement("div")

section.className="programme-section"

const header=document.createElement("h2")

header.textContent=inst

section.appendChild(header)

const diplomas=grouped[inst].sort((a,b)=>a.diploma.localeCompare(b.diploma))

const alpha={}

diplomas.forEach(d=>{

const letter=d.diploma.charAt(0).toUpperCase()

if(!alpha[letter]) alpha[letter]=[]

alpha[letter].push(d)

})

Object.keys(alpha).sort().forEach(letter=>{

const h=document.createElement("h3")

h.textContent=letter

section.appendChild(h)

alpha[letter].forEach(d=>{

const card=document.createElement("div")

card.className="diploma-card"

card.innerHTML=`
<strong>${d.diploma}</strong>
<span>Courses: ${d.count}</span>
<div class="card-controls">
<input class="card-course-search" placeholder="Search courses">
<button class="view-btn">View Courses</button>
</div>
<ul class="course-list" style="display:none;"></ul>
`

const ul=card.querySelector(".course-list")

const btn=card.querySelector(".view-btn")

const search=card.querySelector(".card-course-search")

btn.onclick=()=>{

if(ul.style.display==="none"){

const courses = search.value
? d.courses.filter(c=>c.toLowerCase().startsWith(search.value.toLowerCase()))
: d.courses

ul.innerHTML=courses.map(c=>`<li>${c}</li>`).join("")

ul.style.display="grid"

btn.textContent="Hide Courses"

}

else{

ul.style.display="none"

btn.textContent="View Courses"

}

}

search.oninput=()=>{

if(ul.style.display!=="none"){

const courses = search.value
? d.courses.filter(c=>c.toLowerCase().startsWith(search.value.toLowerCase()))
: d.courses

ul.innerHTML=courses.map(c=>`<li>${c}</li>`).join("")

}

}

section.appendChild(card)

})

})

container.appendChild(section)

}

}

loadData()

/* STAR BACKGROUND */

const canvas=document.getElementById("starCanvas")

const ctx=canvas.getContext("2d")

let stars=[]

function resize(){

canvas.width=window.innerWidth

canvas.height=window.innerHeight

stars=Array.from({length:150},()=>({

x:Math.random()*canvas.width,
y:Math.random()*canvas.height,
r:Math.random()*1.5

}))

}

resize()

window.addEventListener("resize",resize)

let mouse={x:0,y:0}

window.addEventListener("mousemove",e=>{

mouse.x=e.clientX
mouse.y=e.clientY

})

function animate(){

ctx.clearRect(0,0,canvas.width,canvas.height)

stars.forEach(s=>{

const dist=Math.hypot(mouse.x-s.x,mouse.y-s.y)

const glow=dist<120 ? 3*(1-(dist/120)) : 0

ctx.beginPath()

ctx.arc(s.x,s.y,s.r+glow,0,Math.PI*2)

ctx.fillStyle="#00bfff"

ctx.fill()

})

requestAnimationFrame(animate)

}

animate()