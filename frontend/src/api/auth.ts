import { ApiError, apiRequest } from './httpClient'
import type { Specialist } from './types'

interface SpecialistWire {
  id: number
  username: string
  first_name: string
  last_name: string
  full_name: string
  email: string
  specialty: string
}

export interface Credentials {
  username: string
  password: string
}

function toSpecialist(wire: SpecialistWire): Specialist {
  return {
    id: wire.id,
    username: wire.username,
    firstName: wire.first_name,
    lastName: wire.last_name,
    fullName: wire.full_name,
    email: wire.email,
    specialty: wire.specialty,
  }
}

export async function fetchCsrfCookie(): Promise<void> {
  await apiRequest<void>('/auth/csrf/')
}

export async function login(credentials: Credentials): Promise<Specialist> {
  const wire = await apiRequest<SpecialistWire>('/auth/login/', {
    method: 'POST',
    body: credentials,
  })
  return toSpecialist(wire)
}

export async function logout(): Promise<void> {
  await apiRequest<void>('/auth/logout/', { method: 'POST' })
}

export async function fetchCurrentSpecialist(signal?: AbortSignal): Promise<Specialist | null> {
  try {
    return toSpecialist(await apiRequest<SpecialistWire>('/auth/me/', { signal }))
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
      return null
    }
    throw error
  }
}
