const express = require("express");
const db = require("./db");
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
        cb(null, Date.now() + "-" + file.originalname);
    },
});

const upload = multer({ storage });

app.use(express.static("public"));
app.use(express.json());

app.get("/api/offers", (req, res) => {
    db.all("SELECT * FROM swap_offers", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post("/api/offers", upload.array("images", 5), (req, res) => {
    const { title, description, user } = req.body;

    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: "No images uploaded" });
    }

    const images = req.files.map((file) => `/uploads/${file.filename}`).join(",");

    db.run(
        "INSERT INTO swap_offers (title, description, image, user) VALUES (?, ?, ?, ?)",
        [title, description, images, user],
        function (err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ id: this.lastID });
        }
    );
});


app.listen(3000, () => console.log("Server running on http://localhost:3000"));