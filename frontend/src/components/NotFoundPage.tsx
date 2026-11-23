import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <>
      <h1>Página no encontrada</h1>
      <p>
        La dirección que buscas no existe. <Link to="/">Volver al inicio</Link>
      </p>
    </>
  )
}
