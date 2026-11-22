import { ApiStatus } from '../features/health/ApiStatus'
import styles from './App.module.scss'

export function App() {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <h1>Registro de visitas</h1>
      </header>
      <main className={styles.main}>
        <p>Aplicación en construcción.</p>
      </main>
      <footer className={styles.footer}>
        <ApiStatus />
      </footer>
    </div>
  )
}
