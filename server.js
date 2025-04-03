const express = require("express");
const db = require("./db");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const session = require("express-session");

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
app.use(session({
    secret: "swipswap_secret", // Replace with a secure secret in production
    resave: false,
    saveUninitialized: true,
}));

app.use((req, res, next) => {
    if (req.path === "/upload.html" && !req.session.userId) {
        return res.redirect("/login.html");
    }
    next();
});

app.use((req, res, next) => {
    if ((req.path === "/login.html" || req.path === "/register.html") && req.session.userId) {
        return res.redirect("/index.html");
    }
    next();
});

// User registration
app.post("/api/register", (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
    }

    db.run("INSERT INTO users (username, password, karma) VALUES (?, ?, 1200)", [username, password], function (err) {
        if (err) {
            return res.status(500).json({ error: "Username already exists" });
        }
        res.json({ message: "Registration successful" });
    });
});

// User login
app.post("/api/login", (req, res) => {
    const { username, password } = req.body;

    db.get("SELECT * FROM users WHERE username = ? AND password = ?", [username, password], (err, user) => {
        if (err || !user) {
            return res.status(401).json({ error: "Invalid username or password" });
        }
        req.session.userId = user.id;
        res.json({ message: "Login successful" });
    });
});

// User logout
app.post("/api/logout", (req, res) => {
    req.session.destroy();
    res.json({ message: "Logout successful" });
});

// Middleware to check authentication
function isAuthenticated(req, res, next) {
    if (req.session.userId) {
        return next();
    }
    res.status(401).json({ error: "Unauthorized" });
}

app.get("/api/offers", (req, res) => {
    db.all(`
        SELECT o.*, u.karma 
        FROM swap_offers o 
        JOIN users u ON o.user = u.username
    `, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });

        const loggedInUsername = req.session.userId
            ? db.get("SELECT username FROM users WHERE id = ?", [req.session.userId], (err, user) => {
                  return user ? user.username : null;
              })
            : null;

        res.json(
            rows.map((offer) => ({
                ...offer,
                isOwner: loggedInUsername === offer.user,
            }))
        );
    });
});

// Restrict offer creation and deletion to authenticated users
app.post("/api/offers", isAuthenticated, upload.array("images", 5), (req, res) => {
    const { title, description } = req.body;

    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: "No images uploaded" });
    }

    const images = req.files.map((file) => `/uploads/${file.filename}`).join(",");

    // Fetch the logged-in user's username
    db.get("SELECT username FROM users WHERE id = ?", [req.session.userId], (err, user) => {
        if (err || !user) {
            return res.status(500).json({ error: "Failed to retrieve user information" });
        }

        const username = user.username;

        // Insert the swap offer into the database
        db.run(
            "INSERT INTO swap_offers (title, description, image, user) VALUES (?, ?, ?, ?)",
            [title, description, images, username],
            function (err) {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }
                res.json({ id: this.lastID });
            }
        );
    });
});

app.delete("/api/offers/:id", isAuthenticated, (req, res) => {
    const offerId = req.params.id;

    // Fetch the logged-in user's username and admin status
    db.get("SELECT username, isAdmin FROM users WHERE id = ?", [req.session.userId], (err, user) => {
        if (err || !user) {
            return res.status(500).json({ error: "Failed to retrieve user information" });
        }

        const { username, isAdmin } = user;

        // Fetch the images associated with the swap offer
        db.get("SELECT image FROM swap_offers WHERE id = ?", [offerId], (err, offer) => {
            if (err || !offer) {
                return res.status(404).json({ error: "Offer not found" });
            }

            const images = offer.image.split(","); // Split the image paths into an array

            // If the user is an admin, allow them to delete any offer
            if (isAdmin) {
                db.run("DELETE FROM swap_offers WHERE id = ?", [offerId], function (err) {
                    if (err || this.changes === 0) {
                        return res.status(403).json({ error: "Offer not found" });
                    }

                    // Delete the image files
                    images.forEach((imagePath) => {
                        const fullPath = path.join(__dirname, "public", imagePath);
                        fs.unlink(fullPath, (err) => {
                            if (err) console.error(`Failed to delete image: ${fullPath}`, err);
                        });
                    });

                    res.json({ message: "Offer deleted by admin" });
                });
            } else {
                // Otherwise, only allow the owner to delete their own offer
                db.run("DELETE FROM swap_offers WHERE id = ? AND user = ?", [offerId, username], function (err) {
                    if (err || this.changes === 0) {
                        return res.status(403).json({ error: "Unauthorized or offer not found" });
                    }

                    // Delete the image files
                    images.forEach((imagePath) => {
                        const fullPath = path.join(__dirname, "public", imagePath);
                        fs.unlink(fullPath, (err) => {
                            if (err) console.error(`Failed to delete image: ${fullPath}`, err);
                        });
                    });

                    res.json({ message: "Offer deleted" });
                });
            }
        });
    });
});

app.delete("/api/delete-account", isAuthenticated, (req, res) => {
    db.run("DELETE FROM users WHERE id = ?", [req.session.userId], function (err) {
        if (err) {
            return res.status(500).json({ error: "Failed to delete account" });
        }
        req.session.destroy();
        res.json({ message: "Account deleted" });
    });
});

app.delete("/api/users/:id", isAuthenticated, (req, res) => {
    const userId = req.params.id;

    db.get("SELECT isAdmin FROM users WHERE id = ?", [req.session.userId], (err, user) => {
        if (err || !user || !user.isAdmin) {
            return res.status(403).json({ error: "Unauthorized" });
        }

        db.run("DELETE FROM users WHERE id = ?", [userId], function (err) {
            if (err || this.changes === 0) {
                return res.status(500).json({ error: "Failed to delete user" });
            }
            res.json({ message: "User deleted successfully" });
        });
    });
});

app.get("/api/session", (req, res) => {
    if (req.session.userId) {
        db.get("SELECT username, isAdmin, karma FROM users WHERE id = ?", [req.session.userId], (err, user) => {
            if (err || !user) {
                return res.json({ loggedIn: false });
            }
            res.json({ loggedIn: true, username: user.username, isAdmin: user.isAdmin, karma: user.karma });
        });
    } else {
        res.json({ loggedIn: false });
    }
});

app.get("/api/users", isAuthenticated, (req, res) => {
    db.get("SELECT isAdmin FROM users WHERE id = ?", [req.session.userId], (err, user) => {
        if (err || !user || !user.isAdmin) {
            return res.status(403).json({ error: "Unauthorized" });
        }

        db.all("SELECT id, username, karma, isAdmin FROM users", (err, users) => {
            if (err) {
                return res.status(500).json({ error: "Failed to fetch users" });
            }
            res.json(users);
        });
    });
});

app.post("/api/users/:id/karma", isAuthenticated, (req, res) => {
    const { amount } = req.body;
    const userId = req.params.id;

    db.get("SELECT isAdmin FROM users WHERE id = ?", [req.session.userId], (err, user) => {
        if (err || !user || !user.isAdmin) {
            return res.status(403).json({ error: "Unauthorized" });
        }

        db.run("UPDATE users SET karma = karma + ? WHERE id = ?", [amount, userId], function (err) {
            if (err || this.changes === 0) {
                return res.status(500).json({ error: "Failed to update karma" });
            }
            res.json({ message: "Karma updated successfully" });
        });
    });
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));