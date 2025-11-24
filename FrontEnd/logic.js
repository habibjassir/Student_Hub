/* 

VERSION 1.0.0 Student Hub Logic

AUTHOR:
- Habib Jassir

Here you will found the following logic components:
- Sidebar Animations
- HTML Table component generating funciton, loadTable()
- search bar functionalities, searchFunction



*/
// Sidebar toggle - @Habib
const sidebarToggle = document.getElementById("sidebarToggle");

/* Here the if statement is checking if the element id = "sidebarToggle." - @Habib */
if (sidebarToggle) {
  sidebarToggle.addEventListener("click", () => {
    /*If the body doesnt have the class -> add it
     If the body already has the class -> remove it - @Habib */
    document.body.classList.toggle("sidebar-collapsed");
  });
}

//Example for Courses Table content loading-status. - @Habib
const courses = [
  { name: "Example Course 1", status: "Active" },
  { name: "Example Course 2", status: "Completed" }
];

/* Generating HTML directly in JS to make the Course table dynamic -@Habib */
function loadTable() {
  let html = `
    <table id="table">
    <thead>
      <tr>
        <th>Course Name</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody> 
    `;
  for (let num of courses) {
    html += `
        <tr>
            <td class ="courses" >${num.name}</td>
            <td class ="status" >${num.status}</td>
        </tr>
        `;
  }

  html += `
        </tbody>
        </table>
    `;

  document.getElementById("tableX").innerHTML = html;
}

window.addEventListener("load", loadTable); 

// get IDs from HTM elements - @Habib
const input = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");


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

