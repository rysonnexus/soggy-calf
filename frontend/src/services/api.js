const BASE_URL = '/api'

async function request(path, options = {}) {
  const { method = 'GET', body, token, skipAuth = false } = options

  const headers = { 'Content-Type': 'application/json' }
  if (token && !skipAuth) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    credentials: 'include', // send httpOnly cookie for refresh token
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }))
    const error = new Error(err.message || 'Request failed')
    error.status = res.status
    error.data = err
    throw error
  }

  return res.json()
}

export const api = {
  get:    (path, opts = {}) => request(path, { ...opts, method: 'GET' }),
  post:   (path, body, opts = {}) => request(path, { ...opts, method: 'POST', body }),
  patch:  (path, body, opts = {}) => request(path, { ...opts, method: 'PATCH', body }),
  delete: (path, opts = {}) => request(path, { ...opts, method: 'DELETE' }),
}
