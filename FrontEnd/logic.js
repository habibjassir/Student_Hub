/* 

VERSION 1.0.0 Student Hub Logic

AUTHOR:
- Habib Jassir

Here you will found the following logic components:
- Sidebar Animations
- HTML Table component generating funciton, loadTable()
- search bar functionalities, searchFunction
*/

/* -------------------------------------------------
     Sidebar toggle - @Habib 
----------------------------------------------------*/
const sidebarToggle = document.getElementById("sidebarToggle");

/* Here the if statement is checking if the element id = "sidebarToggle." - @Habib */
if (sidebarToggle) {
  sidebarToggle.addEventListener("click", () => {
    /*If the body doesnt have the class -> add it
     If the body already has the class -> remove it - @Habib */
    document.body.classList.toggle("sidebar-collapsed");
  });
}

// Courses will be loaded from the backend
let courses = [];

// Votes cache (populated from backend)
let VOTES = {};

// NOTE: Using server-provided `id` field for each course. Removed courseId().

const USER = 
  {
  name: "Habib Jassir", 
  studentId: "10133785", 
  program: "Computer Science Diploma"
}

/* Generating HTML directly in JS to make the Course table dynamic -@Habib */
function loadTable() {
const tableContainer = document.getElementById("tableX");
if (!tableContainer) {
  //not ons the course page, skip
  return
}

  let html = `
    <table id="table">
    <thead>
      <tr>
        <th>Course Name</th>
        <th>Status</th>
        <th>Votes</th>
      </tr>
    </thead>
    <tbody> 
    `;
    if (!courses || courses.length === 0) {
      html += `
        <tr><td colspan="3">No courses available.</td></tr>
      `;
    } else {
      let skipped = 0;
      for (let num of courses) {
        if (!num || !num.name) continue; // skip malformed entries
        // Require server-provided id. If absent, skip the course and count it.
        const cid = num.id;
        if (!cid) { skipped++; continue; }
        html += `
        <tr>
            <td class ="courses" >${num.name}</td>
            <td class ="status" >${num.status || ''}</td>
            <td class="votes-cell">
               <button class="vote-btn" data-id="${cid}">▲</button>
               <span id="vote-count-${cid}">${VOTES[cid] || 0}</span>
            </td>
        </tr>
        `;
      }
      if (skipped > 0) console.warn('loadTable: skipped', skipped, 'courses with no id');
    }

  html += `
        </tbody>
        </table>
    `;

  tableContainer.innerHTML = html;

  // Attach click handlers for vote buttons
  const buttons = tableContainer.querySelectorAll('.vote-btn');
  buttons.forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const id = btn.dataset.id;
      btn.disabled = true;
      const result = await recordVote(id, 1);
      btn.disabled = false;
      if (result && result.success && result.data && typeof result.data.votes !== 'undefined') {
        VOTES[id] = result.data.votes;
        updateVoteDisplay(id, VOTES[id]);
      } else {
        console.error('Vote failed', result && result.error ? result.error : result);
      }
    });
  });
}

function updateVoteDisplay(id, count) {
  const el = document.getElementById(`vote-count-${id}`);
  if (el) el.textContent = String(count);
}

async function fetchVotes() {
  try {
    const resp = await fetch('/votes');
    if (!resp.ok) return {};
    const data = await resp.json();
    VOTES = data || {};
    return VOTES;
  } catch (err) {
    console.error('Failed to fetch votes', err);
    VOTES = {};
    return VOTES;
  }
}

// Fetch courses from backend
async function fetchCourses() {
  try {
    const resp = await fetch('/courses');
    if (!resp.ok) {
      console.error('fetchCourses: server returned', resp.status, resp.statusText);
      courses = [];
      return courses;
    }
    const data = await resp.json();
    // Expecting an array of objects with at least `name` and `status` and `id`
    courses = Array.isArray(data) ? data : [];
    console.log('fetchCourses: loaded', courses.length, 'courses');
    return courses;
  } catch (err) {
    console.error('Failed to fetch courses', err);
    courses = [];
    return courses;
  }
}

// get IDs from HTM elements - @Habib
const input = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const profileSection = document.getElementById("profile-section");


/* Basic debugging to check if we are taking the 
correct HTML elements - @Habib */

console.log("input:", input);
console.log("searchBtn:", searchBtn);

if (!input || !searchBtn) {
  console.error("Input or Button Not Found");
}

//SearchBar function logic - @Habib
function searchFunction() {
  const filter = input.value.toLowerCase();

  // get courses - @Habib
  const table = document.getElementById("table");
  if (!table) {
    console.error("Table Not Found");
  }

  const items = table.querySelectorAll(".courses");

  // loop thorugh all course cells - @Habib
  for (let i = 0; i < items.length; i++) {
    // get elements of the cells - @Habib
    let textVal = items[i].textContent || items[i].innerText;

    //item in the list? @Habib
    if (textVal.toLowerCase().includes(filter)) {
      //true, then shwo the whole row - @Habib
      items[i].parentElement.style.display = "";
    } else {
      //false, then hdie the whole row - @Habib
      items[i].parentElement.style.display = "none";
    }
  }
}


/* Event to activate search function.
  If condition to make sure that searchBtn function is not null.
  If NULL, JS is nost crashing, program continues - @Habib
  */

if (searchBtn) {
  searchBtn.addEventListener("click", searchFunction);
}  

/* --------------------------------------
  
PROFILE LOGIC 
  
----------------------------------------*/

function profileLoader() {
if (!profileSection) {
  console.error("profile section not found");
  return;
}

  const html = `
  <p> Name: <span id="studentName">${USER.name}</span></p>
  <p> Student ID: <span id="studentId">${USER.studentId}</span></p>
  <p> Program: <span id="program">${USER.program}</span></p>
`;


  profileSection.innerHTML = html;
}

window.addEventListener("load", async () => {
  await fetchVotes();
  await fetchCourses();
  loadTable();            // only does something on index.html
  if (profileSection) {   // only does something on profile.html
    profileLoader();
  }
});

/*
  Voting helper
  - Call `recordVote(id)` from an onclick or event handler.
  - Example: <button onclick="recordVote('CPSC-101')">Upvote</button>
  - Sends POST to backend at http://localhost:3000/vote with body { id, delta }
*/
async function recordVote(id, delta = 1) {
  if (!id) throw new Error('recordVote requires an id');

  try {
    const resp = await fetch('/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, delta })
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ error: 'Unknown error' }));
      console.error('Vote failed', err);
      return { success: false, error: err };
    }

    const data = await resp.json();
    // return the updated vote count
    return { success: true, data };
  } catch (err) {
    console.error('recordVote error', err);
    return { success: false, error: err };
  }
}

// Expose for usage in inline handlers or other modules
window.recordVote = recordVote;

