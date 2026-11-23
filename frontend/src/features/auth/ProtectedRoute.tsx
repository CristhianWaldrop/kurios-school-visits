import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { Alert } from '../../components/Alert'
import { Button } from '../../components/Button'
import { Loading } from '../../components/Loading'
import { useAuth } from './useAuth'

export function ProtectedRoute() {
  const { status, retry } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return <Loading />
  }

  if (status === 'error') {
    return (
      <>
        <Alert>No se pudo verificar tu sesión. Revisa tu conexión e inténtalo de nuevo.</Alert>
        <Button variant="secondary" onClick={retry}>
          Reintentar
        </Button>
      </>
    )
  }

  if (status === 'anonymous') {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}
