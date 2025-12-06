import React, { useEffect, useState } from "react";

const API_BASE = "http://localhost:8000"; // your FastAPI backend

export default function DistrictHeadDashboard() {
  // Filters that go to /students
  const [filters, setFilters] = useState({
    school_id: "",
    schoolCode: "",
    class: "",
    section: "",
    risk_level: "", // default: all risks
  });

  const [districtContext, setDistrictContext] = useState(null);

  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentsError, setStudentsError] = useState(null);

  // Explanation state
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [explanationLoading, setExplanationLoading] = useState(false);
  const [explanationError, setExplanationError] = useState(null);

  // Map schoolCode → numeric school_id (backend)
  const schoolCodeToId = {
    SCH1001: 1,
    SCH1002: 2,
    SCH1003: 3,
    SCH1004: 4,
    SCH1005: 5,
  };

  // -------- Load districtContext from session on mount --------
  useEffect(() => {
    const stored = sessionStorage.getItem("districtContext");
    if (stored) {
      const ctx = JSON.parse(stored);
      setDistrictContext(ctx);

      // District Head chooses school & class/section later
      setFilters((prev) => ({
        ...prev,
        school_id: "",
        schoolCode: "",
        class: "",
        section: "",
        risk_level: "",
      }));
    } else {
      console.warn("No districtContext found in sessionStorage. Please login first.");
    }
  }, []);

  // All schools assigned to this District Head
  const assignedSchools = districtContext?.schools || [];

  // For the selected school, flatten handles → [{class, section}, ...]
  const availableClassSections = React.useMemo(() => {
    if (!districtContext || !filters.schoolCode) return [];

    const school = districtContext.schools.find(
      (s) => s.schoolCode === filters.schoolCode
    );
    if (!school || !Array.isArray(school.handles)) return [];

    const result = [];
    school.handles.forEach((h) => {
      if (Array.isArray(h.sections)) {
        h.sections.forEach((sec) => {
          result.push({ class: h.class, section: sec });
        });
      }
    });
    return result;
  }, [districtContext, filters.schoolCode]);

  // -------- Fetch students from /students --------
  const fetchStudents = async (overrideFilters) => {
    const f = overrideFilters || filters;

    if (!f.school_id || !f.class || !f.section) {
      console.warn("Skipping fetch: missing school_id / class / section");
      return;
    }

    try {
      setStudentsLoading(true);
      setStudentsError(null);

      const params = new URLSearchParams();
      params.append("school_id", f.school_id);
      params.append("class", f.class);
      params.append("section", f.section);
      if (f.risk_level) params.append("risk_level", f.risk_level);

      const url = `${API_BASE}/students?${params.toString()}`;
      const res = await fetch(url);

      if (!res.ok) {
        throw new Error(`Failed to fetch students: ${res.status}`);
      }

      const data = await res.json();
      setStudents(data);

      setSelectedStudent(null);
      setExplanation(null);
      setExplanationError(null);
    } catch (err) {
      console.error(err);
      setStudentsError(err.message || "Error fetching students");
    } finally {
      setStudentsLoading(false);
    }
  };

  // -------- Fetch explanation for one student --------
  const fetchExplanation = async (student) => {
    try {
      setSelectedStudent(student);
      setExplanation(null);
      setExplanationError(null);
      setExplanationLoading(true);

      const url = `${API_BASE}/students/${student.student_id}/explanation`;
      const res = await fetch(url);

      if (!res.ok) {
        throw new Error(`Failed to fetch explanation: ${res.status}`);
      }

      const data = await res.json();
      setExplanation(data);
    } catch (err) {
      console.error(err);
      setExplanationError(err.message || "Error fetching explanation");
    } finally {
      setExplanationLoading(false);
    }
  };

  // -------- Handlers --------
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSchoolChange = (e) => {
    const schoolCode = e.target.value;
    const schoolId = schoolCodeToId[schoolCode] || "";

    const updated = {
      ...filters,
      schoolCode,
      school_id: schoolId ? String(schoolId) : "",
      class: "",
      section: "",
    };

    setFilters(updated);
    setStudents([]);
    setSelectedStudent(null);
    setExplanation(null);
    setExplanationError(null);
  };

  const handleClassSelectChange = (e) => {
    const value = e.target.value;
    if (!value) return;

    const [cls, sec] = value.split("-");

    const updated = {
      ...filters,
      class: cls,
      section: sec,
    };

    setFilters(updated);
    fetchStudents(updated);
  };

  const handleApplyFilters = () => {
    if (!filters.school_id || !filters.class || !filters.section) {
      alert("Please select School, Class & Section first.");
      return;
    }
    fetchStudents();
  };

  const handleClearFilters = () => {
    setFilters((prev) => ({
      ...prev,
      school_id: "",
      schoolCode: "",
      class: "",
      section: "",
      risk_level: "",
    }));
    setStudents([]);
    setSelectedStudent(null);
    setExplanation(null);
    setExplanationError(null);
  };

  // -------- Local summary --------
  const localSummary = React.useMemo(() => {
    const total = students.length;
    const byRisk = students.reduce(
      (acc, s) => {
        const key = s.risk_level || "Unknown";
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      },
      { High: 0, Medium: 0, Low: 0 }
    );
    return { total, byRisk };
  }, [students]);

  return (
    <div
      style={{
        padding: "1.5rem",
        backgroundColor: "#f3f4f6",
        minHeight: "100vh",
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <h1 style={{ marginBottom: "1rem", fontSize: "1.5rem", fontWeight: 600 }}>
        District Head Dashboard
      </h1>

      {/* District Head info banner */}
      {districtContext ? (
        <div
          style={{
            marginBottom: "1rem",
            padding: "0.75rem 1rem",
            borderRadius: "0.75rem",
            backgroundColor: "white",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          }}
        >
          <p style={{ margin: 0, fontSize: "0.9rem", color: "#374151" }}>
            <strong>District Head:</strong> {districtContext.userId} (
            {districtContext.email})
          </p>
          <p style={{ margin: "0.25rem 0", fontSize: "0.9rem", color: "#374151" }}>
            <strong>District Code:</strong> {districtContext.districtCode}
          </p>
          {assignedSchools.length > 0 && (
            <p
              style={{
                margin: "0.25rem 0",
                fontSize: "0.9rem",
                color: "#374151",
              }}
            >
              <strong>Schools you oversee:</strong>{" "}
              {assignedSchools.map((s) => s.schoolCode).join(", ")}
            </p>
          )}
        </div>
      ) : (
        <div
          style={{
            marginBottom: "1rem",
            padding: "0.75rem 1rem",
            borderRadius: "0.75rem",
            backgroundColor: "#fee2e2",
            color: "#991b1b",
          }}
        >
          No district context found. Please login again from the Login page.
        </div>
      )}

      {/* Summary cards */}
      {students.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: "1rem",
            marginBottom: "1rem",
            flexWrap: "wrap",
          }}
        >
          <SummaryCard
            title="Total Students (this selection)"
            value={localSummary.total}
          />
          <SummaryCard title="High Risk" value={localSummary.byRisk.High || 0} />
          <SummaryCard
            title="Medium Risk"
            value={localSummary.byRisk.Medium || 0}
          />
          <SummaryCard title="Low Risk" value={localSummary.byRisk.Low || 0} />
        </div>
      )}

      {/* Main content */}
      <div
        style={{
          backgroundColor: "white",
          padding: "1rem",
          borderRadius: "0.75rem",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          display: "grid",
          gridTemplateColumns: "2.2fr 1.2fr",
          gap: "1rem",
          alignItems: "flex-start",
        }}
      >
        {/* LEFT: filters + table */}
        <div>
          {/* Filters */}
          <div
            style={{
              marginBottom: "1rem",
              display: "flex",
              flexWrap: "wrap",
              gap: "0.5rem",
              alignItems: "center",
            }}
          >
            {/* School ID (derived from selected school) */}
            <input
              name="school_id"
              placeholder="School ID"
              value={filters.school_id}
              onChange={handleFilterChange}
              style={inputStyle}
              readOnly
            />

            {/* School selector */}
            {assignedSchools.length > 0 && (
              <select
                onChange={handleSchoolChange}
                style={inputStyle}
                value={filters.schoolCode || ""}
              >
                <option value="">Select School</option>
                {assignedSchools.map((s) => (
                  <option key={s.schoolCode} value={s.schoolCode}>
                    {s.schoolCode}
                  </option>
                ))}
              </select>
            )}

            {/* Class & Section for that school */}
            {filters.schoolCode && availableClassSections.length > 0 && (
              <select
                onChange={handleClassSelectChange}
                style={inputStyle}
                value={
                  filters.class && filters.section
                    ? `${filters.class}-${filters.section}`
                    : ""
                }
              >
                <option value="">Select Class & Section</option>
                {availableClassSections.map((c) => (
                  <option
                    key={`${c.class}-${c.section}`}
                    value={`${c.class}-${c.section}`}
                  >
                    {filters.schoolCode} – Class {c.class} – Section {c.section}
                  </option>
                ))}
              </select>
            )}

            {/* Risk level filter */}
            <select
              name="risk_level"
              value={filters.risk_level}
              onChange={handleFilterChange}
              style={inputStyle}
            >
              <option value="">All Risks</option>
              <option value="High">High Risk only</option>
              <option value="Medium">Medium Risk only</option>
              <option value="Low">Low Risk only</option>
            </select>

            <button onClick={handleApplyFilters} style={buttonStyle}>
              Apply Filters
            </button>

            <button
              type="button"
              onClick={handleClearFilters}
              style={{ ...buttonStyle, backgroundColor: "#6b7280" }}
            >
              Clear Selection
            </button>
          </div>

          {/* Students table */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "0.75rem",
            }}
          >
            <h2 style={{ margin: 0, fontSize: "1.1rem" }}>
              Students (by school / class / section)
            </h2>
            {students && students.length > 0 && (
              <span style={{ fontSize: "0.9rem", color: "#555" }}>
                {students.length} students found
              </span>
            )}
          </div>

          {studentsLoading ? (
            <p>Loading students...</p>
          ) : studentsError ? (
            <p style={{ color: "red" }}>{studentsError}</p>
          ) : students.length === 0 ? (
            <p>No students found for these filters.</p>
          ) : (
            <div style={{ maxHeight: "480px", overflow: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "0.85rem",
                }}
              >
                <thead>
                  <tr>
                    <th style={thStyle}>Student ID</th>
                    <th style={thStyle}>School</th>
                    <th style={thStyle}>Class</th>
                    <th style={thStyle}>Section</th>
                    <th style={thStyle}>Attendance</th>
                    <th style={thStyle}>Midterm Marks</th>
                    <th style={thStyle}>Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <tr
                      key={s.student_id}
                      onClick={() => fetchExplanation(s)}
                      style={{
                        cursor: "pointer",
                        backgroundColor:
                          selectedStudent &&
                          selectedStudent.student_id === s.student_id
                            ? "#eff6ff"
                            : "white",
                      }}
                    >
                      <td style={tdStyle}>{s.student_id}</td>
                      <td style={tdStyle}>{filters.schoolCode}</td>
                      <td style={tdStyle}>{s.class}</td>
                      <td style={tdStyle}>{s.section}</td>
                      <td style={tdStyle}>
                        {Number(s.attendance_rate_2024_25).toFixed(1)}%
                      </td>
                      <td style={tdStyle}>{s.exam_midterm_2024_25}</td>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>
                        {s.risk_level}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p
            style={{
              marginTop: "0.5rem",
              fontSize: "0.8rem",
              color: "#666",
            }}
          >
            Click on a student to see a simple explanation on the right.
          </p>
        </div>

        {/* RIGHT: explanation panel */}
        <div
          style={{
            borderLeft: "1px solid #e5e7eb",
            paddingLeft: "1rem",
          }}
        >
          <h3 style={{ marginTop: 0, fontSize: "1.05rem" }}>
            Student Risk Explanation
          </h3>

          {!selectedStudent && (
            <p style={{ fontSize: "0.9rem", color: "#4b5563" }}>
              Select a student from the table to understand why they are marked as
              High / Medium / Low risk.
            </p>
          )}

          {selectedStudent && explanationLoading && <p>Loading explanation...</p>}

          {selectedStudent && explanationError && (
            <p style={{ color: "red" }}>{explanationError}</p>
          )}

          {selectedStudent && explanation && (
            <>
              <div
                style={{
                  marginBottom: "0.75rem",
                  padding: "0.5rem 0.75rem",
                  borderRadius: "0.5rem",
                  backgroundColor: "#eff6ff",
                }}
              >
                <p style={{ margin: 0, fontWeight: 600 }}>
                  {explanation.student_id} — Class {explanation.class},{" "}
                  Section {explanation.section}
                </p>
                <p style={{ margin: "0.2rem 0", fontSize: "0.9rem" }}>
                  Overall risk:{" "}
                  <strong>{explanation.risk_level}</strong>{" "}
                  ({(explanation.predicted_dropout_risk_score_2024_25 * 100).toFixed(
                    1
                  )}
                  % chance of dropping out)
                </p>
                <p style={{ margin: "0.2rem 0", fontSize: "0.9rem" }}>
                  Current status:{" "}
                  <strong>
                    {explanation.current_year_dropout_2024_25 === 1
                      ? "Already dropped out"
                      : "Still enrolled"}
                  </strong>
                </p>
              </div>

              <p style={{ fontSize: "0.9rem", color: "#111827" }}>
                <strong>In simple words:</strong> {explanation.main_reason}.
              </p>

              <h4
                style={{
                  fontSize: "0.95rem",
                  margin: "0.75rem 0 0.35rem",
                }}
              >
                Key reasons for this risk
              </h4>

              {explanation.top_factors && explanation.top_factors.length > 0 ? (
                <ul style={{ paddingLeft: "1.1rem", margin: 0 }}>
                  {explanation.top_factors.map((f) => (
                    <li
                      key={f.rank}
                      style={{ marginBottom: "0.35rem", fontSize: "0.9rem" }}
                    >
                      {renderFriendlyFactor(f)}
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ fontSize: "0.9rem" }}>
                  No factor explanation available for this student.
                </p>
              )}

              <p
                style={{
                  marginTop: "0.75rem",
                  fontSize: "0.8rem",
                  color: "#666",
                }}
              >
                Use these points to plan district-level support: school visits,
                targeted programs, or parent/community interventions.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- Helpers: same style as TeacherDashboard ---------- */

const FEATURE_LABELS = {
  attendance_rate_2024_25: "Attendance",
  exam_midterm_2024_25: "Midterm exam marks",
  total_absences_2023_24: "Last year’s absences",
  household_income_index: "Household income",
};

function friendlyFeatureName(raw) {
  return FEATURE_LABELS[raw] || raw.replace(/_/g, " ");
}

function mapDirection(direction) {
  switch (direction) {
    case "higher_than_average":
      return "higher than usual for this class";
    case "lower_than_average":
      return "lower than usual for this class";
    case "around_average":
      return "about the same as the class";
    default:
      return "compared to the class average";
  }
}

function renderFriendlyFactor(f) {
  const name = friendlyFeatureName(f.feature);
  const directionText = mapDirection(f.direction);

  const sVal = f.student_value;
  const avgVal = f.dataset_average;

  let studentText = sVal.toFixed(1);
  let avgText = avgVal.toFixed(1);

  if (
    f.feature.toLowerCase().includes("attendance") ||
    f.feature.toLowerCase().includes("rate")
  ) {
    studentText = (sVal * 100).toFixed(0) + "%";
    avgText = (avgVal * 100).toFixed(0) + "%";
  }

  return (
    <>
      <strong>{name}</strong> is {directionText}.{" "}
      <span style={{ color: "#4b5563" }}>
        Student: {studentText}, typical in this class: {avgText}.
      </span>
    </>
  );
}

/* ---------- Styles ---------- */

function SummaryCard({ title, value }) {
  return (
    <div
      style={{
        flex: "0 0 160px",
        backgroundColor: "white",
        borderRadius: "0.75rem",
        padding: "0.75rem 1rem",
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: "0.8rem",
          color: "#6b7280",
        }}
      >
        {title}
      </p>
      <p
        style={{
          margin: "0.25rem 0 0",
          fontSize: "1.2rem",
          fontWeight: 600,
          color: "#111827",
        }}
      >
        {value}
      </p>
    </div>
  );
}

const inputStyle = {
  padding: "0.4rem 0.6rem",
  borderRadius: "0.4rem",
  border: "1px solid #d4d4d4",
  fontSize: "0.85rem",
};

const buttonStyle = {
  padding: "0.45rem 0.9rem",
  borderRadius: "0.4rem",
  border: "none",
  backgroundColor: "#2563eb",
  color: "white",
  fontSize: "0.85rem",
  cursor: "pointer",
};

const thStyle = {
  textAlign: "left",
  padding: "0.4rem 0.5rem",
  borderBottom: "1px solid #e5e7eb",
  backgroundColor: "#f9fafb",
  position: "sticky",
  top: 0,
  zIndex: 1,
};

const tdStyle = {
  padding: "0.35rem 0.5rem",
  borderBottom: "1px solid #f3f4f6",
  fontSize: "0.85rem",
};
