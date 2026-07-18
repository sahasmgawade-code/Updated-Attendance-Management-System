import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import AddBatch from './pages/AddBatch.jsx';
import GenerateQr from './pages/GenerateQr.jsx';
import ScanAttendance from './pages/ScanAttendance.jsx';
import Students from './pages/Students.jsx';
import EditAttendance from './pages/EditAttendance.jsx';
import Reports from './pages/Reports.jsx';
function StubPage({ title }) {
  return (
    <div className="text-center py-24">
      <p className="font-display text-2xl text-ink/70 mb-2">{title}</p>
      <p className="text-sm text-ink/50 font-mono">not built yet</p>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/scan/:token" element={<ScanAttendance />} />
      <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
      <Route path="/batches/new" element={<ProtectedRoute><Layout><AddBatch /></Layout></ProtectedRoute>} />
      <Route path="/students" element={<ProtectedRoute><Layout><Students /></Layout></ProtectedRoute>} />
      <Route path="/generate-qr" element={<ProtectedRoute><Layout><GenerateQr /></Layout></ProtectedRoute>} />
      <Route path="/edit-attendance" element={<ProtectedRoute><Layout><EditAttendance /></Layout></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><Layout><Reports /></Layout></ProtectedRoute>} />
    </Routes>
  );
}