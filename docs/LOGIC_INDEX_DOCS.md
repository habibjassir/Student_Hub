# Student Hub — Logic & Server Guide

This file summarizes how the UI logic (`FrontEnd/Logic/logic.js`) and the Express API (`BackEnd/src/index.js`) work together. It also covers the quickest way to run the project locally and how to debug the issues we most often see.

## Frontend logic (`FrontEnd/Logic/logic.js`)

The script runs on every main page (dashboard, FAQ, profile, etc.). Most functions short‑circuit when a required DOM element is missing so that unused features do not crash other pages.

### Layout & shared state
- `sidebarToggle` (click handler) toggles the `sidebar-collapsed` class on `<body>` so navigation can collapse/expand.
- Global caches: `courses` (array from `/courses`) and `VOTES` (object from `/votes`). Both are refreshed on page load before the UI is rendered.
- `LOCAL_VOTE_KEY`, `LOCAL_VOTES`, `loadLocalVotes()`, and `saveLocalVotes()` mirror the vote history inside `localStorage`. They let the browser remember which course IDs were already voted for even after a refresh.
- `USER` holds the placeholder profile data shown on the profile page.

### Course loading & voting workflow
- `fetchVotes()` pulls `/votes`, stores the object in `VOTES`, and falls back to `{}` on network errors.
- `fetchCourses()` requests `/courses`, ensures an array is returned, and sets `courses`. Failure paths log the HTTP status or error and return an empty array.
- `loadTable()` renders the course table into `#tableX` if that container exists. It:
  - Builds the `<table>` markup.
  - Skips records that lack a `name` or `id` (logs how many items were skipped).
  - Shows “No courses available.” when the array is empty.
  - Attaches click listeners to each `.vote-btn`. The listener calls `recordVote(id, 1)`, disables the button while the request is in flight, and refreshes the vote count using `updateVoteDisplay`.
- `updateVoteDisplay(id, count)` simply replaces the text inside `#vote-count-${id}`. It is used both by the button handler and by any future live update mechanisms.
- `recordVote(id, delta = 1)` performs the POST to `/vote` with a JSON body `{ id, delta }`. It returns `{ success, data | error }` so callers can check the success flag without throwing. The function is also exposed globally (`window.recordVote`) for inline handlers.
- `window.addEventListener('load', ...)` ensures votes and courses are fetched before `loadTable()` runs, and that `profileLoader()` is only called if the profile section exists.

### Client-side one-vote limit
- `hasLocalVote(id)` and `markLocalVote(id)` consult and update `LOCAL_VOTES`. They provide a simple “already voted” check without needing authentication.
- During table rendering every `.vote-btn` is disabled up front when `hasLocalVote()` returns `true`, so a refreshed page still shows the lockout.
- When a button is clicked the handler exits early with an alert if `hasLocalVote()` is true, otherwise it proceeds to `recordVote()`. A successful response triggers `markLocalVote(id)` and leaves the button disabled. A failed response re-enables the button so the user can retry.

### Search, profile, and footer helpers
- `searchFunction()` reads `#searchInput`, walks `.courses` cells, and hides rows whose names do not contain the typed text. When zero rows match it appends a `.no-results-row` `<tr>` that spans the columns and shows “No courses found,” and removes the row again as soon as a course matches. The click handler is only registered when both the input and button exist.
- `profileLoader()` fills `#profile-section` with the mock `USER` data. It logs an error if the section is missing (e.g., you opened the dashboard page).
- Footer interactions (credit @Aysha):
  - `footerLinks` and `panels` map the three footer buttons to their content panels (`#faq-panel`, `#support-panel`, `#contact-panel`). `hideAllPanels()` collapses them, and each click event shows the requested panel and scrolls to it.
  - `supportEmailBtn` opens the default mail client with a prefilled subject.
  - `contactForm` submission is intercepted to avoid a full refresh, show the “sent” message (`#contactSuccess`), and reset the form.

### Future implementations — course filters
- The interface includes filter controls that will narrow down the table without altering the server payload. `logic.js` now documents a `filterCourses()` helper (currently commented out under “Future implementations”) that demonstrates how to take the cached `courses`, apply field/term filtering, and feed the result back into `loadTable()`. Use that block as the reference when wiring the filter buttons/selects so that the filtered list drives what the table renders.

## Backend server (`BackEnd/src/index.js`)

The backend is a small Express server that serves the frontend files and exposes three JSON endpoints plus one placeholder route.

### Data files
- `BackEnd/src/database.json`: array of course objects `{ id, name, status, ... }`.
- `BackEnd/src/votes.json`: map whose keys match course `id` values and whose values are vote counts.
Both files are read synchronously for simplicity. A missing or blank file is treated as empty data.

### Middleware and static hosting
- `express.json()` populates `req.body`.
- Manual CORS headers allow simple cross‑origin tests (file:// or alternate ports).
- `express.static(FRONTEND_DIR)` exposes the entire `FrontEnd` folder so opening `http://localhost:3000/index.html` serves the UI straight from the backend.
- `/login` currently returns `{ message: 'login placeholder' }`. No authentication yet.

### API endpoints
- `POST /vote`
  - Body: `{ id: string, delta: number }`. Delta is usually `1`, but negatives are accepted for downvotes.
  - Validates the payload and rejects missing fields with HTTP 400.
  - Reads `votes.json`, increments the vote count for the matching `id`, persists the file, and returns `{ id, votes: updatedCount }`.
- `GET /votes`
  - Returns the parsed contents of `votes.json`, or `{}` when the file is missing/blank.
  - Any file read error is logged and reported with HTTP 500.
- `GET /courses`
  - Returns the parsed contents of `database.json`, or `[]` when the file is missing/blank.
- Server start
  - Listening on port `3000` with a log line: `Server is running @Port 3000`.

## Running Student Hub locally
1. Install dependencies and start the API/server:
   ```bash
   cd BackEnd
   npm install
   npm start
   ```
2. Once you see “Server is running @Port 3000”, open a browser to `http://localhost:3000/index.html`. The static middleware serves every file under `FrontEnd`, so `dashboard.html`, `profile.html`, etc. work by replacing the filename in the URL.
3. To develop without restarting the server, edit the JSON data or frontend files and refresh the browser. The backend reads fresh copies of the JSON files on every request, so no restart is needed unless you change server code.

## Troubleshooting & general bug playbook
- **No courses are listed**  
  Confirm `BackEnd/src/database.json` is valid JSON and contains an array with `id` and `name`. Hit `http://localhost:3000/courses` in the browser or with `curl`—if that endpoint fails, the issue is on the server side.
- **Votes never change**  
  Make sure the course `id` in `database.json` exactly matches the ID rendered in the DOM (seen in the button’s `data-id`). Also verify `BackEnd/src/votes.json` is writable; delete the file if it becomes corrupted and the server will recreate it.
- **Buttons or searches throw errors on certain pages**  
  The logic guards against missing DOM nodes, but if you add new markup ensure the IDs (`sidebarToggle`, `tableX`, `searchInput`, etc.) stay consistent. Open DevTools → Console to check for “Not Found” messages coming from the script.
- **Server start failures**  
  Port conflicts and missing packages are the usual culprits. Stop any process already using port 3000 and rerun `npm install` if modules cannot be resolved.
- **General debugging tips**
  1. Check browser DevTools → Network tab to see whether `/courses`, `/votes`, and `/vote` succeed and what payloads come back.
  2. Tail the server output in the terminal; read/write errors for the JSON files are logged with the exact file path.
  3. Validate JSON files with an online formatter or `node -e "JSON.parse(fs.readFileSync('path'))"` if you suspect trailing commas or syntax issues.

Keeping this workflow in mind ensures the frontend (`logic.js`) and backend (`index.js`) stay in sync and makes it straightforward to explain the behavior to teammates or debug issues in the future.
