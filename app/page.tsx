export default function Home() {
  return (
    <main style={{ background: '#1C1917', color: '#F5F0E8', fontFamily: 'DM Sans, sans-serif' }}>

      {/* Nav */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        background: 'rgba(28,25,23,0.95)', backdropFilter: 'blur(10px)',
        height: '64px', display: 'flex', alignItems: 'center',
        padding: '0 24px', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px', height: '32px', background: '#D97706',
            borderRadius: '6px', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '16px', color: '#fff'
          }}>✓</div>
          <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '18px', fontWeight: 700 }}>Par Tracker</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <a href="https://wireach.tools" style={{ color: '#F5F0E8', textDecoration: 'none', fontSize: '15px' }}>All Tools</a>
          <a href="/login" style={{
            border: '1px solid #F5F0E8', padding: '8px 20px',
            borderRadius: '6px', color: '#F5F0E8', textDecoration: 'none', fontSize: '15px'
          }}>Sign In</a>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ paddingTop: '160px', paddingBottom: '80px', paddingLeft: '24px', paddingRight: '24px', maxWidth: '768px', margin: '0 auto' }}>
        <p style={{ color: '#D97706', fontSize: '12px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '24px' }}>
          For Restaurant Managers
        </p>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '52px', lineHeight: 1.1, fontWeight: 700, marginBottom: '24px' }}>
          Stop guessing what's{' '}
          <span style={{ color: '#D97706' }}>running low.</span>
        </h1>
        <p style={{ fontSize: '18px', color: '#A8A29E', lineHeight: 1.6, marginBottom: '40px', maxWidth: '560px' }}>
          Staff enter par counts in 60 seconds using a PIN — no login, no app install.
          If anything's below par, your manager gets an email alert instantly.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <a href="/login" style={{
            background: '#D97706', color: '#fff', padding: '14px 28px',
            borderRadius: '8px', textDecoration: 'none', fontWeight: 600, fontSize: '16px'
          }}>Start Free Trial</a>
          <span style={{ color: '#78716C', fontSize: '14px' }}>No credit card required · $19/mo after trial</span>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '80px 24px', maxWidth: '768px', margin: '0 auto' }}>
        <p style={{ color: '#D97706', fontSize: '12px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '16px' }}>
          How It Works
        </p>
        <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '36px', fontWeight: 700, marginBottom: '48px' }}>
          Built for the way restaurants actually run.
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
          {[
            { icon: '🔑', title: 'PIN-based staff entry', desc: 'No logins, no app downloads. Staff punch in a 4-digit PIN and count what's on the shelf. Done in under a minute.' },
            { icon: '📊', title: 'Live shortfall preview', desc: 'The count form shows par targets inline. Staff see exactly what's short before they submit — no guessing.' },
            { icon: '📧', title: 'Instant manager alerts', desc: 'When anything falls below par, an email goes to every manager on the alert list — with the exact item and shortfall amount.' },
          ].map((f) => (
            <div key={f.title} style={{ background: '#292524', borderRadius: '12px', padding: '28px' }}>
              <div style={{
                width: '40px', height: '40px', background: '#1C1917', borderRadius: '8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '20px', marginBottom: '20px'
              }}>{f.icon}</div>
              <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '18px', fontWeight: 600, marginBottom: '12px' }}>{f.title}</h3>
              <p style={{ color: '#A8A29E', fontSize: '14px', lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section style={{ padding: '80px 24px', maxWidth: '768px', margin: '0 auto' }}>
        <p style={{ color: '#D97706', fontSize: '12px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '16px' }}>
          Pricing
        </p>
        <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '36px', fontWeight: 700, marginBottom: '48px' }}>
          Simple, honest pricing.
        </h2>
        <div style={{ background: '#292524', borderRadius: '12px', padding: '40px', border: '1px solid #D97706', maxWidth: '420px' }}>
          <p style={{ fontFamily: 'Playfair Display, serif', fontSize: '56px', fontWeight: 700, marginBottom: '8px' }}>
            $19<span style={{ fontSize: '18px', color: '#A8A29E', fontFamily: 'DM Sans, sans-serif' }}>/mo</span>
          </p>
          <p style={{ color: '#78716C', fontSize: '14px', marginBottom: '32px' }}>14-day free trial. No credit card required.</p>
          {[
            'PIN-based staff check-ins',
            'Unlimited par items',
            'Instant manager email alerts',
            '30-day check history',
            'Unlimited team members',
          ].map(item => (
            <p key={item} style={{ color: '#A8A29E', fontSize: '14px', marginBottom: '12px' }}>✓ {item}</p>
          ))}
          {/* TODO: swap href for Stripe payment link once created */}
          <a href="/login" style={{
            display: 'block', textAlign: 'center', marginTop: '32px',
            background: '#D97706', padding: '14px', borderRadius: '8px',
            color: '#fff', textDecoration: 'none', fontSize: '15px', fontWeight: 600
          }}>Start Free Trial</a>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '80px 24px', textAlign: 'center', maxWidth: '768px', margin: '0 auto' }}>
        <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '36px', fontWeight: 700, marginBottom: '16px' }}>
          Ready to know what's on the shelf?
        </h2>
        <p style={{ color: '#A8A29E', fontSize: '16px', marginBottom: '32px' }}>
          Start your free trial. No credit card. Cancel anytime.
        </p>
        <a href="/login" style={{
          background: '#D97706', color: '#fff', padding: '16px 36px',
          borderRadius: '8px', textDecoration: 'none', fontWeight: 600, fontSize: '16px'
        }}>Start Free Trial</a>
      </section>

      {/* Footer */}
      <footer style={{ padding: '80px 24px', maxWidth: '768px', margin: '0 auto', borderTop: '1px solid #292524', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <span style={{ color: '#78716C', fontSize: '13px' }}>Built for independent restaurants, by an independent restaurant owner.</span>
        <div style={{ display: 'flex', gap: '24px' }}>
          <a href="https://wireach.tools" style={{ color: '#78716C', fontSize: '13px', textDecoration: 'none' }}>All Tools</a>
          <a href="mailto:support@wireach.tools" style={{ color: '#78716C', fontSize: '13px', textDecoration: 'none' }}>support@wireach.tools</a>
        </div>
      </footer>

    </main>
  )
}
