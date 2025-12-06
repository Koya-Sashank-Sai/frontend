import React from "react";
import { Routes, Route } from "react-router-dom";
import LoginPage from "./components/LoginPage";
import TeacherDashboard from "./components/TeacherDashboard";
import CoordinatorDashboard from "./components/CoordinatorDashboard";
import DistrictDashboard from "./components/DistrictDashboard";
import AdminDashboard from "./components/AdminDashboard";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
      <Route path="/coordinator-dashboard" element={<CoordinatorDashboard />} />
      <Route path="/district-dashboard" element={<DistrictDashboard />} />
      <Route path="/admin-dashboard" element={<AdminDashboard />} />
    </Routes>
  );
}
