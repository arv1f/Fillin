import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { SceneContentProvider } from './contexts/SceneContentContext'
import { AdminPage } from './pages/AdminPage'
import { TourPage } from './pages/TourPage'

export default function App() {
  return (
    <BrowserRouter>
      <SceneContentProvider>
        <Routes>
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/" element={<Navigate to="/tour/00" replace />} />
          <Route path="/tour/:sceneId" element={<TourPage />} />
          <Route path="*" element={<Navigate to="/tour/00" replace />} />
        </Routes>
      </SceneContentProvider>
    </BrowserRouter>
  )
}
