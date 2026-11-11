import { ImageResponse } from 'next/og';

export const runtime = 'nodejs';
export const alt = 'Your SaaS — Ship your product on this starter';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#020617',
          padding: '72px 80px',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              backgroundColor: '#14b8a6',
              color: '#020617',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 40,
              fontWeight: 800,
            }}
          >
            S
          </div>
          <div style={{ color: '#ffffff', fontSize: 34, fontWeight: 700 }}>Your SaaS</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div
            style={{
              color: '#ffffff',
              fontSize: 76,
              fontWeight: 800,
              lineHeight: 1.05,
              maxWidth: 980,
            }}
          >
            Ship your next SaaS on a production-grade starter
          </div>
          <div style={{ color: '#94a3b8', fontSize: 34, maxWidth: 900 }}>
            Auth, multi-tenant organizations, payments, email and analytics — pre-wired and
            verified.
          </div>
        </div>

        <div style={{ display: 'flex', gap: 16 }}>
          {['Magic-link auth', 'Organizations', 'Creem payments'].map((tag) => (
            <div
              key={tag}
              style={{
                border: '2px solid #0f766e',
                color: '#5eead4',
                borderRadius: 999,
                padding: '12px 24px',
                fontSize: 26,
                fontWeight: 600,
              }}
            >
              {tag}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
