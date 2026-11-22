import { useApiHealth } from './useApiHealth'

export function ApiStatus() {
  const { isPending, isError } = useApiHealth()

  if (isPending) {
    return <span role="status">Comprobando API…</span>
  }

  return <span role="status">{isError ? 'API sin conexión' : 'API operativa'}</span>
}
