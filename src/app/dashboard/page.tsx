export default function OverviewPage() {
  return (
    <div>
      <div className="eyebrow">Dashboard</div>
      <div className="h1" style={{ marginBottom: '8px' }}>Welcome back, Shiva</div>
      <div className="sub">Here is an overview of your coaching practice.</div>

      {/* STAT CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '32px' }}>
        <div className="panel">
          <div className="panel-title">Active Programmes</div>
          <div className="stat-value">3</div>
        </div>
        <div className="panel">
          <div className="panel-title">Total Delegates</div>
          <div className="stat-value">24</div>
        </div>
        <div className="panel">
          <div className="panel-title">Pending Reports</div>
          <div className="stat-value" style={{ color: 'var(--rust)' }}>5</div>
        </div>
      </div>

      {/* PROGRAMME SUMMARY */}
      <div className="panel">
        <div className="panel-title">Your Programmes</div>
        
        <div className="leader-row">
          <div>
            <div className="leader-name" style={{ color: 'var(--brass-light)' }}>PerforMetrix AI Audit</div>
            <div className="leader-meta">12 Delegates enrolled</div>
          </div>
          <button className="btn">Manage</button>
        </div>

        <div className="leader-row">
          <div>
            <div className="leader-name" style={{ color: 'var(--brass-light)' }}>Counterpoint</div>
            <div className="leader-meta">8 Delegates enrolled</div>
          </div>
          <button className="btn btn-ghost">Manage</button>
        </div>
      </div>
    </div>
  );
}
