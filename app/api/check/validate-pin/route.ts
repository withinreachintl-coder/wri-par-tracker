import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function POST(req: NextRequest) {
  try {
    const { pin, orgId } = await req.json()

    if (!pin || !orgId) {
      return NextResponse.json({ error: 'Missing pin or orgId' }, { status: 400 })
    }

    if (!/^\d{4}$/.test(pin)) {
      return NextResponse.json({ valid: false, error: 'Invalid PIN format' }, { status: 400 })
    }

    const admin = getAdmin()

    // Validate PIN against org
    const { data: org, error: orgError } = await admin
      .from('organizations')
      .select('id, staff_pin')
      .eq('id', orgId)
      .single()

    if (orgError || !org) {
      return NextResponse.json({ valid: false, error: 'Organization not found' }, { status: 404 })
    }

    if (org.staff_pin !== pin) {
      return NextResponse.json({ valid: false, error: 'Incorrect PIN' }, { status: 401 })
    }

    // Return active par items for this org
    const { data: items } = await admin
      .from('par_items')
      .select('id, name, unit, par_minimum, sort_order')
      .eq('org_id', orgId)
      .eq('active', true)
      .order('sort_order')

    return NextResponse.json({ valid: true, items: items || [] })
  } catch (err) {
    console.error('[validate-pin] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
