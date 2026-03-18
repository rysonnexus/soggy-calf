import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faKey, faDeleteLeft, faCircleNotch } from '@fortawesome/free-solid-svg-icons'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../services/api.js'

const PIN_LENGTH = 4

function MiniPinPad({ pin, setPin }) {
  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', null, '0', 'del']
  return (
    <div>
      <div className="flex justify-center gap-3 my-3">
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <div key={i} className="w-10 h-12 border-2 rounded flex items-center justify-center text-xl font-bold border-tavern-amber/40 bg-tavern-dark text-tavern-gold">
            {pin[i] ? '●' : ''}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
        {digits.map((d, i) => {
          if (d === null) return <div key={i} />
          if (d === 'del') {
            return (
              <button key={i} type="button" onClick={() => setPin((p) => p.slice(0, -1))}
                className="h-12 rounded bg-tavern-brown border border-tavern-amber/30 text-tavern-amber hover:bg-tavern-amber/20 transition-colors flex items-center justify-center">
                <FontAwesomeIcon icon={faDeleteLeft} />
              </button>
            )
          }
          return (
            <button key={i} type="button" onClick={() => setPin((p) => p.length < PIN_LENGTH ? p + d : p)}
              disabled={pin.length >= PIN_LENGTH}
              className="h-12 rounded bg-tavern-brown border border-tavern-amber/30 text-tavern-parchment text-lg font-semibold hover:bg-tavern-amber/20 hover:border-tavern-amber transition-colors disabled:opacity-40">
              {d}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function ChangePIN() {
  const { accessToken, logout, user } = useAuth()
  const navigate = useNavigate()
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [step, setStep] = useState('new') // 'new' | 'confirm'
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleNext = () => {
    if (newPin.length !== PIN_LENGTH) return
    setStep('confirm')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (newPin !== confirmPin) {
      setError('PINs do not match. Please try again.')
      setConfirmPin('')
      return
    }
    setError('')
    setLoading(true)
    try {
      await api.post('/auth/change-pin', { newPin }, { token: accessToken })
      navigate(user.role === 'DM' ? '/admin' : '/dashboard', { replace: true })
    } catch (err) {
      setError(err.message || 'Failed to update PIN. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="card w-full max-w-sm">
        <div className="text-center mb-6">
          <FontAwesomeIcon icon={faKey} className="text-tavern-amber text-3xl mb-3" />
          <h1 className="font-display text-xl font-bold text-tavern-gold">Change Your PIN</h1>
          <p className="text-tavern-muted text-sm mt-1">
            {user?.mustChangePIN ? 'You must set a new PIN before entering the tavern.' : 'Update your 4-digit PIN.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {step === 'new' ? (
            <div>
              <label className="block text-sm text-tavern-muted mb-1">New PIN</label>
              <MiniPinPad pin={newPin} setPin={setNewPin} />
              <button type="button" onClick={handleNext} disabled={newPin.length !== PIN_LENGTH}
                className="btn-primary w-full mt-4">Next</button>
            </div>
          ) : (
            <div>
              <label className="block text-sm text-tavern-muted mb-1">Confirm PIN</label>
              <MiniPinPad pin={confirmPin} setPin={setConfirmPin} />
              {error && <p className="text-red-400 text-sm text-center mt-2" role="alert">{error}</p>}
              <div className="flex gap-2 mt-4">
                <button type="button" onClick={() => { setStep('new'); setConfirmPin(''); setError('') }}
                  className="btn-secondary flex-1">Back</button>
                <button type="submit" disabled={loading || confirmPin.length !== PIN_LENGTH}
                  className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {loading && <FontAwesomeIcon icon={faCircleNotch} spin />}
                  Save PIN
                </button>
              </div>
            </div>
          )}
          {!user?.mustChangePIN && (
            <button type="button" onClick={logout} className="text-tavern-muted text-sm underline w-full text-center mt-2">
              Cancel
            </button>
          )}
        </form>
      </div>
    </div>
  )
}
