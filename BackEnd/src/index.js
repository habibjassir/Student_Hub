const express = require("express");
const fs = require('fs');
const path = require('path');
const server = express();

const DATABASE = path.join(__dirname, "database.json");
const VOTES_DB = path.join(__dirname, "votes.json");

console.log('Database file:', DATABASE);
console.log('Votes file:', VOTES_DB);

server.use(express.json());

// Allow simple CORS so frontend served from file:// or different origin can POST
server.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
});

// Serve frontend static files so UI can be opened from the backend origin
const FRONTEND_DIR = path.join(__dirname, '..', '..', 'FrontEnd');
server.use(express.static(FRONTEND_DIR));
console.log('Serving FrontEnd from', FRONTEND_DIR);

// Basic login placeholder
server.use("/login", function login(request, responses){
     responses.status(200).json({ message: 'login placeholder' });
});

// POST /vote
// body: { id: string, delta: number }  -> delta should be 1 for an upvote (or -1)
server.post('/vote', (req, res) => {
    const { id, delta } = req.body || {};
    if (!id || typeof delta !== 'number') {
        return res.status(400).json({ error: 'Missing id or delta (number) in request body' });
    }

    // Ensure votes file exists
    let votes = {};
    try {
        if (fs.existsSync(VOTES_DB)) {
            const raw = fs.readFileSync(VOTES_DB, 'utf8');
            votes = raw.trim() ? JSON.parse(raw) : {};
        }
    } catch (err) {
        console.error('Error reading votes file:', err);
        return res.status(500).json({ error: 'Failed to read votes DB' });
    }

    // Increment or set vote
    const prev = Number(votes[id] || 0);
    const updated = prev + delta;
    votes[id] = updated;

    try {
        fs.writeFileSync(VOTES_DB, JSON.stringify(votes, null, 2), 'utf8');
    } catch (err) {
        console.error('Error writing votes file:', err);
        return res.status(500).json({ error: 'Failed to write votes DB' });
    }

    return res.json({ id, votes: votes[id] });
});

// GET /votes to return all votes
server.get('/votes', (req, res) => {
    try {
        if (!fs.existsSync(VOTES_DB)) return res.json({});
        const raw = fs.readFileSync(VOTES_DB, 'utf8');
        const votes = raw.trim() ? JSON.parse(raw) : {};
        return res.json(votes);
    } catch (err) {
        console.error('Error reading votes file:', err);
        return res.status(500).json({ error: 'Failed to read votes DB' });
    }
});

// GET /courses - serve the courses database JSON
server.get('/courses', (req, res) => {
    try {
        if (!fs.existsSync(DATABASE)) return res.json([]);
        const raw = fs.readFileSync(DATABASE, 'utf8');
        const courses = raw.trim() ? JSON.parse(raw) : [];
        return res.json(courses);
    } catch (err) {
        console.error('Error reading database file:', err);
        return res.status(500).json({ error: 'Failed to read courses DB' });
    }
});

//Run the server
server.listen(3000, function run(){
        console.log("Server is running @Port 3000");
});

