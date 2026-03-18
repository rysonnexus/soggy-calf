import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Login from '../pages/Login.jsx'
import { AuthContext } from '../context/AuthContext.jsx'

const mockLogin = vi.fn()
const mockNavigate = vi.fn()

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, useNavigate: () => mockNavigate }
})

function renderLogin(loginImpl = mockLogin) {
  return render(
    <MemoryRouter>
      <AuthContext.Provider value={{ user: null, loading: false, login: loginImpl, logout: vi.fn(), isAdmin: false }}>
        <Login />
      </AuthContext.Provider>
    </MemoryRouter>
  )
}

describe('Login page', () => {
  beforeEach(() => {
    mockLogin.mockReset()
    mockNavigate.mockReset()
  })

  it('renders username input and PIN display', () => {
    renderLogin()
    expect(screen.getByLabelText(/name \/ username/i)).toBeTruthy()
    expect(screen.getByText(/enter the tavern/i)).toBeTruthy()
  })

  it('submit button is disabled without username and full PIN', () => {
    renderLogin()
    const btn = screen.getByText(/enter the tavern/i)
    expect(btn.closest('button').disabled).toBe(true)
  })

  it('shows error on wrong PIN (401)', async () => {
    const err = Object.assign(new Error('Unauthorized'), { status: 401 })
    mockLogin.mockRejectedValueOnce(err)

    renderLogin()
    fireEvent.change(screen.getByLabelText(/name \/ username/i), { target: { value: 'dm' } })

    // Click PIN digits 1, 2, 3, 4
    ;['1', '2', '3', '4'].forEach(d => fireEvent.click(screen.getByText(d)))

    fireEvent.click(screen.getByText(/enter the tavern/i))
    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy())
    expect(screen.getByRole('alert').textContent).toMatch(/incorrect/i)
  })

  it('shows locked error on 423', async () => {
    const err = Object.assign(new Error('Locked'), { status: 423 })
    mockLogin.mockRejectedValueOnce(err)

    renderLogin()
    fireEvent.change(screen.getByLabelText(/name \/ username/i), { target: { value: 'dm' } })
    ;['1', '2', '3', '4'].forEach(d => fireEvent.click(screen.getByText(d)))
    fireEvent.click(screen.getByText(/enter the tavern/i))
    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy())
    expect(screen.getByRole('alert').textContent).toMatch(/locked/i)
  })

  it('navigates to /admin for DM role', async () => {
    mockLogin.mockResolvedValueOnce({ role: 'DM', mustChangePIN: false })
    renderLogin()
    fireEvent.change(screen.getByLabelText(/name \/ username/i), { target: { value: 'dm' } })
    ;['1', '2', '3', '4'].forEach(d => fireEvent.click(screen.getByText(d)))
    fireEvent.click(screen.getByText(/enter the tavern/i))
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/admin', { replace: true }))
  })

  it('navigates to /dashboard for PLAYER role', async () => {
    mockLogin.mockResolvedValueOnce({ role: 'PLAYER', mustChangePIN: false })
    renderLogin()
    fireEvent.change(screen.getByLabelText(/name \/ username/i), { target: { value: 'player1' } })
    ;['1', '2', '3', '4'].forEach(d => fireEvent.click(screen.getByText(d)))
    fireEvent.click(screen.getByText(/enter the tavern/i))
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true }))
  })

  it('navigates to /change-pin when mustChangePIN is true', async () => {
    mockLogin.mockResolvedValueOnce({ role: 'DM', mustChangePIN: true })
    renderLogin()
    fireEvent.change(screen.getByLabelText(/name \/ username/i), { target: { value: 'dm' } })
    ;['1', '2', '3', '4'].forEach(d => fireEvent.click(screen.getByText(d)))
    fireEvent.click(screen.getByText(/enter the tavern/i))
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/change-pin', { replace: true }))
  })
})
