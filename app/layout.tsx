import type { Metadata } from 'next'
import { Playfair_Display, DM_Sans } from 'next/font/google'
import './globals.css'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dmsans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Par Level Tracker — WRI',
  description: 'Real-time par level tracking for restaurant teams.',
}

const footerLinkStyle: React.CSSProperties = {
  color: '#78716C',
  fontSize: '13px',
  textDecoration: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  minHeight: '44px',
  padding: '0 4px',
}

const suiteCrossLinkStyle: React.CSSProperties = {
  color: '#A89880',
  fontSize: '14px',
  fontFamily: 'var(--font-dmsans), DM Sans, sans-serif',
  textDecoration: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  minHeight: '44px',
  padding: '0 4px',
  transition: 'color 120ms ease',
}

function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid #292524', padding: '24px',
      maxWidth: '768px', margin: '0 auto',
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: '12px',
      }}>
        <span style={{ color: '#78716C', fontSize: '13px' }}>Built for independent restaurants, by an independent restaurant owner.</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', alignItems: 'center' }}>
          <a href="https://wireach.tools/privacy" style={footerLinkStyle}>Privacy</a>
          <a href="https://wireach.tools/terms" style={footerLinkStyle}>Terms</a>
          <a href="mailto:support@wireach.tools" style={footerLinkStyle}>Support</a>
          <a href="https://wireach.tools" className="wri-suite-link" style={suiteCrossLinkStyle}>Part of WRI Suite →</a>
        </div>
      </div>
      <p style={{ marginTop: '16px', color: '#78716C', fontSize: '12px' }}>
        Within Reach International LLC · Memphis, TN
      </p>
    </footer>
  )
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${playfair.variable} ${dmSans.variable}`}>
        {children}
        <Footer />
      </body>
    </html>
  )
}
