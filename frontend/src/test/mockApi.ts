import { vi } from 'vitest'

export interface MockReply {
  status?: number
  body?: unknown
}

export interface MockCall {
  method: string
  path: string
  body: unknown
}

type Route = MockReply | ((call: MockCall) => MockReply | Promise<MockReply>)

export function mockApi(routes: Record<string, Route>) {
  const calls: MockCall[] = []

  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const method = init?.method ?? 'GET'
    const path = String(input)
    const call: MockCall = {
      method,
      path,
      body: init?.body ? JSON.parse(String(init.body)) : undefined,
    }
    calls.push(call)

    const route = routes[`${method} ${path}`] ?? routes[`${method} *`]
    if (!route) {
      throw new Error(`Unmocked request: ${method} ${path}`)
    }

    const reply = typeof route === 'function' ? await route(call) : route
    const status = reply.status ?? 200
    const hasBody = status !== 204 && reply.body !== undefined
    return new Response(hasBody ? JSON.stringify(reply.body) : null, { status })
  })

  vi.stubGlobal('fetch', fetchMock)

  return { calls, fetchMock }
}
