import { Link, NavLink, Outlet } from 'react-router-dom'

import { Button } from '../components/Button'
import { useAuth } from '../features/auth/useAuth'
import styles from './AppLayout.module.scss'

function navLinkClassName({ isActive }: { isActive: boolean }): string {
  return [styles.link, isActive && styles.active].filter(Boolean).join(' ')
}

export function AppLayout() {
  const { user, logout } = useAuth()

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.bar}>
          <Link to="/" className={styles.brand}>
            Registro de visitas
          </Link>
          <nav className={styles.nav} aria-label="Principal">
            <NavLink to="/" end className={navLinkClassName}>
              Inicio
            </NavLink>
            <NavLink to="/visits" className={navLinkClassName}>
              Visitas
            </NavLink>
          </nav>
          <div className={styles.session}>
            <span>{user?.fullName}</span>
            <Button variant="ghost" onClick={() => void logout()}>
              Cerrar sesión
            </Button>
          </div>
        </div>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}
