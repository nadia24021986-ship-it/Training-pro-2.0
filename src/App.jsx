import { Routes, Route, Navigate } from 'react-router-dom'
import AdminDashboard from './pages/AdminDashboard.jsx'
import SessionDetail from './pages/SessionDetail.jsx'
import MateriViewer from './pages/MateriViewer.jsx'
import SoalViewer from './pages/SoalViewer.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/admin" replace />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/admin/:sessionId" element={<SessionDetail />} />
      <Route path="/materi/:code" element={<MateriViewer />} />
      <Route path="/soal/:code" element={<SoalViewer />} />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  )
}

