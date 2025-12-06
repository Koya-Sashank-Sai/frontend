import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import loginDB from "../data/logins.json";
import teacherAssignments from "../data/teacherAssignments.json";
import coordinatorAssignments from "../data/coordinatorAssignment.json";
import districtAssignments from "../data/DistrictheadAssignment.json";
import adminAssignments from "../data/AdminAssignments.json";

export default function LoginPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    designation: "",
    schoolCode: "",
    districtCode: "",
    adminCode: "",
    userId: "",
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const {
      designation,
      schoolCode,
      districtCode,
      adminCode,
      userId,
      email,
      password,
    } = form;

    if (!designation) {
      alert("Please select a designation.");
      return;
    }

    // ========= SPECIAL CASE: ADMIN (uses `login` not `logins`) =========
    if (designation === "Admin") {
      const adminGroup = loginDB.find((d) => d.designation === "Admin");
      const admin = adminGroup?.login;

      if (!adminCode) {
        alert("Please enter Admin Code.");
        return;
      }

      if (
        admin &&
        admin.adminCode === adminCode &&
        admin.userId === userId &&
        admin.email === email &&
        admin.password === password
      ) {
        // Find what this admin can control from AdminAssignments.json
        const assignment = adminAssignments.find(
          (a) => a.userId === admin.userId
        );

        const adminContext = {
          designation: "Admin",
          adminCode: admin.adminCode,
          userId: admin.userId,
          email: admin.email,
          schools: assignment?.schools || [],
        };

        sessionStorage.setItem("adminContext", JSON.stringify(adminContext));
        sessionStorage.setItem(
          "userContext",
          JSON.stringify({
            designation: "Admin",
            adminCode: admin.adminCode,
            userId: admin.userId,
            email: admin.email,
          })
        );

        alert("Admin login successful");
        navigate("/admin-dashboard");
        return;
      }

      alert("Invalid Admin credentials");
      return;
    }

    // ========= OTHER ROLES: Teacher / Coordinator / District Head =========

    // Find the correct group from logins.json
    const group = loginDB.find((d) => d.designation === designation);

    if (!group) {
      alert("Invalid designation");
      return;
    }

    let user = null;

    // Teacher / Coordinator use schoolCode
    if (designation === "Teacher" || designation === "Coordinator") {
      if (!schoolCode) {
        alert("Please enter School Code.");
        return;
      }

      user = group.logins?.find(
        (u) =>
          u.schoolCode === schoolCode &&
          u.userId === userId &&
          u.email === email &&
          u.password === password
      );
    }

    // District Head uses districtCode
    if (designation === "District Head") {
      if (!districtCode) {
        alert("Please enter District Code.");
        return;
      }

      user = group.logins?.find(
        (u) =>
          u.districtCode === districtCode &&
          u.userId === userId &&
          u.email === email &&
          u.password === password
      );
    }

    if (!user) {
      alert("Invalid login credentials!");
      return;
    }

    // ================== CONTEXTS PER ROLE ==================

    // 🔹 Teacher context
    if (designation === "Teacher") {
      const assignment = teacherAssignments.find(
        (a) => a.schoolCode === schoolCode && a.userId === userId
      );

      const teacherContext = {
        designation,
        schoolCode,
        userId,
        email,
        classes: assignment?.classes || [], // [{ class: 6, section: "A" }, ...]
      };

      sessionStorage.setItem("teacherContext", JSON.stringify(teacherContext));
      sessionStorage.setItem(
        "userContext",
        JSON.stringify({ designation, schoolCode, userId, email })
      );

      alert("Teacher login successful");
      navigate("/teacher-dashboard");
      return;
    }

    // 🔹 Coordinator context
    if (designation === "Coordinator") {
      const assignment = coordinatorAssignments.find(
        (a) => a.schoolCode === schoolCode && a.userId === userId
      );

      const coordinatorContext = {
        designation,
        schoolCode,
        userId,
        email,
        handles: assignment?.handles || [],
      };

      sessionStorage.setItem(
        "coordinatorContext",
        JSON.stringify(coordinatorContext)
      );
      sessionStorage.setItem(
        "userContext",
        JSON.stringify({ designation, schoolCode, userId, email })
      );

      alert("Coordinator login successful");
      navigate("/coordinator-dashboard");
      return;
    }

    // 🔹 District Head context
    if (designation === "District Head") {
      const assignment = districtAssignments.find(
        (a) => a.districtCode === districtCode && a.userId === userId
      );

      const districtContext = {
        designation,
        districtCode,
        userId,
        email,
        schools: assignment?.schools || [],
      };

      sessionStorage.setItem(
        "districtContext",
        JSON.stringify(districtContext)
      );
      sessionStorage.setItem(
        "userContext",
        JSON.stringify({ designation, districtCode, userId, email })
      );

      alert("District Head login successful");
      navigate("/district-dashboard");
      return;
    }
  };

  const handleForgotPassword = () => {
    console.log("Forgot password clicked");
  };

  return (
    <div style={pageContainer}>
      {/* Card */}
      <div style={card}>
        {/* Header: logo left, title center */}
        <header style={header}>
          <div style={logoContainer}>
            <img
              src="/logo123.jpg"
              alt="Logo"
              style={{ height: 48, borderRadius: 8 }}
            />
          </div>
          <h1 style={title}>School Education - Stay in School</h1>
          <div style={{ width: 60 }} /> {/* spacer to balance flex */}
        </header>

        {/* Form */}
        <form onSubmit={handleSubmit} style={formContainer}>
          {/* Designation */}
          <div style={field}>
            <label style={label}>Select Designation</label>
            <select
              name="designation"
              value={form.designation}
              onChange={handleChange}
              style={input}
              required
            >
              <option value="">-- Select --</option>
              <option value="Teacher">Teacher</option>
              <option value="Coordinator">Coordinator</option>
              <option value="District Head">District Head</option>
              <option value="Admin">Admin</option>
            </select>
          </div>

          {/* School code (for Teacher & Coordinator only) */}
          {(form.designation === "Teacher" ||
            form.designation === "Coordinator") && (
            <div style={field}>
              <label style={label}>School Code</label>
              <input
                type="text"
                name="schoolCode"
                value={form.schoolCode}
                onChange={handleChange}
                style={input}
                placeholder="Enter your school code"
                required
              />
            </div>
          )}

          {/* District code (for District Head) */}
          {form.designation === "District Head" && (
            <div style={field}>
              <label style={label}>District Code</label>
              <input
                type="text"
                name="districtCode"
                value={form.districtCode}
                onChange={handleChange}
                style={input}
                placeholder="Enter your district code (e.g., D01)"
                required
              />
            </div>
          )}

          {/* Admin code (for Admin) */}
          {form.designation === "Admin" && (
            <div style={field}>
              <label style={label}>Admin Code</label>
              <input
                type="text"
                name="adminCode"
                value={form.adminCode}
                onChange={handleChange}
                style={input}
                placeholder="Enter your admin code (e.g., ADM001)"
                required
              />
            </div>
          )}

          {/* Your ID */}
          <div style={field}>
            <label style={label}>Your ID</label>
            <input
              type="text"
              name="userId"
              value={form.userId}
              onChange={handleChange}
              style={input}
              placeholder="Enter your ID"
              required
            />
          </div>

          {/* Personal email */}
          <div style={field}>
            <label style={label}>Personal Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              style={input}
              placeholder="Enter your personal email"
              required
            />
          </div>

          {/* Password */}
          <div style={field}>
            <label style={label}>Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              style={input}
              placeholder="Enter your password"
              required
            />
          </div>

          {/* Actions */}
          <div style={actionsRow}>
            <button type="submit" style={loginButton}>
              Login
            </button>
            <button
              type="button"
              style={forgotButton}
              onClick={handleForgotPassword}
            >
              Forgot password?
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ---------- Inline styles ---------- */

const pageContainer = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(135deg, #e0f2fe, #eef2ff)",
  padding: "1rem",
  fontFamily:
    "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

const card = {
  width: "100%",
  maxWidth: "460px",
  backgroundColor: "white",
  borderRadius: "1rem",
  boxShadow: "0 15px 35px rgba(15, 23, 42, 0.15)",
  padding: "1.75rem 1.75rem 1.5rem",
};

const header = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: "1.5rem",
};

const logoContainer = {
  display: "flex",
  alignItems: "center",
};

const title = {
  margin: 0,
  fontSize: "1.2rem",
  fontWeight: 600,
  textAlign: "center",
  flex: 1,
};

const formContainer = {
  display: "flex",
  flexDirection: "column",
  gap: "0.9rem",
};

const field = {
  display: "flex",
  flexDirection: "column",
  gap: "0.25rem",
};

const label = {
  fontSize: "0.85rem",
  fontWeight: 500,
  color: "#374151",
};

const input = {
  padding: "0.55rem 0.7rem",
  borderRadius: "0.45rem",
  border: "1px solid #d1d5db",
  fontSize: "0.9rem",
  outline: "none",
  transition: "border-color 0.15s, box-shadow 0.15s",
};

const actionsRow = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginTop: "0.75rem",
};

const loginButton = {
  padding: "0.55rem 1.4rem",
  borderRadius: "999px",
  border: "none",
  backgroundColor: "#2563eb",
  color: "white",
  fontSize: "0.9rem",
  fontWeight: 600,
  cursor: "pointer",
  boxShadow: "0 8px 20px rgba(37, 99, 235, 0.35)",
};

const forgotButton = {
  border: "none",
  background: "none",
  color: "#2563eb",
  fontSize: "0.85rem",
  cursor: "pointer",
  textDecoration: "underline",
};
