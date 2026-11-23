import { useState, type FormEvent } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import { describeError } from '../../api/errors'
import { Alert } from '../../components/Alert'
import { Button } from '../../components/Button'
import { Loading } from '../../components/Loading'
import { TextField } from '../../components/TextField'
import { useAuth } from './useAuth'
import styles from './LoginPage.module.scss'

interface LocationState {
  from?: { pathname: string }
}

interface LoginErrors {
  username?: string
  password?: string
}

function validate(username: string, password: string): LoginErrors {
  const errors: LoginErrors = {}
  if (!username.trim()) errors.username = 'Ingresa tu usuario.'
  if (!password) errors.password = 'Ingresa tu contraseña.'
  return errors
}

export function LoginPage() {
  const { status, login } = useAuth()
  const location = useLocation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<LoginErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (status === 'loading') {
    return <Loading />
  }

  if (status === 'authenticated') {
    const destination = (location.state as LocationState | null)?.from?.pathname ?? '/'
    return <Navigate to={destination} replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)

    const validationErrors = validate(username, password)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    setIsSubmitting(true)
    try {
      await login({ username: username.trim(), password })
    } catch (error) {
      setFormError(describeError(error))
      setIsSubmitting(false)
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.panel}>
        <header className={styles.header}>
          <h1>Iniciar sesión</h1>
          <p>Registro de visitas a colegios</p>
        </header>
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          {formError && <Alert>{formError}</Alert>}
          <TextField
            label="Usuario"
            name="username"
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            error={errors.username}
          />
          <TextField
            label="Contraseña"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            error={errors.password}
          />
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Ingresando…' : 'Ingresar'}
          </Button>
        </form>
      </div>
    </main>
  )
}
