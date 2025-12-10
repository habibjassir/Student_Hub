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

// Courses will be loaded from the backend - @Habib
let courses = [];

// Votes cache (updated from backend) - @Habib
let VOTES = {};

// Track which courses were voted for on this device via localStorage - @Habib
const LOCAL_VOTE_KEY = "studentHubVotes";
let LOCAL_VOTES = loadLocalVotes();

function loadLocalVotes() {
  if (typeof window === "undefined" || !window.localStorage) return {};
  try {
    const raw = window.localStorage.getItem(LOCAL_VOTE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (err) {
    console.warn("loadLocalVotes failed", err);
    return {};
  }
}

function saveLocalVotes() {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.setItem(LOCAL_VOTE_KEY, JSON.stringify(LOCAL_VOTES));
  } catch (err) {
    console.warn("saveLocalVotes failed", err);
  }
}

function hasLocalVote(id) {
  return Boolean(id && LOCAL_VOTES[id]);
}

function markLocalVote(id) {
  if (!id) return;
  LOCAL_VOTES[id] = true;
  saveLocalVotes();
}

//  Mock User profile data - @Habib
const USER = 
  {
  name: "Habib Jassir", 
  studentId: "10133785", 
  program: "Computer Science Diploma"
}

// Generating HTML directly in JS to make the Course table dynamic -@Habib
function loadTable() {
const tableContainer = document.getElementById("tableX");
if (!tableContainer) {
  //not on the course page? Skip - @Habib
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
        if (!num || !num.name) {
          continue; // skip malformed entries
        }
        // Require server-provided id. If absent, skip the course and count it.
        const cid = num.id;
        if (!cid) { 
          skipped++; 
          continue; 
        }
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
    if (hasLocalVote(btn.dataset.id)) {
      btn.disabled = true; // already voted once on this device
    }
    btn.addEventListener('click', async (e) => {
      const id = btn.dataset.id;
      if (hasLocalVote(id)) {
        alert('You already voted for this course on this device.');
        return;
      }
      btn.disabled = true;
      const result = await recordVote(id, 1);
      if (result && result.success && result.data && typeof result.data.votes !== 'undefined') {
        VOTES[id] = result.data.votes;
        updateVoteDisplay(id, VOTES[id]);
        markLocalVote(id);
        btn.disabled = true; // keep disabled after successful vote
      } else {
        console.error('Vote failed', result && result.error ? result.error : result);
        btn.disabled = false; // allow retry if backend failed
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
    return;
  }

  const items = table.querySelectorAll(".courses");
  const tbody = table.querySelector("tbody");
  let matches = 0;

  // loop thorugh all course cells - @Habib
  for (let i = 0; i < items.length; i++) {
    // get elements of the cells - @Habib
    let textVal = items[i].textContent || items[i].innerText;

    //item in the list? @Habib
    if (textVal.toLowerCase().includes(filter)) {
      //true, then shwo the whole row - @Habib
      items[i].parentElement.style.display = "";
      matches++;
    } else {
      //false, then hdie the whole row - @Habib
      items[i].parentElement.style.display = "none";
      
    }
  }

  // Notify user when search returns nothing and prevent JS to crash - @Habib
  const noResultsClass = "no-results-row";
  let noResultsRow = table.querySelector(`.${noResultsClass}`);

  // No match? show a notification message - @Habib
  if (matches === 0) {
    if (!noResultsRow) {
      noResultsRow = document.createElement("tr"); // create new row element - @Habib
      noResultsRow.className = noResultsClass; // style hook to match CSS - @Habib
      const messageCell = document.createElement("td"); // message lives in a cell - @Habib
      const columnCount = table.querySelectorAll("thead th").length || 1; // return all <th> inside <thead>, if falsey return 1 - @Habib
      messageCell.colSpan = columnCount; // ensure message covers entire row - @Habib
      messageCell.textContent = "No courses found"; // friendly placeholder text - @Habib
      noResultsRow.appendChild(messageCell); // attach cell to row - @Habib
    }
    // make sure the row lives inside the current tbody - @Habib
    if (tbody && !tbody.contains(noResultsRow)) {
      tbody.appendChild(noResultsRow);
    }
  // At least one match? remove the placeholder if it exists - @Habib
  } else if (noResultsRow && noResultsRow.parentElement) {
    noResultsRow.parentElement.removeChild(noResultsRow);
  }
}

/* ---------------------- FILTER FUNCITON - @Habib ----------------------
   Future implementations — course filter buttons
   ---------------------------------------------------------------*/
  //  The UI already has placeholder filter controls. When the filter
  //  buttons/selectors are ready we can activate the workflow below.

  //  function filterCourses(filterField = 'all', filterValue = '', term = 'all') {
  //    const normalizedField = (filterField || 'all').toLowerCase();
  //    const normalizedValue = (filterValue || '').trim().toLowerCase();
  //    const normalizedTerm = (term || 'all').toLowerCase();

  //    const filteredCourses = courses.filter((course) => {
  //      const matchesField =
  //        normalizedField === 'all'
  //          ? true
  //          : String(course[normalizedField] || '').toLowerCase().includes(normalizedValue);

  //      const matchesTerm =
  //        normalizedTerm === 'all'
  //          ? true
  //          : String(course.term || '').toLowerCase() === normalizedTerm;

  //      return matchesField && matchesTerm;
  //     });
  //   }
  //   console.log('filterCourses: found', filteredCourses.length, 'matching courses'); // debug

     // Future: update loadTable so it can accept a custom list
     // e.g., loadTable(filteredCourses);
     // For now we would store `filteredCourses` in a new global and let loadTable()
     // read from that source.


   // Example wiring for buttons or selects:
   // const filterButtons = document.querySelectorAll('[data-filter-field]');
   // filterButtons.forEach((btn) => {
   //   btn.addEventListener('click', () => {
   //     filterCourses(btn.dataset.filterField, btn.dataset.filterValue, btn.dataset.term);
   //     loadTable(); // once the filtered list is stored.
   //   });
   // });
/* ------------------------------------------------------------------------------------------------*/


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

// ================= FOOTER LOGIC (FAQ / SUPPORT / CONTACT) - @Aysha =================

// Get all footer buttons (FAQ, Support, Contact) - @Aysha
const footerLinks = document.querySelectorAll(".footer-link");

// Get the 3 panels by their IDs - @Aysha
const panels = {
  faq: document.getElementById("faq-panel"),
  support: document.getElementById("support-panel"),
  contact: document.getElementById("contact-panel")
};

// Small helper: hide all panels - @Aysha
function hideAllPanels() {
  Object.values(panels).forEach((p) => {
    if (p) p.classList.add("hidden");  // add 'hidden' class = display: none
  });
}

// When user clicks a footer button -> show the correct panel - @Aysha
footerLinks.forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault(); // stop default button behavior

    const panelName = link.dataset.panel; // 'faq', 'support', or 'contact'

    hideAllPanels(); // hide all panels first

    const selected = panels[panelName]; // choose the panel from the object
    if (selected) {
      selected.classList.remove("hidden"); // make that panel visible
      selected.scrollIntoView({ behavior: "smooth", block: "start" }); // scroll to it
    }
  });
});

// Support email button -> open default mail client - @Aysha
const supportEmailBtn = document.getElementById("supportEmailBtn");
if (supportEmailBtn) {
  supportEmailBtn.addEventListener("click", () => {
    
    window.location.href =
      "mailto:support@studenthub.fake?subject=Student%20Hub%20Support";
  });
}

// Contact form (just simulating send) - @Aysha
const contactForm    = document.getElementById("contactForm");
const contactSuccess = document.getElementById("contactSuccess");

if (contactForm) {
  contactForm.addEventListener("submit", (e) => {
    e.preventDefault(); // prevent page refresh

    
  

    if (contactSuccess) {
      contactSuccess.classList.remove("hidden"); // show "sent" message
    }
    contactForm.reset(); // clear form inputs
  });
}

//Edit Account Settings Logic - @Sam 

const editBtn = document.getElementById("edit-account-button");
const editSection = document.getElementById("edit-section");
if (editBtn && editSection) {
  editBtn.addEventListener("click", () => {
    if (editSection.style.display === "none" || editSection.style.display === "") {
      editSection.style.display = "block";
      editBtn.textContent = "Close Account Settings";
    } else {
      editSection.style.display = "none";
      editBtn.textContent = "Edit Account Settings";
    }
  });
}
