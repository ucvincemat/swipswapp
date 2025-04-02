const express = require("express");
const db = require("./db");
const WebSocket = require("ws");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const uploadDir = path.join(__dirname, "public/uploads");

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
    },
});

const upload = multer({ storage });

app.use(express.static("public"));
app.use(express.json());

app.get("/api/offers", (req, res) => {
    db.all("SELECT * FROM swap_offers", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post("/api/offers", upload.single("image"), (req, res) => {
    const { title, description, user } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : null;

    if (!image) return res.status(400).json({ error: "Image is required." });

    db.run(
        "INSERT INTO swap_offers (title, description, image, user) VALUES (?, ?, ?, ?)",
        [title, description, image, user],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, image });
        }
    );
});

const server = app.listen(3000, () => console.log("Server running on http://localhost:3000"));
const wss = new WebSocket.Server({ server });

wss.on("connection", (ws) => {
    ws.on("message", (message) => {
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    });
});
