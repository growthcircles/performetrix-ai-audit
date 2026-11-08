'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const menuItems = [
    { name: 'Overview', path: '/dashboard' },
    { name: 'Programmes', path: '/dashboard/programmes' },
    { name: 'Delegates', path: '/dashboard/delegates' },
    { name: 'Toolbox', path: '/dashboard/modules' },
    { name: 'Reports', path: '/dashboard/reports' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#14171F', color: '#E8E4DA' }}>
      
      {/* SIDEBAR */}
      <aside style={{ width: '260px', backgroundColor: '#1B2029', borderRight: '1px solid #333B4C', padding: '32px 24px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ marginBottom: '40px' }}>
          <div style={{ fontSize: '24px', color: '#D8BE8F', fontFamily: 'serif', fontWeight: 'bold' }}>PerforMetrix</div>
          <div style={{ fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#9AA3B5', marginTop: '4px' }}>AI Audit</div>
        </div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {menuItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.name}
                href={item.path}
                style={{ 
                  display: 'block',
                  textAlign: 'left', 
                  padding: '12px 16px',
                  borderRadius: '2px',
                  fontSize: '11.5px',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  backgroundColor: isActive ? '#B4915B' : 'transparent',
                  color: isActive ? '#14171F' : '#E8E4DA',
                  border: isActive ? '1px solid #B4915B' : '1px solid #333B4C',
                  textDecoration: 'none'
                }}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div style={{ marginTop: 'auto', paddingTop: '24px', borderTop: '1px solid #333B4C' }}>
          <div style={{ fontSize: '14px', color: '#E8E4DA', fontWeight: 'bold' }}>PerforMetrix</div>
          <div style={{ fontSize: '10.5px', color: '#9AA3B5', marginTop: '3px', fontFamily: 'monospace' }}>Super Admin</div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main style={{ flex: 1, padding: '48px 32px', backgroundColor: '#14171F', color: '#E8E4DA' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          {children}
        </div>
      </main>

    </div>
  );
}
