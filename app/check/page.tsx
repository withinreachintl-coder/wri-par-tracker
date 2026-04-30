'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase'

type ParItem = { id: string; name: string; unit: string; par_minimum: number }
type Step = 'pin' | 'count' | 'success'

export default function CheckPage() {
  const router = useRouter()
  const [orgId, setOrgId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState<Step>('pin')
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState('')
  const [pinLoading, setPinLoading] = useState(false)
  const [items, setItems] = useState<ParItem[]>([])
  const [counts, setCounts] = useState<Record<string, string>>({})
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [hasShortfall, setHasShortfall] = useState(false)
  const [shortfallItems, setShortfallItems] = useState<ParItem[]>([])

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // Manager is logged in — get their org
        const { data: userRecord } = await supabase.from('users').select('org_id').eq('id', user.id).single()
        if (userRecord?.org_id) setOrgId(userRecord.org_id)
      }
      // Staff with no session just enter PIN — orgId will be fetched via PIN validation
      setLoading(false)
    }
    init()
  }, [])

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pin.length !== 4) { setPinError('Enter a 4-digit PIN'); return }

    setPinLoading(true)
    setPinError('')

    // If no orgId (staff with no session), we need to discover org by PIN
    // For v1: manager must share the check URL with ?org= param, or staff enter PIN on manager's device
    // We'll look up by PIN across orgs (unique enough for single-restaurant use)
    const resolvedOrgId = orgId

    if (!resolvedOrgId) {
      setPinError('No organization found. Ask your manager to share the check link.')
      setPinLoading(false)
      return
    }

    try {
      const res = await fetch('/api/check/validate-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin, orgId: resolvedOrgId }),
      })
      const data = await res.json()

      if (!res.ok || !data.valid) {
        setPinError(data.error || 'Incorrect PIN. Try again.')
        setPinLoading(false)
        return
      }

      setItems(data.items || [])
      const initialCounts: Record<string, string> = {}
      data.items.forEach((item: ParItem) => { initialCounts[item.id] = '' })
      setCounts(initialCounts)
      setStep('count')
    } catch {
      setPinError('Network error. Please try again.')
    }
    setPinLoading(false)
  }

  const handleSubmit = async () => {
    const allFilled = items.every(item => counts[item.id] !== '')
    if (!allFilled) { return }

    setSubmitting(true)
    try {
      const submitItems = items.map(item => ({
        parItemId: item.id,
        onHand: parseFloat(counts[item.id]) || 0,
      }))

      const res = await fetch('/api/check/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId, pin, items: submitItems, note: note.trim() || undefined }),
      })
      const data = await res.json()

      if (!res.ok) {
        console.error('Submit error:', data.error)
        return
      }

      const short = items.filter(item => (parseFloat(counts[item.id]) || 0) < item.par_minimum)
      setHasShortfall(data.hasShortfall)
      setShortfallItems(short)
      setStep('success')
    } catch (err) {
      console.error('Submit failed:', err)
    }
    setSubmitting(false)
  }

  if (loading) return (
    <main style={{ minHeight: '100vh', background: '#1C1917', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ fontFamily: 'var(--font-dmsans)', color: '#F5F0E8' }}>Loading...</p>
    </main>
  )

  return (
    <main style={{ minHeight: '100vh', background: '#1C1917' }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: '560px', margin: '0 auto', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: '22px', fontWeight: 700, color: '#F5F0E8' }}>Par Check</h1>
            <p style={{ fontFamily: 'var(--font-dmsans)', fontSize: '13px', color: '#D97706' }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          {step !== 'pin' && (
            <button
              onClick={() => router.push('/setup')}
              style={{ fontFamily: 'var(--font-dmsans)', fontSize: '12px', color: '#D97706', background: 'none', border: '1px solid rgba(217,119,6,0.3)', borderRadius: '4px', padding: '6px 12px', cursor: 'pointer' }}
            >
              Setup
            </button>
          )}
        </div>
      </div>

      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '40px 24px' }}>

        {/* STEP: PIN Entry */}
        {step === 'pin' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔑</div>
            <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '24px', fontWeight: 700, color: '#F5F0E8', marginBottom: '8px' }}>Enter Staff PIN</h2>
            <p style={{ fontFamily: 'var(--font-dmsans)', fontSize: '14px', color: '#F5F0E8', marginBottom: '32px' }}>
              Ask your manager for the 4-digit PIN to start the par check.
            </p>

            <form onSubmit={handlePinSubmit} style={{ maxWidth: '240px', margin: '0 auto' }}>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={pin}
                onChange={e => { setPin(e.target.value.replace(/\D/g, '').slice(0, 4)); setPinError('') }}
                placeholder="••••"
                id="pin-entry"
                name="pin"
                maxLength={4}
                autoFocus
                style={{
                  width: '100%',
                  fontFamily: 'var(--font-dmsans)',
                  fontSize: '40px',
                  fontWeight: 700,
                  letterSpacing: '16px',
                  textAlign: 'center',
                  color: '#F5F0E8',
                  background: 'rgba(255,255,255,0.06)',
                  border: `2px solid ${pinError ? '#EF4444' : 'rgba(255,255,255,0.12)'}`,
                  borderRadius: '8px',
                  padding: '16px',
                  outline: 'none',
                  marginBottom: '16px',
                }}
              />
              {pinError && <p style={{ fontFamily: 'var(--font-dmsans)', fontSize: '13px', color: '#EF4444', marginBottom: '16px' }}>{pinError}</p>}
              <button
                type="submit"
                disabled={pinLoading || pin.length !== 4}
                style={{ width: '100%', fontFamily: 'var(--font-dmsans)', fontSize: '15px', fontWeight: 600, color: '#1C1917', background: pin.length !== 4 || pinLoading ? '#6B5B4E' : '#D97706', border: 'none', borderRadius: '6px', padding: '14px', cursor: pin.length !== 4 || pinLoading ? 'not-allowed' : 'pointer' }}
              >
                {pinLoading ? 'Verifying...' : 'Start Check →'}
              </button>
            </form>
          </div>
        )}

        {/* STEP: Count Form */}
        {step === 'count' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '20px', fontWeight: 700, color: '#F5F0E8' }}>Count on-hand quantities</h2>
              <span style={{ fontFamily: 'var(--font-dmsans)', fontSize: '13px', color: '#D97706' }}>
                {Object.values(counts).filter(v => v !== '').length}/{items.length} done
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              {items.map(item => {
                const onHand = parseFloat(counts[item.id] || '0') || 0
                const isShort = counts[item.id] !== '' && onHand < item.par_minimum
                return (
                  <div
                    key={item.id}
                    style={{
                      background: isShort ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${isShort ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.08)'}`,
                      borderRadius: '8px',
                      padding: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '16px',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'var(--font-dmsans)', fontSize: '15px', fontWeight: 500, color: '#F5F0E8' }}>{item.name}</div>
                      <div style={{ fontFamily: 'var(--font-dmsans)', fontSize: '12px', color: '#D97706', marginTop: '2px' }}>
                        Par: {item.par_minimum} {item.unit}
                        {isShort && <span style={{ color: '#EF4444', marginLeft: '8px' }}>⚠ Short by {(item.par_minimum - onHand).toFixed(1)}</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      <input
                        type="number"
                        id={`count-${item.id}`}
                        name={`count-${item.id}`}
                        inputMode="decimal"
                        value={counts[item.id]}
                        onChange={e => setCounts(prev => ({ ...prev, [item.id]: e.target.value }))}
                        placeholder="0"
                        min={0}
                        step={0.5}
                        style={{
                          width: '80px',
                          height: '44px',
                          fontFamily: 'var(--font-dmsans)',
                          fontSize: '18px',
                          fontWeight: 600,
                          textAlign: 'center',
                          color: '#F5F0E8',
                          background: 'rgba(255,255,255,0.08)',
                          border: `1px solid ${isShort ? '#EF4444' : 'rgba(255,255,255,0.15)'}`,
                          borderRadius: '6px',
                          padding: '0 8px',
                          outline: 'none',
                          WebkitAppearance: 'none',
                          MozAppearance: 'textfield',
                          boxSizing: 'border-box',
                        }}
                      />
                      <span style={{ fontFamily: 'var(--font-dmsans)', fontSize: '12px', color: '#D97706', minWidth: '30px' }}>{item.unit}</span>
                    </div>
                  </div>
                )
              })}
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontFamily: 'var(--font-dmsans)', fontSize: '13px', color: '#F5F0E8', marginBottom: '6px' }}>Note (optional)</label>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Any context for the manager..."
                rows={2}
                style={{ width: '100%', fontFamily: 'var(--font-dmsans)', fontSize: '14px', color: '#F5F0E8', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '4px', padding: '10px 12px', resize: 'none' as const, outline: 'none' }}
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting || !items.every(item => counts[item.id] !== '')}
              style={{
                width: '100%',
                fontFamily: 'var(--font-dmsans)',
                fontSize: '15px',
                fontWeight: 600,
                color: '#1C1917',
                background: submitting || !items.every(item => counts[item.id] !== '') ? '#6B5B4E' : '#D97706',
                border: 'none',
                borderRadius: '6px',
                padding: '16px',
                cursor: submitting || !items.every(item => counts[item.id] !== '') ? 'not-allowed' : 'pointer',
              }}
            >
              {submitting ? 'Submitting...' : 'Submit Par Check →'}
            </button>
          </div>
        )}

        {/* STEP: Success */}
        {step === 'success' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '56px', marginBottom: '20px' }}>{hasShortfall ? '⚠️' : '✅'}</div>
            <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '26px', fontWeight: 700, color: '#F5F0E8', marginBottom: '12px' }}>
              {hasShortfall ? 'Check submitted — shortfalls found' : 'All items at par'}
            </h2>
            <p style={{ fontFamily: 'var(--font-dmsans)', fontSize: '15px', color: '#F5F0E8', marginBottom: '32px', lineHeight: 1.6 }}>
              {hasShortfall
                ? `${shortfallItems.length} item${shortfallItems.length !== 1 ? 's are' : ' is'} below par. Your manager has been alerted.`
                : 'Par check complete. Everything looks good.'}
            </p>

            {hasShortfall && shortfallItems.length > 0 && (
              <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', padding: '16px', marginBottom: '32px', textAlign: 'left' }}>
                {shortfallItems.map(item => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(239,68,68,0.1)' }}>
                    <span style={{ fontFamily: 'var(--font-dmsans)', fontSize: '14px', color: '#F5F0E8' }}>{item.name}</span>
                    <span style={{ fontFamily: 'var(--font-dmsans)', fontSize: '14px', color: '#EF4444', fontWeight: 600 }}>
                      {parseFloat(counts[item.id] || '0').toFixed(1)} / {item.par_minimum} {item.unit}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => { setStep('pin'); setPin(''); setCounts({}); setNote('') }}
              style={{ fontFamily: 'var(--font-dmsans)', fontSize: '14px', fontWeight: 500, color: '#1C1917', background: '#D97706', border: 'none', borderRadius: '6px', padding: '12px 32px', cursor: 'pointer' }}
            >
              Start another check
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
