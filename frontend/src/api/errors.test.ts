import { describeError, getFieldErrors } from './errors'
import { ApiError } from './httpClient'

function validationError(errors: Record<string, { code: string; message: string }[]>) {
  return new ApiError(400, { detail: 'Invalid input.', errors })
}

describe('describeError', () => {
  it.each([
    [401, 'invalid_credentials', 'Usuario o contraseña incorrectos.'],
    [401, 'not_authenticated', 'Tu sesión expiró. Inicia sesión de nuevo.'],
    [403, 'permission_denied', 'No tienes permiso para realizar esta acción.'],
    [403, 'csrf_failed', 'La sesión de seguridad expiró. Recarga la página e inténtalo de nuevo.'],
    [404, 'not_found', 'No encontramos lo que buscas.'],
  ])('translates %i %s', (status, code, message) => {
    expect(describeError(new ApiError(status, { detail: 'English text', code }))).toBe(message)
  })

  it('never exposes the backend English message', () => {
    const error = new ApiError(403, {
      detail: 'You do not have permission',
      code: 'permission_denied',
    })

    expect(describeError(error)).not.toContain('permission to')
  })

  it('asks to review the data for a validation error without a field', () => {
    expect(describeError(new ApiError(400, {}))).toBe('Revisa los datos ingresados.')
  })

  it('describes connection failures', () => {
    expect(describeError(new TypeError('Failed to fetch'))).toBe(
      'No se pudo conectar con el servidor.',
    )
  })

  it.each([
    ['an unknown backend code', new ApiError(500, { code: 'something_new' })],
    ['an empty server error', new ApiError(500, null)],
    ['an unknown value', 'boom'],
  ])('falls back to a generic message for %s', (_label, error) => {
    expect(describeError(error)).toBe('Ocurrió un error inesperado. Inténtalo de nuevo.')
  })
})

describe('getFieldErrors', () => {
  it.each([
    ['required', 'Este campo es obligatorio.'],
    ['blank', 'Este campo no puede estar vacío.'],
    ['invalid_choice', 'Selecciona una opción válida.'],
    ['does_not_exist', 'La opción seleccionada ya no existe.'],
    ['future_date', 'La fecha de la visita no puede ser futura.'],
    ['teacher_not_in_school', 'El docente no pertenece al colegio seleccionado.'],
  ])('translates the %s code', (code, message) => {
    const error = validationError({ observations: [{ code, message: 'English' }] })

    expect(getFieldErrors(error)).toEqual({ observations: message })
  })

  it('maps the API field names to the form field names', () => {
    const error = validationError({
      school_id: [{ code: 'required', message: 'x' }],
      teacher_id: [{ code: 'teacher_not_in_school', message: 'x' }],
      visit_date: [{ code: 'future_date', message: 'x' }],
      visit_type: [{ code: 'invalid_choice', message: 'x' }],
    })

    expect(Object.keys(getFieldErrors(error)).sort()).toEqual([
      'schoolId',
      'teacherId',
      'visitDate',
      'visitType',
    ])
  })

  it('maps the specialist field of administrators', () => {
    const error = validationError({ specialist_id: [{ code: 'does_not_exist', message: 'x' }] })

    expect(getFieldErrors(error)).toEqual({ specialistId: 'La opción seleccionada ya no existe.' })
  })

  it('uses a date specific message for malformed dates', () => {
    const error = validationError({ visit_date: [{ code: 'invalid', message: 'x' }] })

    expect(getFieldErrors(error)).toEqual({ visitDate: 'Ingresa una fecha válida.' })
  })

  it('keeps only the first error of each field', () => {
    const error = validationError({
      observations: [
        { code: 'blank', message: 'x' },
        { code: 'required', message: 'y' },
      ],
    })

    expect(getFieldErrors(error)).toEqual({ observations: 'Este campo no puede estar vacío.' })
  })

  it('reports errors without a field under "form"', () => {
    const error = validationError({ non_field_errors: [{ code: 'invalid', message: 'x' }] })

    expect(getFieldErrors(error)).toEqual({ form: 'Ingresa un valor válido.' })
  })

  it('explains an inverted date range under "form"', () => {
    const error = validationError({ __all__: [{ code: 'invalid_range', message: 'x' }] })

    expect(getFieldErrors(error)).toEqual({
      form: 'La fecha «Desde» no puede ser posterior a «Hasta».',
    })
  })

  it('uses a generic message for codes it does not know', () => {
    const error = validationError({ observations: [{ code: 'max_length', message: 'x' }] })

    expect(getFieldErrors(error)).toEqual({ observations: 'Ingresa un valor válido.' })
  })

  it.each([
    ['a server error', new ApiError(500, { errors: {} })],
    ['a malformed body', new ApiError(400, 'not json')],
    ['a body without errors', new ApiError(400, { detail: 'x' })],
    ['an unrelated error', new Error('boom')],
  ])('returns nothing for %s', (_label, error) => {
    expect(getFieldErrors(error)).toEqual({})
  })
})
