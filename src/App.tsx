import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { TourPage } from './pages/TourPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/tour/00" replace />} />
        <Route path="/tour/:sceneId" element={<TourPage />} />
        <Route path="*" element={<Navigate to="/tour/00" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
