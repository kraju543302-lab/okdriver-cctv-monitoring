import { useEffect, useState } from "react";
import "./App.css";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";  
  

function App() {
  const getMarkerIcon = (status) => {
  let color = "orange";

  if (status === "ONLINE") {
    color = "green";
  } else if (status === "OFFLINE") {
    color = "red";
  }

  return L.divIcon({
    className: "",
    html: `
      <div style="
        width: 18px;
        height: 18px;
        background: ${color};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 6px rgba(0,0,0,0.5);
      "></div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
  });
};
  const [cameras, setCameras] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [showForm, setShowForm] = useState(false);
  const [editingCamera, setEditingCamera] = useState(null);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(
  localStorage.getItem("adminLoggedIn") === "true"
);

const [username, setUsername] = useState("");
const [password, setPassword] = useState("");
const [loginError, setLoginError] = useState("");
const [loginLoading, setLoginLoading] = useState(false);

  const [formData, setFormData] = useState({
    camera_id: "",
    name: "",
    department: "",
    latitude: "",
    longitude: "",
    camera_type: "CCTV",
    source_protocol: "HTTP",
    stream_url: "",
    status: "ONLINE",
    zone: ""
  });
  // =========================
// ADMIN LOGIN
// =========================

const handleLogin = async (e) => {

  e.preventDefault();

  setLoginError("");

  if (!username || !password) {
    setLoginError("Please enter username and password");
    return;
  }

  setLoginLoading(true);

  try {

    const response = await fetch(
      "http://https://okdriver-cctv-monitoring.onrender.com/api/login",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username,
          password
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      setLoginError(
        data.error || "Invalid username or password"
      );
      return;
    }

   localStorage.setItem(
  "adminToken",
  data.token
);

localStorage.setItem(
  "adminLoggedIn",
  "true"
);

setIsLoggedIn(true);

    setIsLoggedIn(true);

    setUsername("");
    setPassword("");

  } catch (error) {

    console.error("Login error:", error);

    setLoginError(
      "Unable to connect to backend"
    );

  } finally {

    setLoginLoading(false);

  }
};

  // =========================
  // GET CAMERAS
  // =========================

  const loadCameras = async () => {
  try {

    const token = localStorage.getItem("adminToken");

    const response = await fetch(
      "http://https://okdriver-cctv-monitoring.onrender.com/api/cameras",
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    if (!response.ok) {
      throw new Error("Failed to load cameras");
    }

    const data = await response.json();

    setCameras(data);

  } catch (error) {

    console.error("Load cameras error:", error);

    alert("Backend se connection nahi ho raha");
  }
};

  // =========================
  // LOAD CAMERAS ON PAGE LOAD
  // =========================

 useEffect(() => {

  if (!isLoggedIn) {
    return;
  }

  loadCameras();
  loadAlerts();

}, [isLoggedIn]);
  // =========================
// LOAD ALERTS
// =========================

const loadAlerts = async () => {
  try {

    const token = localStorage.getItem("adminToken");

    const response = await fetch(
  "https://okdriver-cctv-monitoring.onrender.com/api/alerts",
  {
    headers: {
      Authorization: `Bearer ${token}`
    }
  }
);

    if (!response.ok) {
      throw new Error("Failed to load alerts");
    }

    const data = await response.json();

    setAlerts(data);

  } catch (error) {

    console.error("Load alerts error:", error);

  }
};
// =========================
// MARK ALERT AS READ
// =========================

const markAlertAsRead = async (alertId) => {
  try {

    const token = localStorage.getItem("adminToken");

    const response = await fetch(
  `https://okdriver-cctv-monitoring.onrender.com/api/alerts/${alertId}/read`,
  {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`
    }
  }
);

    if (!response.ok) {
      throw new Error("Failed to mark alert as read");
    }

    await loadAlerts();

  } catch (error) {
    console.error("Mark alert error:", error);
  }
};

  // =========================
  // FORM CHANGE
  // =========================

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // =========================
  // RESET FORM
  // =========================

  const resetForm = () => {
    setFormData({
      camera_id: "",
      name: "",
      department: "",
      latitude: "",
      longitude: "",
      camera_type: "CCTV",
      source_protocol: "HTTP",
      stream_url: "",
      status: "ONLINE",
      zone: ""
    });
  };

  // =========================
  // ADD CAMERA
  // =========================

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("adminToken");

const response = await fetch(
  "https://okdriver-cctv-monitoring.onrender.com/api/cameras",
  {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },

    body: JSON.stringify(formData)
  }
);

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Camera add nahi hua");
        return;
      }

      await loadCameras();

      setShowForm(false);
      setEditingCamera(null);
      resetForm();

      alert("Camera successfully added!");
    } catch (error) {
      console.error("Add camera error:", error);
      alert("Backend se connection nahi ho raha");
    }
  };

  // =========================
  // EDIT CAMERA
  // =========================

  const handleEdit = (camera) => {
    console.log("Editing camera:", camera);

    setEditingCamera(camera);

    setFormData({
      camera_id: camera.camera_id || "",
      name: camera.name || "",
      department: camera.department || "",
      latitude: camera.latitude || "",
      longitude: camera.longitude || "",
      camera_type: camera.camera_type || "CCTV",
      source_protocol: camera.source_protocol || "HTTP",
      stream_url: camera.stream_url || "",
      status: camera.status || "ONLINE",
      zone: camera.zone || ""
    });

    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  // =========================
  // UPDATE CAMERA
  // =========================

  const handleUpdate = async (e) => {
  e.preventDefault();

  if (!editingCamera) {
    return;
  }

  try {

    const token = localStorage.getItem("adminToken");

   const response = await fetch(
  `https://okdriver-cctv-monitoring.onrender.com/api/cameras/${editingCamera.id}`,
  {
    method: "PUT",

    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },

    body: JSON.stringify(formData)
  }
);

    const data = await response.json();

    if (!response.ok) {
      alert(data.error || "Camera update nahi hua");
      return;
    }

    await loadCameras();

    setEditingCamera(null);
    setShowForm(false);
    resetForm();

    alert("Camera updated successfully!");

  } catch (error) {

    console.error(
      "Update camera error:",
      error
    );

    alert("Backend se connection nahi ho raha");
  }
};

  // =========================
  // DISABLE CAMERA
  // =========================

  const handleDisable = async (camera) => {

  const confirmDisable = window.confirm(
    `Are you sure you want to disable ${camera.name}?`
  );

  if (!confirmDisable) {
    return;
  }

  try {

    const token = localStorage.getItem("adminToken");

    const response = await fetch(
      `https://okdriver-cctv-monitoring.onrender.com/api/cameras/${camera.id}/disable`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const data = await response.json();

    if (!response.ok) {
      alert(
        data.error ||
        "Camera disable nahi hua"
      );
      return;
    }

    await loadCameras();
    await loadAlerts();

    alert(
      "Camera disabled successfully!"
    );

  } catch (error) {

    console.error(
      "Disable camera error:",
      error
    );

    alert(
      "Backend se connection nahi ho raha"
    );
  }
};

  // =========================
  // ENABLE CAMERA
  // =========================

 const handleEnable = async (camera) => {

  try {

    const token = localStorage.getItem("adminToken");

    const response = await fetch(
  `https://okdriver-cctv-monitoring.onrender.com/api/cameras/${camera.id}/enable`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const data = await response.json();

    if (!response.ok) {
      alert(
        data.error ||
        "Camera enable nahi hua"
      );
      return;
    }

    await loadCameras();
    await loadAlerts();

    alert(
      "Camera enabled successfully!"
    );

  } catch (error) {

    console.error(
      "Enable camera error:",
      error
    );

    alert(
      "Backend se connection nahi ho raha"
    );
  }
};

  // =========================
  // SEARCH + FILTER
  // =========================

  const filteredCameras = cameras.filter((camera) => {
    const searchText = search.toLowerCase();

    const matchesSearch =
      (camera.name || "")
        .toLowerCase()
        .includes(searchText) ||
      (camera.camera_id || "")
        .toLowerCase()
        .includes(searchText) ||
      (camera.department || "")
        .toLowerCase()
        .includes(searchText) ||
      (camera.zone || "")
        .toLowerCase()
        .includes(searchText);

    const matchesStatus =
      statusFilter === "ALL" ||
      camera.status === statusFilter;

    return matchesSearch && matchesStatus;
  });
  if (!isLoggedIn) {
  return (
    <div className="login-page">

      <div className="login-box">

        <div className="login-icon">
          🔐
        </div>

        <h1>Admin Login</h1>

        <p>
          CCTV Monitoring System
        </p>

        <form onSubmit={handleLogin}>

          <div className="login-field">

            <label>
              Username
            </label>

            <input
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(e) =>
                setUsername(e.target.value)
              }
            />

          </div>

          <div className="login-field">

            <label>
              Password
            </label>

            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
            />

          </div>

          {loginError && (
            <div className="login-error">
              {loginError}
            </div>
          )}

          <button
            type="submit"
            className="login-btn"
            disabled={loginLoading}
          >
            {loginLoading
              ? "Logging in..."
              : "Login"}
          </button>

        </form>

      </div>

    </div>
  );
}
const handleLogout = () => {

  localStorage.removeItem("adminToken");
  localStorage.removeItem("adminLoggedIn");

  setIsLoggedIn(false);

};

  // =========================
  // UI
  // =========================

 return (
  <div className="dashboard">

    {/* HEADER */}

    <header className="header">

      <div>
        <h1>
          OKDRIVER CCTV MONITORING
        </h1>

        <p>
          Smart Camera Monitoring & Alert Platform
        </p>
      </div>

      <button
        type="button"
        className="logout-btn"
        onClick={handleLogout}
      >
        🚪 Logout
      </button>

    </header>
      {/* DASHBOARD ANALYTICS */}

<div className="analytics-section">

  <div className="analytics-card total">
    <div className="analytics-icon">
      📹
    </div>

    <div>
      <h3>Total Cameras</h3>
      <p>{cameras.length}</p>
    </div>
  </div>

  <div className="analytics-card online">
    <div className="analytics-icon">
      🟢
    </div>

    <div>
      <h3>Online</h3>
      <p>
        {
          cameras.filter(
            (camera) => camera.status === "ONLINE"
          ).length
        }
      </p>
    </div>
  </div>

  <div className="analytics-card offline">
    <div className="analytics-icon">
      🔴
    </div>

    <div>
      <h3>Offline</h3>
      <p>
        {
          cameras.filter(
            (camera) => camera.status === "OFFLINE"
          ).length
        }
      </p>
    </div>
  </div>

  <div className="analytics-card degraded">
    <div className="analytics-icon">
      🟠
    </div>

    <div>
      <h3>Degraded</h3>
      <p>
        {
          cameras.filter(
            (camera) => camera.status === "DEGRADED"
          ).length
        }
      </p>
    </div>
  </div>

</div>
{/* =========================
    ALERTS PANEL
========================= */}

<div className="alerts-section">

  <div className="alerts-header">

    <h2>
      🔔 Camera Alerts
    </h2>

    <span className="alert-count">
      {
        alerts.filter(
          (alert) => alert.status === "NEW"
        ).length
      } New
    </span>

  </div>

  <div className="alerts-list">

    {alerts.length === 0 ? (

      <div className="no-alerts">
        <div>✅</div>
        <p>No alerts available</p>
      </div>

    ) : (

      alerts.map((alert) => (

        <div
          className={`alert-item ${
            alert.status === "NEW"
              ? "new-alert"
              : "read-alert"
          }`}
          key={alert.id}
        >

          <div className="alert-icon">
            {alert.alert_type === "OFFLINE"
              ? "🔴"
              : "⚠️"}
          </div>

          <div className="alert-content">

            <h3>
              {alert.camera_name}
            </h3>

            <p>
              {alert.message}
            </p>

            <small>
              Camera ID: {alert.camera_code}
              {" • "}
              {new Date(
                alert.created_at
              ).toLocaleString()}
            </small>

          </div>

          {alert.status === "NEW" && (

            <button
              type="button"
              className="read-alert-btn"
              onClick={() =>
                markAlertAsRead(alert.id)
              }
            >
              Mark as Read
            </button>

          )}

        </div>

      ))

    )}

  </div>

</div>
      <div className="map-section">

  <h2>Camera Locations</h2>

  <MapContainer
    center={[23.025, 72.575]}
    zoom={13}
    style={{
      height: "450px",
      width: "100%"
    }}
  >

    <TileLayer
      attribution='&copy; OpenStreetMap contributors'
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    />

    {cameras.map((camera) => (

      <Marker
  key={camera.id}
  position={[
    Number(camera.latitude),
    Number(camera.longitude)
  ]}
  icon={getMarkerIcon(camera.status)}
>

        <Popup>
  <div style={{ minWidth: "220px" }}>

    <h3 style={{ margin: "0 0 10px 0" }}>
      {camera.name}
    </h3>

    <p>
      <strong>Camera ID:</strong>{" "}
      {camera.camera_id}
    </p>

    <p>
      <strong>Status:</strong>{" "}
      {camera.status}
    </p>

    <p>
      <strong>Department:</strong>{" "}
      {camera.department || "N/A"}
    </p>

    <p>
      <strong>Zone:</strong>{" "}
      {camera.zone || "N/A"}
    </p>

    <p>
      <strong>Location:</strong>{" "}
      {camera.latitude}, {camera.longitude}
    </p>

    {camera.status === "ONLINE" && camera.stream_url && (
      <button
        onClick={() => {
          window.scrollTo({
            top: document.body.scrollHeight,
            behavior: "smooth"
          });
        }}
        style={{
          width: "100%",
          padding: "8px",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          background: "#198754",
          color: "white"
        }}
      >
        🎥 View Camera
      </button>
    )}

  </div>
</Popup>

      </Marker>

    ))}

  </MapContainer>

</div>

      {/* CAMERA SECTION */}

      <section className="camera-section">

        {/* SECTION HEADER */}

        <div className="section-header">

          <h2>
            Camera Monitoring
          </h2>

          <button
            type="button"
            className="add-camera-btn"
            onClick={() => {

              setEditingCamera(null);

              resetForm();

              setShowForm(!showForm);

            }}
          >
            + Add Camera
          </button>

        </div>

        {/* SEARCH */}

        <div className="filters">

          <input
            type="text"
            placeholder="Search camera..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value)
            }
          >

            <option value="ALL">
              All Status
            </option>

            <option value="ONLINE">
              Online
            </option>

            <option value="OFFLINE">
              Offline
            </option>

            <option value="DEGRADED">
              Degraded
            </option>

          </select>

        </div>

        {/* ADD / EDIT FORM */}

        {showForm && (

          <form
            className="camera-form"
            onSubmit={
              editingCamera
                ? handleUpdate
                : handleSubmit
            }
          >

            <h3>
              {
                editingCamera
                  ? "Edit Camera"
                  : "Add New Camera"
              }
            </h3>

            <div className="form-grid">

              <input
                type="text"
                name="camera_id"
                placeholder="Camera ID"
                value={formData.camera_id}
                onChange={handleChange}
                required
              />

              <input
                type="text"
                name="name"
                placeholder="Camera Name"
                value={formData.name}
                onChange={handleChange}
                required
              />

              <input
                type="text"
                name="department"
                placeholder="Department"
                value={formData.department}
                onChange={handleChange}
              />

              <input
                type="number"
                step="any"
                name="latitude"
                placeholder="Latitude"
                value={formData.latitude}
                onChange={handleChange}
              />

              <input
                type="number"
                step="any"
                name="longitude"
                placeholder="Longitude"
                value={formData.longitude}
                onChange={handleChange}
              />

              <select
                name="camera_type"
                value={formData.camera_type}
                onChange={handleChange}
              >

                <option value="CCTV">
                  CCTV
                </option>

                <option value="ANPR">
                  ANPR
                </option>

                <option value="PTZ">
                  PTZ
                </option>

              </select>

              <select
                name="source_protocol"
                value={formData.source_protocol}
                onChange={handleChange}
              >

                <option value="HTTP">
                  HTTP
                </option>

                <option value="RTSP">
                  RTSP
                </option>

                <option value="ONVIF">
                  ONVIF
                </option>

              </select>

              <input
                type="text"
                name="stream_url"
                placeholder="Stream URL"
                value={formData.stream_url}
                onChange={handleChange}
              />

              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
              >

                <option value="ONLINE">
                  ONLINE
                </option>

                <option value="OFFLINE">
                  OFFLINE
                </option>

                <option value="DEGRADED">
                  DEGRADED
                </option>

              </select>

              <input
                type="text"
                name="zone"
                placeholder="Zone"
                value={formData.zone}
                onChange={handleChange}
              />

            </div>

            <button
              type="submit"
              className="save-btn"
            >
              {
                editingCamera
                  ? "Save Changes"
                  : "Save Camera"
              }
            </button>

          </form>

        )}

        {/* CAMERA GRID */}

        <div className="camera-grid">

          {filteredCameras.length === 0 ? (

            <div className="no-camera">
              <h3>No cameras found</h3>
              <p>
                Search ya filter change karke dekho.
              </p>
            </div>

          ) : (

            filteredCameras.map((camera) => (

              <div
                className="camera-card"
                key={camera.id}
              >

                {/* CAMERA HEADER */}

                <div className="camera-header">

                  <h3>
                    {camera.name}
                  </h3>

                  <span
                    className={
                      (camera.status || "OFFLINE")
                        .toLowerCase()
                    }
                  >
                    {camera.status}
                  </span>

                </div>

                {/* VIDEO */}

                <div className="camera-screen">

                  {camera.status === "ONLINE" ? (

                    camera.stream_url ? (

                      <video
                        controls
                        autoPlay
                        muted
                        loop
                        width="100%"
                        height="100%"
                      >

                        <source
                          src={camera.stream_url}
                          type="video/mp4"
                        />

                        Your browser does not support
                        video playback.

                      </video>

                    ) : (

                      <div className="offline-screen">

                        <div className="offline-icon">
                          📹
                        </div>

                        <h3>
                          NO VIDEO SOURCE
                        </h3>

                        <p>
                          Stream URL available nahi hai
                        </p>

                      </div>

                    )

                  ) : (

                    <div className="offline-screen">

                      <div className="offline-icon">
                        📹
                      </div>

                      <h3>
                        CAMERA OFFLINE
                      </h3>

                      <p>
                        No live feed available
                      </p>

                    </div>

                  )}

                </div>

                {/* CAMERA INFO */}

                <div className="camera-info">

                  <p>
                    <strong>
                      Camera ID:
                    </strong>{" "}
                    {camera.camera_id}
                  </p>

                  <p>
                    <strong>
                      Department:
                    </strong>{" "}
                    {camera.department || "N/A"}
                  </p>

                  <p>
                    <strong>
                      Zone:
                    </strong>{" "}
                    {camera.zone || "N/A"}
                  </p>

                  <p>
                    <strong>
                      Location:
                    </strong>{" "}
                    {camera.latitude || "N/A"},{" "}
                    {camera.longitude || "N/A"}
                  </p>

                </div>

                {/* CAMERA ACTIONS */}

                <div className="camera-actions">
                  <button
  type="button"
  className="details-btn"
  onClick={() => setSelectedCamera(camera)}
>
  👁 View Details
</button>

                  <button
                    type="button"
                    className="edit-btn"
                    onClick={() =>
                      handleEdit(camera)
                    }
                  >
                    ✏️ Edit
                  </button>

                  {camera.status === "OFFLINE" ? (

                    <button
                      type="button"
                      className="enable-btn"
                      onClick={() =>
                        handleEnable(camera)
                      }
                    >
                      🟢 Enable
                    </button>

                  ) : (

                    <button
                      type="button"
                      className="disable-btn"
                      onClick={() =>
                        handleDisable(camera)
                      }
                    >
                      🚫 Disable
                    </button>

                  )}

                </div>

              </div>

            ))

          )}

        </div>
        {/* =========================
    CAMERA DETAILS MODAL
========================= */}

{selectedCamera && (
  <div
    className="camera-modal-overlay"
    onClick={() => setSelectedCamera(null)}
  >

    <div
      className="camera-modal"
      onClick={(e) => e.stopPropagation()}
    >

      <div className="camera-modal-header">

        <h2>📹 Camera Details</h2>

        <button
          type="button"
          className="modal-close-btn"
          onClick={() => setSelectedCamera(null)}
        >
          ✕
        </button>

      </div>

      <div className="camera-modal-body">

        {/* VIDEO */}
        <div className="modal-video">

          {selectedCamera.status === "ONLINE" &&
          selectedCamera.stream_url ? (

            <video
              controls
              autoPlay
              muted
              loop
              width="100%"
              height="100%"
            >
              <source
                src={selectedCamera.stream_url}
                type="video/mp4"
              />

              Your browser does not support video playback.
            </video>

          ) : (

            <div className="modal-offline">
              📹
              <h3>CAMERA OFFLINE</h3>
              <p>No live feed available</p>
            </div>

          )}

        </div>

        {/* DETAILS */}

        <div className="modal-details">

          <div className="detail-row">
            <span>Camera Name</span>
            <strong>
              {selectedCamera.name}
            </strong>
          </div>

          <div className="detail-row">
            <span>Camera ID</span>
            <strong>
              {selectedCamera.camera_id}
            </strong>
          </div>

          <div className="detail-row">
            <span>Status</span>

            <strong
              className={
                selectedCamera.status
                  .toLowerCase()
              }
            >
              {selectedCamera.status}
            </strong>

          </div>

          <div className="detail-row">
            <span>Department</span>
            <strong>
              {selectedCamera.department || "N/A"}
            </strong>
          </div>

          <div className="detail-row">
            <span>Zone</span>
            <strong>
              {selectedCamera.zone || "N/A"}
            </strong>
          </div>

          <div className="detail-row">
            <span>Camera Type</span>
            <strong>
              {selectedCamera.camera_type || "N/A"}
            </strong>
          </div>

          <div className="detail-row">
            <span>Protocol</span>
            <strong>
              {selectedCamera.source_protocol || "N/A"}
            </strong>
          </div>

          <div className="detail-row">
            <span>Location</span>
            <strong>
              {selectedCamera.latitude || "N/A"},
              {" "}
              {selectedCamera.longitude || "N/A"}
            </strong>
          </div>

        </div>

      </div>

    </div>

  </div>
)}

      </section>

    </div>
  );
}

export default App;