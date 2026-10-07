require("dotenv").config();
const express = require("express");
const http = require("http");
const https = require("https");
const cors = require("cors");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;

const app = express();

app.use(cors());
app.use(express.json());

// =========================
// DATABASE CONNECTION
// =========================

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
});

db.connect((err) => {
    if (err) {
        console.log("MySQL connection failed:", err.message);
    } else {
        console.log("MySQL connected successfully!");
    }
});

// =========================
// BASIC ROUTE
// =========================

app.get("/", (req, res) => {
    res.send("okDriver Backend is running!");
});

// =========================
// JWT AUTHENTICATION
// =========================

const authenticateToken = (req, res, next) => {

    const authHeader = req.headers["authorization"];

    const token =
        authHeader && authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({
            error: "Access denied. Please login."
        });
    }

    jwt.verify(
        token,
        JWT_SECRET,
        (err, user) => {

            if (err) {
                return res.status(403).json({
                    error: "Invalid or expired token."
                });
            }

            req.user = user;

            next();
        }
    );
};

// =========================
// ADMIN LOGIN
// =========================

app.post("/api/login", (req, res) => {

    const {
        username,
        password
    } = req.body;

    if (!username || !password) {
        return res.status(400).json({
            error: "Username and password are required"
        });
    }

    const sql = `
        SELECT id, username, password
        FROM admins
        WHERE username = ?
        LIMIT 1
    `;

    db.query(
        sql,
        [username],
        async (err, results) => {

            if (err) {
                console.error(
                    "Login error:",
                    err
                );

                return res.status(500).json({
                    error: "Server error"
                });
            }

            if (results.length === 0) {
                return res.status(401).json({
                    error: "Invalid username or password"
                });
            }

            const admin = results[0];

            try {

                const passwordMatch =
                    await bcrypt.compare(
                        password,
                        admin.password
                    );

                if (!passwordMatch) {
                    return res.status(401).json({
                        error: "Invalid username or password"
                    });
                }

                const token = jwt.sign(
                    {
                        id: admin.id,
                        username: admin.username
                    },
                    JWT_SECRET,
                    {
                        expiresIn: "2h"
                    }
                );

                res.json({
                    message: "Login successful",

                    token: token,

                    admin: {
                        id: admin.id,
                        username: admin.username
                    }
                });

            } catch (error) {

                console.error(
                    "Password comparison error:",
                    error
                );

                res.status(500).json({
                    error: "Server error"
                });
            }
        }
    );
});

// ======================================================
// CAMERA APIs
// ======================================================

// =========================
// GET ALL CAMERAS
// =========================

app.get(
    "/api/cameras",
    authenticateToken,
    (req, res) => {

        const sql =
            "SELECT * FROM cameras";

        db.query(
            sql,
            (err, results) => {

                if (err) {
                    console.error(
                        "Get cameras error:",
                        err
                    );

                    return res.status(500).json({
                        error: "Database error"
                    });
                }

                res.json(results);
            }
        );
    }
);

// =========================
// ADD NEW CAMERA
// =========================

app.post(
    "/api/cameras",
    authenticateToken,
    (req, res) => {

        const {
            camera_id,
            name,
            department,
            latitude,
            longitude,
            camera_type,
            source_protocol,
            stream_url,
            status,
            zone
        } = req.body;

        if (
            !camera_id ||
            !name ||
            !department ||
            !latitude ||
            !longitude
        ) {
            return res.status(400).json({
                error: "Required camera fields are missing"
            });
        }

        const sql = `
            INSERT INTO cameras
            (
                camera_id,
                name,
                department,
                latitude,
                longitude,
                camera_type,
                source_protocol,
                stream_url,
                status,
                zone
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            camera_id,
            name,
            department,
            latitude,
            longitude,
            camera_type,
            source_protocol,
            stream_url,
            status,
            zone
        ];

        db.query(
            sql,
            values,
            (err, result) => {

                if (err) {
                    console.error(
                        "Add camera error:",
                        err
                    );

                    return res.status(500).json({
                        error: err.message
                    });
                }

                res.status(201).json({
                    message:
                        "Camera added successfully",

                    camera_id:
                        camera_id
                });
            }
        );
    }
);

// =========================
// UPDATE CAMERA
// =========================

app.put(
    "/api/cameras/:id",
    authenticateToken,
    (req, res) => {

        const cameraId =
            req.params.id;

        const {
            camera_id,
            name,
            department,
            latitude,
            longitude,
            camera_type,
            source_protocol,
            stream_url,
            status,
            zone
        } = req.body;

        const sql = `
            UPDATE cameras
            SET
                camera_id = ?,
                name = ?,
                department = ?,
                latitude = ?,
                longitude = ?,
                camera_type = ?,
                source_protocol = ?,
                stream_url = ?,
                status = ?,
                zone = ?
            WHERE id = ?
        `;

        const values = [
            camera_id,
            name,
            department,
            latitude,
            longitude,
            camera_type,
            source_protocol,
            stream_url,
            status,
            zone,
            cameraId
        ];

        db.query(
            sql,
            values,
            (err, result) => {

                if (err) {
                    console.error(
                        "Update camera error:",
                        err
                    );

                    return res.status(500).json({
                        error: err.message
                    });
                }

                if (
                    result.affectedRows === 0
                ) {
                    return res.status(404).json({
                        error:
                            "Camera not found"
                    });
                }

                res.json({
                    message:
                        "Camera updated successfully"
                });
            }
        );
    }
);

// =========================
// DISABLE CAMERA
// =========================

app.put(
    "/api/cameras/:id/disable",
    authenticateToken,
    (req, res) => {

        const cameraId =
            req.params.id;

        const getCameraSql = `
            SELECT
                id,
                name,
                camera_id,
                status
            FROM cameras
            WHERE id = ?
        `;

        db.query(
            getCameraSql,
            [cameraId],
            (err, cameraResults) => {

                if (err) {
                    console.error(
                        "Get camera error:",
                        err
                    );

                    return res.status(500).json({
                        error: err.message
                    });
                }

                if (
                    cameraResults.length === 0
                ) {
                    return res.status(404).json({
                        error:
                            "Camera not found"
                    });
                }

                const camera =
                    cameraResults[0];

                // Already offline
                if (
                    camera.status === "OFFLINE"
                ) {
                    return res.json({
                        message:
                            "Camera is already offline"
                    });
                }

                const updateCameraSql = `
                    UPDATE cameras
                    SET status = 'OFFLINE'
                    WHERE id = ?
                `;

                db.query(
                    updateCameraSql,
                    [cameraId],
                    (err) => {

                        if (err) {
                            console.error(
                                "Disable camera error:",
                                err
                            );

                            return res.status(500).json({
                                error: err.message
                            });
                        }

                        const alertSql = `
                            INSERT INTO alerts
                            (
                                camera_id,
                                alert_type,
                                message
                            )
                            VALUES (?, ?, ?)
                        `;

                        const alertMessage =
                            `${camera.name} (${camera.camera_id}) is OFFLINE`;

                        db.query(
                            alertSql,
                            [
                                camera.id,
                                "OFFLINE",
                                alertMessage
                            ],
                            (err) => {

                                if (err) {
                                    console.error(
                                        "Create alert error:",
                                        err
                                    );

                                    return res.status(500).json({
                                        error:
                                            err.message
                                    });
                                }

                                res.json({
                                    message:
                                        "Camera disabled and alert created successfully"
                                });
                            }
                        );
                    }
                );
            }
        );
    }
);

// =========================
// ENABLE CAMERA
// =========================

app.put(
    "/api/cameras/:id/enable",
    authenticateToken,
    (req, res) => {

        const cameraId =
            req.params.id;

        const sql = `
            UPDATE cameras
            SET status = 'ONLINE'
            WHERE id = ?
        `;

        db.query(
            sql,
            [cameraId],
            (err, result) => {

                if (err) {
                    console.error(
                        "Enable camera error:",
                        err
                    );

                    return res.status(500).json({
                        error: err.message
                    });
                }

                if (
                    result.affectedRows === 0
                ) {
                    return res.status(404).json({
                        error:
                            "Camera not found"
                    });
                }

                res.json({
                    message:
                        "Camera enabled successfully"
                });
            }
        );
    }
);

// ======================================================
// ALERT APIs
// ======================================================

// =========================
// GET ALERTS
// =========================

app.get(
    "/api/alerts",
    authenticateToken,
    (req, res) => {

        const sql = `
            SELECT
                alerts.id,
                alerts.camera_id,
                cameras.camera_id AS camera_code,
                cameras.name AS camera_name,
                alerts.alert_type,
                alerts.message,
                alerts.status,
                alerts.created_at
            FROM alerts
            JOIN cameras
                ON alerts.camera_id = cameras.id
            WHERE cameras.status = 'OFFLINE'
            ORDER BY alerts.created_at DESC
        `;

        db.query(
            sql,
            (err, results) => {

                if (err) {
                    console.error(
                        "Get alerts error:",
                        err
                    );

                    return res.status(500).json({
                        error:
                            "Failed to fetch alerts"
                    });
                }

                res.json(results);
            }
        );
    }
);

// =========================
// CREATE ALERT
// =========================

app.post(
    "/api/alerts",
    authenticateToken,
    (req, res) => {

        const {
            camera_id,
            alert_type,
            message
        } = req.body;

        if (
            !camera_id ||
            !alert_type ||
            !message
        ) {
            return res.status(400).json({
                error:
                    "camera_id, alert_type and message are required"
            });
        }

        const sql = `
            INSERT INTO alerts
            (
                camera_id,
                alert_type,
                message
            )
            VALUES (?, ?, ?)
        `;

        db.query(
            sql,
            [
                camera_id,
                alert_type,
                message
            ],
            (err, result) => {

                if (err) {
                    console.error(
                        "Create alert error:",
                        err
                    );

                    return res.status(500).json({
                        error:
                            "Failed to create alert"
                    });
                }

                res.status(201).json({
                    message:
                        "Alert created successfully",

                    alert_id:
                        result.insertId
                });
            }
        );
    }
);

// =========================
// MARK ALERT AS READ
// =========================

app.put(
    "/api/alerts/:id/read",
    authenticateToken,
    (req, res) => {

        const sql = `
            UPDATE alerts
            SET status = 'READ'
            WHERE id = ?
        `;

        db.query(
            sql,
            [req.params.id],
            (err, result) => {

                if (err) {
                    console.error(
                        "Read alert error:",
                        err
                    );

                    return res.status(500).json({
                        error:
                            "Failed to update alert"
                    });
                }

                if (
                    result.affectedRows === 0
                ) {
                    return res.status(404).json({
                        error:
                            "Alert not found"
                    });
                }

                res.json({
                    message:
                        "Alert marked as read"
                });
            }
        );
    }
);

// ======================================================
// AUTOMATIC CAMERA HEALTH CHECK
// ======================================================

const checkCameraHealth = () => {

    const sql = `
        SELECT
            id,
            camera_id,
            name,
            status,
            stream_url
        FROM cameras
    `;

    db.query(
        sql,
        (err, cameras) => {

            if (err) {
                console.error(
                    "Camera health check error:",
                    err
                );

                return;
            }

            cameras.forEach(
                (camera) => {

                    if (!camera.stream_url) {

                        console.log(
                            `⚠️ ${camera.camera_id} - No stream URL`
                        );

                        return;
                    }

                    console.log(
                        `🔍 Checking ${camera.camera_id}...`
                    );

                    const protocol =
                        camera.stream_url.startsWith(
                            "https://"
                        )
                            ? https
                            : http;

                    const request =
                        protocol.get(
                            camera.stream_url,
                            (response) => {

                                if (
                                    response.statusCode >= 200 &&
                                    response.statusCode < 400
                                ) {

                                    console.log(
                                        `🟢 ${camera.camera_id} - Stream reachable`
                                    );

                                    // Stream working
                                    // OFFLINE -> ONLINE
                                    if (
                                        camera.status ===
                                        "OFFLINE"
                                    ) {

                                        const updateSql = `
                                            UPDATE cameras
                                            SET status = 'ONLINE'
                                            WHERE id = ?
                                        `;

                                        db.query(
                                            updateSql,
                                            [camera.id],
                                            (err) => {

                                                if (err) {
                                                    console.error(
                                                        "Online status update error:",
                                                        err
                                                    );

                                                    return;
                                                }

                                                console.log(
                                                    `🟢 ${camera.camera_id} is back ONLINE`
                                                );

                                                // Online recovery alert
                                                const alertSql = `
                                                    INSERT INTO alerts
                                                    (
                                                        camera_id,
                                                        alert_type,
                                                        message
                                                    )
                                                    VALUES (?, ?, ?)
                                                `;

                                                const message =
                                                    `${camera.name} (${camera.camera_id}) is back ONLINE`;

                                                db.query(
                                                    alertSql,
                                                    [
                                                        camera.id,
                                                        "ONLINE",
                                                        message
                                                    ],
                                                    (err) => {

                                                        if (err) {
                                                            console.error(
                                                                "Online alert error:",
                                                                err
                                                            );
                                                        }
                                                    }
                                                );
                                            }
                                        );
                                    }

                                } else {

                                    console.log(
                                        `🔴 ${camera.camera_id} - Stream unavailable`
                                    );

                                    markCameraOffline(
                                        camera
                                    );
                                }

                                response.resume();
                            }
                        );

                    request.setTimeout(
                        5000,
                        () => {

                            console.log(
                                `🔴 ${camera.camera_id} - Stream timeout`
                            );

                            request.destroy();

                            markCameraOffline(
                                camera
                            );
                        }
                    );

                    request.on(
                        "error",
                        () => {

                            console.log(
                                `🔴 ${camera.camera_id} - Stream connection failed`
                            );

                            markCameraOffline(
                                camera
                            );
                        }
                    );
                }
            );
        }
    );
};

// ======================================================
// MARK CAMERA OFFLINE
// ======================================================

const markCameraOffline = (
    camera
) => {

    // Already offline
    // duplicate alert nahi banega
    if (
        camera.status === "OFFLINE"
    ) {

        console.log(
            `ℹ️ ${camera.camera_id} already OFFLINE`
        );

        return;
    }

    const updateSql = `
        UPDATE cameras
        SET status = 'OFFLINE'
        WHERE id = ?
          AND status != 'OFFLINE'
    `;

    db.query(
        updateSql,
        [camera.id],
        (err, result) => {

            if (err) {

                console.error(
                    "Offline status update error:",
                    err
                );

                return;
            }

            // Kisi aur request ne already
            // OFFLINE kar diya
            if (
                result.affectedRows === 0
            ) {

                console.log(
                    `ℹ️ ${camera.camera_id} already OFFLINE - no alert`
                );

                return;
            }

            console.log(
                `🔴 ${camera.camera_id} is now OFFLINE`
            );

            // =========================
            // CREATE ONE OFFLINE ALERT
            // =========================

            const alertSql = `
                INSERT INTO alerts
                (
                    camera_id,
                    alert_type,
                    message
                )
                VALUES (?, ?, ?)
            `;

            const message =
                `${camera.name} (${camera.camera_id}) is OFFLINE`;

            db.query(
                alertSql,
                [
                    camera.id,
                    "OFFLINE",
                    message
                ],
                (err) => {

                    if (err) {

                        console.error(
                            "Offline alert error:",
                            err
                        );

                        return;
                    }

                    console.log(
                        `🚨 Alert created for ${camera.camera_id}`
                    );
                }
            );
        }
    );
};

// ======================================================
// AUTOMATIC HEALTH CHECK
// Every 30 seconds
// ======================================================

setInterval(
    () => {
        checkCameraHealth();
    },
    30000
);

// Run once when server starts
setTimeout(
    () => {
        checkCameraHealth();
    },
    2000
);

// ======================================================
// START SERVER
// ======================================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server actually running on port ${PORT}`);
});