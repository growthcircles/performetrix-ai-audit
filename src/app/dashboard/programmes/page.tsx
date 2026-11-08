'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function ProgrammesPage() {
  const [programmes, setProgrammes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State for the Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProgName, setNewProgName] = useState('');
  const [newProgDesc, setNewProgDesc] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const supabase = createClient();

  // 1. Fetch Programmes
  const fetchProgrammes = async () => {
    const { data, error } = await supabase
      .from('programmes')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) setProgrammes(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchProgrammes();
  }, []);

  // 2. Handle Create Programme
  const handleCreateProgramme = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProgName) return;

    setIsSaving(true);

    const { data, error } = await supabase
      .from('programmes')
      .insert([{ 
        name: newProgName, 
        description: newProgDesc 
      }])
      .select();

    if (error) {
      console.error("Error creating programme:", error);
      alert("Failed to create programme: " + error.message);
    } else {
      setIsModalOpen(false);
      setNewProgName('');
      setNewProgDesc('');
      fetchProgrammes(); 
    }
    setIsSaving(false);
  };

  return (
    <div>
      <div className="eyebrow">Management</div>
      <div className="h1" style={{ marginBottom: '8px' }}>Programme Manager</div>
      <div className="sub">Create and manage your coaching programmes.</div>

      <div className="panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div className="panel-title" style={{ marginBottom: 0 }}>Active Programmes</div>
          <button className="btn" onClick={() => setIsModalOpen(true)}>+ Create Programme</button>
        </div>
        
        {loading ? (
          <div className="empty-note">Loading programmes...</div>
        ) : programmes.length === 0 ? (
          <div className="empty-note">No programmes found. Create your first one.</div>
        ) : (
          <div>
            {programmes.map((prog) => (
              <div key={prog.id} className="leader-row">
                <div>
                  <div className="leader-name" style={{ color: 'var(--brass-light)' }}>{prog.name}</div>
                  <div className="leader-meta">{prog.description || 'No description'}</div>
                </div>
                <button className="btn btn-ghost">Manage</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* THE MODAL (POPUP) */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', 
          alignItems: 'center', justifyContent: 'center', zIndex: 50
        }}>
          <div className="panel" style={{ width: '100%', maxWidth: '500px', backgroundColor: 'var(--ink-2)' }}>
            <div className="panel-title">Create New Programme</div>
            
            <form onSubmit={handleCreateProgramme}>
              <div className="field" style={{ marginBottom: '16px' }}>
                <label>Programme Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Counterpoint Leadership" 
                  value={newProgName}
                  onChange={(e) => setNewProgName(e.target.value)}
                  required
                />
              </div>
              
              <div className="field" style={{ marginBottom: '24px' }}>
                <label>Description (Optional)</label>
                <input 
                  type="text" 
                  placeholder="Brief overview..." 
                  value={newProgDesc}
                  onChange={(e) => setNewProgDesc(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  className="btn btn-ghost" 
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn" 
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save Programme'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}