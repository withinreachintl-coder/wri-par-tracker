'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase'

type ParItem = { id?: string; name: string; unit: string; par_minimum: number; sort_order: number }
type Tab = 'par-list' | 'pin' | 'alerts'

export default function SetupPage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('par-list')
  const [orgId, setOrgId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState<Tab | null>(null)
  const [error, setError] = useState('')

  // Par list state
  const [items, setItems] = useState<ParItem[]>([])

  // PIN state
  const [pin, setPin] = useState('')
  const [pinConfirm, setPinConfirm] = useState('')

  // Alert email state
  const [alertEmails, setAlertEmails] = useState('')

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: userRecord } = await supabase.from('users').select('org_id').eq('id', user.id).single()
      if (!userRecord?.org_id) { router.push('/login'); return }
      setOrgId(userRecord.org_id)

      // Load existing par items
      const { data: existingItems } = await supabase
        .from('par_items')
        .select('*')
        .eq('org_id', userRecord.org_id)
        .eq('active', true)
        .order('sort_order')

      if (existingItems?.length) setItems(existingItems)

      // Load org config
      const { data: org } = await supabase
        .from('organizations')
        .select('staff_pin, alert_emails')
        .eq('id', userRecord.org_id)
        .single()

      if (org?.staff_pin) setPin(org.staff_pin)
      if (org?.alert_emails?.length) setAlertEmails(org.alert_emails.join('\n'))

      setLoading(false)
    }
    init()
  }, [router])

  const addItem = () => setItems(prev => [...prev, { name: '', unit: '', par_minimum: 0, sort_order: prev.length }])
  const removeItem = (i: number) => setItems(prev => prev.filter((_, idx) => idx !== i))
  const updateItem = (i: number, field: keyof ParItem, value: string | number) => {
    setItems(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item))
  }

  const saveParList = async () => {
    if (!orgId) return
    if (items.some(item => !item.name.trim() || !item.unit.trim())) {
      setError('All items must have a name and unit'); return
    }
    setSaving(true); setError('')
    const supabase = createClient()

    // Delete existing items and re-insert (simple approach for v1)
    await supabase.from('par_items').delete().eq('org_id', orgId)

    if (items.length > 0) {
      const { error: insertError } = await supabase.from('par_items').insert(
        items.map((item, i) => ({
          org_id: orgId,
          name: item.name.trim(),
          unit: item.unit.trim(),
          par_minimum: Number(item.par_minimum),
          sort_order: i,
          active: true,
        }))
      )
      if (insertError) { setError(insertError.message); setSaving(false); return }
    }

    setSaving(false); setSaved('par-list')
    setTimeout(() => setSaved(null), 2000)
  }

  const savePin = async () => {
    if (!orgId) return
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) { setError('PIN must be exactly 4 digits'); return }
    if (pin !== pinConfirm) { setError('PINs do not match'); return }
    setSaving(true); setError('')
    const supabase = createClient()
    const { error: updateError } = await supabase.from('organizations').update({ staff_pin: pin }).eq('id', orgId)
    if (updateError) { setError(updateError.message); setSaving(false); return }
    setSaving(false); setSaved('pin')
    setTimeout(() => setSaved(null), 2000)
  }

  const saveAlerts = async () => {
    if (!orgId) return
    setSaving(true); setError('')
    const emails = alertEmails.split(/[\n,]/).map(e => e.trim()).filter(Boolean)
    const valid = emails.every(e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))
    if (emails.length > 0 && !valid) { setError('One or more email addresses are invalid'); setSaving(false); return }
    const supabase = createClient()
    const { error: updateError } = await supabase
      .from('organizations')
      .update({ alert_emails: emails.length > 0 ? emails : null })
      .eq('id', orgId)
    if (updateError) { setError(updateError.message); setSaving(false); return }
    setSaving(false); setSaved('alerts')
    setTimeout(() => setSaved(null), 2000)
  }

  const tabStyle = (t: Tab): React.CSSProperties => ({
    fontFamily: 'var(--font-dmsans)',
    fontSize: '14px',
    fontWeight: tab === t ? 600 : 400,
    color: tab === t ? '#1C1917' : '#6B5B4E',
    background: tab === t ? '#D97706' : 'transparent',
    border: 'none',
    borderRadius: '4px',
    padding: '8px 20px',
    cursor: 'pointer',
  })

  if (loading) return (
    <main style={{ minHeight: '100vh', background: '#FAFAF9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ fontFamily: 'var(--font-dmsans)', color: '#1C1917' }}>Loading...</p>
    </main>
  )

  return (
    <main style={{ minHeight: '100vh', background: '#FAFAF9', color: '#1C1917' }}>
      {/* Header */}
      <div style={{ background: '#1C1917', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: '22px', fontWeight: 700, color: '#F5F0E8' }}>Par Setup</h1>
            <p style={{ fontFamily: 'var(--font-dmsans)', fontSize: '13px', color: '#D97706' }}>Configure your par list, staff PIN, and alert emails</p>
          </div>
          <button
            onClick={() => router.push('/check')}
            style={{ fontFamily: 'var(--font-dmsans)', fontSize: '13px', fontWeight: 500, color: '#D97706', background: 'none', border: '1px solid rgba(217,119,6,0.4)', borderRadius: '4px', padding: '8px 16px', cursor: 'pointer' }}
          >
            Go to Check →
          </button>
        </div>

        {/* Tabs */}
        <div style={{ maxWidth: '680px', margin: '0 auto', padding: '0 24px 16px', display: 'flex', gap: '4px' }}>
          <button style={tabStyle('par-list')} onClick={() => { setError(''); setTab('par-list') }}>Par List</button>
          <button style={tabStyle('pin')} onClick={() => { setError(''); setTab('pin') }}>Staff PIN</button>
          <button style={tabStyle('alerts')} onClick={() => { setError(''); setTab('alerts') }}>Alert Email</button>
        </div>
      </div>

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '32px 24px' }}>
        {error && (
          <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px', padding: '12px 16px', marginBottom: '16px' }}>
            <p style={{ fontFamily: 'var(--font-dmsans)', fontSize: '13px', color: '#EF4444' }}>{error}</p>
          </div>
        )}

        {/* TAB: Par List */}
        {tab === 'par-list' && (
          <div>
            <div style={{ background: '#FFFFFF', border: '1px solid #E5E0D8', borderRadius: '8px', padding: '24px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ fontFamily: 'var(--font-dmsans)', fontSize: '13px', fontWeight: 600, color: '#6B5B4E', letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>Items</h2>
                <span style={{ fontFamily: 'var(--font-dmsans)', fontSize: '12px', color: '#6B5B4E' }}>{items.length} item{items.length !== 1 ? 's' : ''}</span>
              </div>

              {items.length === 0 && (
                <p style={{ fontFamily: 'var(--font-dmsans)', fontSize: '14px', color: '#6B5B4E', textAlign: 'center', padding: '24px 0' }}>
                  No items yet. Add your first par item below.
                </p>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                {items.map((item, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 100px 32px', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="text" value={item.name} onChange={e => updateItem(i, 'name', e.target.value)} placeholder="Item name (e.g. Chicken Breast)"
                      style={{ fontFamily: 'var(--font-dmsans)', fontSize: '14px', color: '#1C1917', border: '1px solid #E5E0D8', borderRadius: '4px', padding: '9px 12px' }}
                    />
                    <input
                      type="text" value={item.unit} onChange={e => updateItem(i, 'unit', e.target.value)} placeholder="Unit (lbs, cases)"
                      style={{ fontFamily: 'var(--font-dmsans)', fontSize: '14px', color: '#1C1917', border: '1px solid #E5E0D8', borderRadius: '4px', padding: '9px 12px' }}
                    />
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontFamily: 'var(--font-dmsans)', fontSize: '12px', color: '#6B5B4E' }}>Par:</span>
                      <input
                        type="number" value={item.par_minimum || ''} onChange={e => updateItem(i, 'par_minimum', Number(e.target.value))} min={0} step={0.5} placeholder="0"
                        style={{ width: '100%', fontFamily: 'var(--font-dmsans)', fontSize: '14px', color: '#1C1917', border: '1px solid #E5E0D8', borderRadius: '4px', padding: '9px 8px 9px 36px' }}
                      />
                    </div>
                    <button onClick={() => removeItem(i)} style={{ color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', padding: '0 4px' }}>×</button>
                  </div>
                ))}
              </div>

              <button
                onClick={addItem}
                style={{ width: '100%', fontFamily: 'var(--font-dmsans)', fontSize: '13px', color: '#D97706', background: 'none', border: '1px dashed rgba(217,119,6,0.4)', borderRadius: '4px', padding: '10px', cursor: 'pointer' }}
              >
                + Add item
              </button>
            </div>

            <button
              onClick={saveParList} disabled={saving}
              style={{ width: '100%', fontFamily: 'var(--font-dmsans)', fontSize: '15px', fontWeight: 600, color: '#1C1917', background: saving ? '#A8A29E' : saved === 'par-list' ? '#16A34A' : '#D97706', border: 'none', borderRadius: '6px', padding: '14px', cursor: saving ? 'not-allowed' : 'pointer' }}
            >
              {saving ? 'Saving...' : saved === 'par-list' ? '✓ Saved' : 'Save Par List'}
            </button>
          </div>
        )}

        {/* TAB: Staff PIN */}
        {tab === 'pin' && (
          <div>
            <div style={{ background: '#FFFFFF', border: '1px solid #E5E0D8', borderRadius: '8px', padding: '24px', marginBottom: '16px' }}>
              <h2 style={{ fontFamily: 'var(--font-dmsans)', fontSize: '13px', fontWeight: 600, color: '#6B5B4E', letterSpacing: '0.06em', textTransform: 'uppercase' as const, marginBottom: '16px' }}>Staff PIN</h2>
              <p style={{ fontFamily: 'var(--font-dmsans)', fontSize: '14px', color: '#1C1917', marginBottom: '24px', lineHeight: 1.5 }}>
                Staff use this 4-digit PIN to access the par check page. No account needed — just the PIN.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontFamily: 'var(--font-dmsans)', fontSize: '13px', fontWeight: 500, color: '#6B5B4E', marginBottom: '6px' }}>PIN</label>
                  <input
                    type="text" value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="1234" maxLength={4}
                    style={{ width: '100%', fontFamily: 'var(--font-dmsans)', fontSize: '24px', fontWeight: 700, letterSpacing: '8px', color: '#1C1917', border: '1px solid #E5E0D8', borderRadius: '4px', padding: '12px 16px', textAlign: 'center' as const }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontFamily: 'var(--font-dmsans)', fontSize: '13px', fontWeight: 500, color: '#6B5B4E', marginBottom: '6px' }}>Confirm PIN</label>
                  <input
                    type="text" value={pinConfirm} onChange={e => setPinConfirm(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="1234" maxLength={4}
                    style={{ width: '100%', fontFamily: 'var(--font-dmsans)', fontSize: '24px', fontWeight: 700, letterSpacing: '8px', color: '#1C1917', border: `1px solid ${pinConfirm && pin !== pinConfirm ? '#EF4444' : '#E5E0D8'}`, borderRadius: '4px', padding: '12px 16px', textAlign: 'center' as const }}
                  />
                </div>
              </div>
            </div>

            <button
              onClick={savePin} disabled={saving || pin.length !== 4}
              style={{ width: '100%', fontFamily: 'var(--font-dmsans)', fontSize: '15px', fontWeight: 600, color: '#1C1917', background: saving ? '#A8A29E' : saved === 'pin' ? '#16A34A' : pin.length !== 4 ? '#A8A29E' : '#D97706', border: 'none', borderRadius: '6px', padding: '14px', cursor: saving || pin.length !== 4 ? 'not-allowed' : 'pointer' }}
            >
              {saving ? 'Saving...' : saved === 'pin' ? '✓ PIN Saved' : 'Save PIN'}
            </button>
          </div>
        )}

        {/* TAB: Alert Email */}
        {tab === 'alerts' && (
          <div>
            <div style={{ background: '#FFFFFF', border: '1px solid #E5E0D8', borderRadius: '8px', padding: '24px', marginBottom: '16px' }}>
              <h2 style={{ fontFamily: 'var(--font-dmsans)', fontSize: '13px', fontWeight: 600, color: '#6B5B4E', letterSpacing: '0.06em', textTransform: 'uppercase' as const, marginBottom: '16px' }}>Shortfall Alert Recipients</h2>
              <p style={{ fontFamily: 'var(--font-dmsans)', fontSize: '14px', color: '#1C1917', marginBottom: '20px', lineHeight: 1.5 }}>
                When a par check finds shortfalls, an alert is sent to these addresses. If left blank, alerts go to your account email. Enter one address per line or separate with commas.
              </p>
              <label style={{ display: 'block', fontFamily: 'var(--font-dmsans)', fontSize: '13px', fontWeight: 500, color: '#6B5B4E', marginBottom: '6px' }}>Alert email addresses</label>
              <textarea
                value={alertEmails}
                onChange={e => setAlertEmails(e.target.value)}
                placeholder={'manager@restaurant.com\nowner@restaurant.com'}
                rows={4}
                style={{ width: '100%', fontFamily: 'var(--font-dmsans)', fontSize: '14px', color: '#1C1917', border: '1px solid #E5E0D8', borderRadius: '4px', padding: '12px', resize: 'vertical' as const, lineHeight: 1.6 }}
              />
              <p style={{ fontFamily: 'var(--font-dmsans)', fontSize: '12px', color: '#6B5B4E', marginTop: '8px' }}>
                {alertEmails.split(/[\n,]/).map(e => e.trim()).filter(Boolean).length} recipient{alertEmails.split(/[\n,]/).map(e => e.trim()).filter(Boolean).length !== 1 ? 's' : ''} configured
                {!alertEmails.trim() && ' — will default to your account email'}
              </p>
            </div>

            <button
              onClick={saveAlerts} disabled={saving}
              style={{ width: '100%', fontFamily: 'var(--font-dmsans)', fontSize: '15px', fontWeight: 600, color: '#1C1917', background: saving ? '#A8A29E' : saved === 'alerts' ? '#16A34A' : '#D97706', border: 'none', borderRadius: '6px', padding: '14px', cursor: saving ? 'not-allowed' : 'pointer' }}
            >
              {saving ? 'Saving...' : saved === 'alerts' ? '✓ Saved' : 'Save Alert Settings'}
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
