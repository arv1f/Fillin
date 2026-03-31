import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AdminPage } from './pages/AdminPage'
import { TourPage } from './pages/TourPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/" element={<Navigate to="/tour/00" replace />} />
        <Route path="/tour/:sceneId" element={<TourPage />} />
        <Route path="*" element={<Navigate to="/tour/00" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
