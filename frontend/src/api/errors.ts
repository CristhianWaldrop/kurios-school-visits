import { ApiError } from './httpClient'

export type FieldErrors = Record<string, string>

const FIELD_NAMES: Record<string, string> = {
  school_id: 'schoolId',
  teacher_id: 'teacherId',
  specialist_id: 'specialistId',
  visit_date: 'visitDate',
  visit_type: 'visitType',
  non_field_errors: 'form',
  __all__: 'form',
}

const VALIDATION_MESSAGES: Record<string, string> = {
  required: 'Este campo es obligatorio.',
  blank: 'Este campo no puede estar vacío.',
  null: 'Este campo es obligatorio.',
  invalid: 'Ingresa un valor válido.',
  invalid_choice: 'Selecciona una opción válida.',
  does_not_exist: 'La opción seleccionada ya no existe.',
  incorrect_type: 'Ingresa un valor válido.',
  future_date: 'La fecha de la visita no puede ser futura.',
  invalid_range: 'La fecha «Desde» no puede ser posterior a «Hasta».',
  teacher_not_in_school: 'El docente no pertenece al colegio seleccionado.',
}

const DATE_FIELD_INVALID = 'Ingresa una fecha válida.'
const FALLBACK_VALIDATION_MESSAGE = 'Ingresa un valor válido.'

const REQUEST_MESSAGES: Record<string, string> = {
  invalid_credentials: 'Usuario o contraseña incorrectos.',
  not_authenticated: 'Tu sesión expiró. Inicia sesión de nuevo.',
  permission_denied: 'No tienes permiso para realizar esta acción.',
  csrf_failed: 'La sesión de seguridad expiró. Recarga la página e inténtalo de nuevo.',
  not_found: 'No encontramos lo que buscas.',
}

const NETWORK_MESSAGE = 'No se pudo conectar con el servidor.'
const UNEXPECTED_MESSAGE = 'Ocurrió un error inesperado. Inténtalo de nuevo.'

interface BackendError {
  code: string
  message: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isBackendError(value: unknown): value is BackendError {
  return isRecord(value) && typeof value.code === 'string'
}

function readErrorCode(body: unknown): string | null {
  return isBackendError(body) ? body.code : null
}

function readValidationErrors(body: unknown): Record<string, BackendError[]> | null {
  if (!isRecord(body) || !isRecord(body.errors)) return null
  const errors: Record<string, BackendError[]> = {}
  for (const [field, entries] of Object.entries(body.errors)) {
    if (Array.isArray(entries)) {
      errors[field] = entries.filter(isBackendError)
    }
  }
  return errors
}

export function getFieldErrors(error: unknown): FieldErrors {
  if (!(error instanceof ApiError) || error.status !== 400) return {}

  const errors = readValidationErrors(error.body)
  if (!errors) return {}

  const fieldErrors: FieldErrors = {}
  for (const [field, entries] of Object.entries(errors)) {
    const first = entries[0]
    if (!first) continue
    const name = FIELD_NAMES[field] ?? field
    const isDateFormatError = name === 'visitDate' && first.code === 'invalid'
    fieldErrors[name] = isDateFormatError
      ? DATE_FIELD_INVALID
      : (VALIDATION_MESSAGES[first.code] ?? FALLBACK_VALIDATION_MESSAGE)
  }
  return fieldErrors
}

export function describeError(error: unknown): string {
  if (error instanceof ApiError) {
    const code = readErrorCode(error.body)
    const known = code ? REQUEST_MESSAGES[code] : undefined
    if (known) return known
    if (error.status === 400) return 'Revisa los datos ingresados.'
    return UNEXPECTED_MESSAGE
  }
  if (error instanceof TypeError) return NETWORK_MESSAGE
  return UNEXPECTED_MESSAGE
}
