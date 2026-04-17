import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

type SubmitItem = { parItemId: string; onHand: number }

export async function POST(req: NextRequest) {
  try {
    const { orgId, pin, items, note }: { orgId: string; pin: string; items: SubmitItem[]; note?: string } = await req.json()

    if (!orgId || !pin || !items?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const admin = getAdmin()

    // Re-validate PIN server-side
    const { data: org, error: orgError } = await admin
      .from('organizations')
      .select('id, staff_pin, owner_email, alert_emails, name')
      .eq('id', orgId)
      .single()

    if (orgError || !org || org.staff_pin !== pin) {
      return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 })
    }

    // Fetch par items to get snapshots
    const parItemIds = items.map(i => i.parItemId)
    const { data: parItems } = await admin
      .from('par_items')
      .select('id, name, unit, par_minimum')
      .in('id', parItemIds)

    if (!parItems?.length) {
      return NextResponse.json({ error: 'No par items found' }, { status: 400 })
    }

    // Calculate shortfalls
    const checkItems = items.map(item => {
      const parItem = parItems.find(p => p.id === item.parItemId)
      if (!parItem) return null
      return {
        par_item_id: item.parItemId,
        item_name: parItem.name,
        unit: parItem.unit,
        par_minimum: parItem.par_minimum,
        on_hand: item.onHand,
      }
    }).filter(Boolean)

    const hasShortfall = checkItems.some(i => i && i.on_hand < i.par_minimum)

    // Insert shift_check
    const { data: shiftCheck, error: checkError } = await admin
      .from('shift_checks')
      .insert({ org_id: orgId, has_shortfall: hasShortfall, note: note || null })
      .select('id')
      .single()

    if (checkError || !shiftCheck) {
      console.error('[submit] shift_check insert failed:', checkError)
      return NextResponse.json({ error: 'Failed to save check' }, { status: 500 })
    }

    // Insert shift_check_items
    const { error: itemsError } = await admin
      .from('shift_check_items')
      .insert(checkItems.map(i => ({ ...i, shift_check_id: shiftCheck.id })))

    if (itemsError) {
      console.error('[submit] shift_check_items insert failed:', itemsError)
      return NextResponse.json({ error: 'Failed to save check items' }, { status: 500 })
    }

    // Send email alert if shortfalls found
    if (hasShortfall && process.env.RESEND_API_KEY) {
      const shortfalls = checkItems.filter(i => i && i.on_hand < i.par_minimum)
      const recipients = org.alert_emails?.length ? org.alert_emails : [org.owner_email]

      const tableRows = shortfalls.map(i => `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #E5E0D8;font-family:DM Sans,sans-serif;font-size:14px;color:#1C1917">${i!.item_name}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #E5E0D8;font-family:DM Sans,sans-serif;font-size:14px;color:#1C1917;text-align:center">${i!.par_minimum} ${i!.unit}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #E5E0D8;font-family:DM Sans,sans-serif;font-size:14px;color:#1C1917;text-align:center">${i!.on_hand} ${i!.unit}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #E5E0D8;font-family:DM Sans,sans-serif;font-size:14px;color:#EF4444;font-weight:600;text-align:center">-${(i!.par_minimum - i!.on_hand).toFixed(1)} ${i!.unit}</td>
        </tr>`).join('')

      const html = `
        <div style="font-family:DM Sans,sans-serif;max-width:600px;margin:0 auto;background:#FAFAF9;border:1px solid #E5E0D8;border-radius:8px;overflow:hidden">
          <div style="background:#1C1917;padding:24px">
            <h1 style="font-family:Georgia,serif;font-size:22px;font-weight:700;color:#F5F0E8;margin:0 0 4px">Par Check Alert</h1>
            <p style="font-family:DM Sans,sans-serif;font-size:13px;color:#D97706;margin:0">${shortfalls.length} item${shortfalls.length !== 1 ? 's' : ''} below par — ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          </div>
          <div style="padding:24px">
            <table style="width:100%;border-collapse:collapse">
              <thead>
                <tr style="background:#F5F0E8">
                  <th style="padding:8px 12px;text-align:left;font-family:DM Sans,sans-serif;font-size:11px;font-weight:600;color:#6B5B4E;letter-spacing:0.06em;text-transform:uppercase">Item</th>
                  <th style="padding:8px 12px;text-align:center;font-family:DM Sans,sans-serif;font-size:11px;font-weight:600;color:#6B5B4E;letter-spacing:0.06em;text-transform:uppercase">Par</th>
                  <th style="padding:8px 12px;text-align:center;font-family:DM Sans,sans-serif;font-size:11px;font-weight:600;color:#6B5B4E;letter-spacing:0.06em;text-transform:uppercase">On Hand</th>
                  <th style="padding:8px 12px;text-align:center;font-family:DM Sans,sans-serif;font-size:11px;font-weight:600;color:#6B5B4E;letter-spacing:0.06em;text-transform:uppercase">Short</th>
                </tr>
              </thead>
              <tbody>${tableRows}</tbody>
            </table>
            ${note ? `<p style="font-family:DM Sans,sans-serif;font-size:13px;color:#6B5B4E;margin-top:16px;padding:12px;background:#F5F0E8;border-radius:4px"><strong>Note:</strong> ${note}</p>` : ''}
          </div>
          <div style="padding:16px 24px;border-top:1px solid #E5E0D8;text-align:center">
            <p style="font-family:DM Sans,sans-serif;font-size:12px;color:#6B5B4E;margin:0">par.wireach.tools — WRI Par Level Tracker</p>
          </div>
        </div>`

      try {
        const resend = new Resend(process.env.RESEND_API_KEY)
        await resend.emails.send({
          from: 'Par Alert <noreply@wireach.tools>',
          to: recipients,
          subject: `⚠️ Par check alert — ${shortfalls.length} item${shortfalls.length !== 1 ? 's' : ''} below par`,
          html,
        })
        console.log('[submit] Alert sent to:', recipients.join(', '))
      } catch (emailErr) {
        console.error('[submit] Email send failed:', emailErr)
        // Don't fail the submission if email fails
      }
    }

    return NextResponse.json({ success: true, checkId: shiftCheck.id, hasShortfall })
  } catch (err) {
    console.error('[submit] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
