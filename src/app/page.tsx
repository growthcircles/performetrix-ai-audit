'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function DelegatesPage() {
  const supabase = createClient();
  
  const [leaders, setLeaders] = useState<any[]>([]);
  const [programmes, setProgrammes] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLeaderId, setSelectedLeaderId] = useState('');
  const [selectedProgrammeId, setSelectedProgrammeId] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Fetch Data
  const fetchData = async () => {
    // 1. Get Leaders (Assuming your table is called 'leaders')
    const { data: leadersData } = await supabase.from('leaders').select('*');
    
    // 2. Get Programmes
    const { data: progsData } = await supabase.from('programmes').select('*');

    // 3. Get Enrollments (joining leader and programme data)
    const { data: enrollData } = await supabase
      .from('enrollments')
      .select(`
        id,
        leader:leaders ( id, name, email ),
        programme:programmes ( id, name )
      `);

    if (leadersData) setLeaders(leadersData);
    if (progsData) setProgrammes(progsData);
    if (enrollData) setEnrollments(enrollData);
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle Enrollment
  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeaderId || !selectedProgrammeId) return;

    setIsSaving(true);

    const { error } = await supabase
      .from('enrollments')
      .insert([{ 
        leader_id: selectedLeaderId, 
        programme_id: selectedProgrammeId 
      }]);

    if (error) {
      alert("Error enrolling: " + error.message);
    } else {
      setIsModalOpen(false);
      setSelectedLeaderId('');
      setSelectedProgrammeId('');
      fetchData(); // Refresh list
    }
    setIsSaving(false);
  };

  // Find programme name for a leader
  const getProgrammeName = (leaderId: string) => {
    const enrollment = enrollments.find(e => e.leader?.id === leaderId);
    return enrollment ? enrollment.programme.name : 'Not enrolled';
  };

  return (
    <div>
      <div className="eyebrow">Management</div>
      <div className="h1" style={{ marginBottom: '8px' }}>Delegate Directory</div>
      <div className="sub">Manage all delegates across all programmes and assessments.</div>

      <div className="panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div className="panel-title" style={{ marginBottom: 0 }}>All Delegates</div>
          <button className="btn" onClick={() => setIsModalOpen(true)}>+ Enroll Delegate</button>
        </div>
        
        {loading ? (
          <div className="empty-note">Loading delegates...</div>
        ) : leaders.length === 0 ? (
          <div className="empty-note">No delegates found in your database.</div>
        ) : (
          <div>
            {leaders.map((leader) => (
              <div key={leader.id} className="leader-row">
                <div>
                  <div className="leader-name">{leader.name}</div>
                  <div className="leader-meta">{leader.email}</div>
                </div>
                <div className="leader-meta" style={{ color: 'var(--brass-light)' }}>
                  {getProgrammeName(leader.id)}
                </div>
                <button className="btn btn-ghost">View Profile</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ENROLL MODAL */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', 
          alignItems: 'center', justifyContent: 'center', zIndex: 50
        }}>
          <div className="panel" style={{ width: '100%', maxWidth: '500px', backgroundColor: 'var(--ink-2)' }}>
            <div className="panel-title">Enroll Delegate in Programme</div>
            
            <form onSubmit={handleEnroll}>
              
              <div className="field" style={{ marginBottom: '16px' }}>
                <label>Select Delegate</label>
                <select 
                  value={selectedLeaderId} 
                  onChange={(e) => setSelectedLeaderId(e.target.value)}
                  required
                  style={{ background: 'var(--ink-3)', border: '1px solid var(--ink-line)', color: 'var(--ink-text)', padding: '11px 14px', borderRadius: '2px' }}
                >
                  <option value="">-- Choose a leader --</option>
                  {leaders.map(l => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="field" style={{ marginBottom: '24px' }}>
                <label>Select Programme</label>
                <select 
                  value={selectedProgrammeId} 
                  onChange={(e) => setSelectedProgrammeId(e.target.value)}
                  required
                  style={{ background: 'var(--ink-3)', border: '1px solid var(--ink-line)', color: 'var(--ink-text)', padding: '11px 14px', borderRadius: '2px' }}
                >
                  <option value="">-- Choose a programme --</option>
                  {programmes.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn" disabled={isSaving}>
                  {isSaving ? 'Enrolling...' : 'Enroll Delegate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}