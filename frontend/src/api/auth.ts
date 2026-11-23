import { ApiError, apiRequest } from './httpClient'
import type { CurrentUser, Role } from './types'

interface CurrentUserWire {
  id: number
  username: string
  first_name: string
  last_name: string
  full_name: string
  email: string
  role: Role
  specialist_id: number | null
  specialty: string
}

export interface Credentials {
  username: string
  password: string
}

function toCurrentUser(wire: CurrentUserWire): CurrentUser {
  return {
    id: wire.id,
    username: wire.username,
    firstName: wire.first_name,
    lastName: wire.last_name,
    fullName: wire.full_name,
    email: wire.email,
    role: wire.role,
    specialistId: wire.specialist_id,
    specialty: wire.specialty,
  }
}

export async function fetchCsrfCookie(): Promise<void> {
  await apiRequest<void>('/auth/csrf/')
}

export async function login(credentials: Credentials): Promise<CurrentUser> {
  const wire = await apiRequest<CurrentUserWire>('/auth/login/', {
    method: 'POST',
    body: credentials,
  })
  return toCurrentUser(wire)
}

export async function logout(): Promise<void> {
  await apiRequest<void>('/auth/logout/', { method: 'POST' })
}

export async function fetchCurrentUser(signal?: AbortSignal): Promise<CurrentUser | null> {
  try {
    return toCurrentUser(await apiRequest<CurrentUserWire>('/auth/me/', { signal }))
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
      return null
    }
    throw error
  }
}
