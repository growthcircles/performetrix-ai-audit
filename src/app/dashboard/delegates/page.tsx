'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function DelegatesPage() {
  const supabase = createClient();
  const [delegates, setDelegates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      const { data: leadersData } = await supabase
        .from('leaders')
        .select('*')
        .order('created_at', { ascending: false });

      if (leadersData) setDelegates(leadersData);
      setLoading(false);
    }
    fetchData();
  }, [supabase]);

  return (
    <div style={{ color: '#E8E4DA' }}>
      <div style={{ fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#9AA3B5', marginBottom: '10px' }}>Management</div>
      <div style={{ fontSize: '34px', fontFamily: 'serif', color: '#E8E4DA', marginBottom: '6px' }}>Delegate Directory</div>
      <div style={{ fontSize: '14.5px', color: '#9AA3B5', marginBottom: '32px' }}>Manage all delegates across all programmes and assessments.</div>

      <div style={{ backgroundColor: '#1B2029', border: '1px solid #333B4C', borderRadius: '3px', padding: '24px 26px' }}>
        
        {/* Header Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9AA3B5' }}>All Delegates</div>
          <button style={{ fontSize: '11.5px', padding: '11px 18px', borderRadius: '2px', border: '1px solid #B4915B', backgroundColor: '#B4915B', color: '#14171F', cursor: 'pointer', fontWeight: 'bold' }}>+ Enroll Delegate</button>
        </div>
        
        {/* Table Header (Grid) */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 150px', gap: '16px', paddingBottom: '12px', borderBottom: '1px solid #333B4C', marginBottom: '8px', fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9AA3B5' }}>
          <div>Delegate</div>
          <div>Email</div>
          <div>Programme</div>
          <div style={{ textAlign: 'right' }}>Action</div>
        </div>

        {loading ? (
          <div style={{ color: '#9AA3B5', fontSize: '13.5px', padding: '16px 0' }}>Loading delegates...</div>
        ) : delegates.length === 0 ? (
          <div style={{ color: '#9AA3B5', fontSize: '13.5px', padding: '16px 0' }}>No delegates found.</div>
        ) : (
          <div>
            {delegates.map((delegate) => (
              <div key={delegate.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 150px', gap: '16px', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid #333B4C' }}>
                
                {/* 1. Name */}
                <div style={{ fontSize: '16.5px', fontFamily: 'serif', color: '#E8E4DA', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {delegate.name || 'Unnamed'}
                </div>

                {/* 2. Email */}
                <div style={{ fontSize: '12px', color: '#9AA3B5', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {delegate.email || 'No email'}
                </div>

                {/* 3. Status (Not enrolled for now) */}
                <div style={{ fontSize: '11px', color: '#9AA3B5', fontFamily: 'monospace' }}>
                  Not enrolled
                </div>

                {/* 4. Action Button */}
                <div style={{ textAlign: 'right' }}>
                  <Link href={`/dashboard/delegates/${delegate.id}`} style={{ display: 'inline-block', fontSize: '11px', padding: '8px 14px', borderRadius: '2px', border: '1px solid #333B4C', color: '#D8BE8F', textDecoration: 'none', textTransform: 'uppercase', fontFamily: 'monospace' }}>
                    View Profile
                  </Link>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}