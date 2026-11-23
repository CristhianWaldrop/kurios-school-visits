import { Route, Routes } from 'react-router-dom'

import { NotFoundPage } from '../components/NotFoundPage'
import { LoginPage } from '../features/auth/LoginPage'
import { ProtectedRoute } from '../features/auth/ProtectedRoute'
import { HomePage } from '../features/home/HomePage'
import { EditVisitPage } from '../features/visits/EditVisitPage'
import { NewVisitPage } from '../features/visits/NewVisitPage'
import { VisitDetailPage } from '../features/visits/VisitDetailPage'
import { VisitsListPage } from '../features/visits/VisitsListPage'
import { AppLayout } from './AppLayout'

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="visits" element={<VisitsListPage />} />
          <Route path="visits/new" element={<NewVisitPage />} />
          <Route path="visits/:visitId" element={<VisitDetailPage />} />
          <Route path="visits/:visitId/edit" element={<EditVisitPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  )
}
