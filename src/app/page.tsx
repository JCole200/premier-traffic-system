import Sidebar from '../components/layout/Sidebar';
import InventoryCard from '../components/dashboard/InventoryCard';
import Link from 'next/link';
import { checkAvailability } from '../lib/actions/booking';

export const dynamic = 'force-dynamic';

export default async function Home() {
  // Mock Date Range for Month View
  const start = new Date().toISOString();
  const end = new Date().toISOString();

  // Calculate aggregate availability (Simulated for MVP)
  // Audio: Total Capacity (1.2M) - Used
  const audioAvail = await checkAvailability('AUDIO', start, end);
  const audioTotal = 1100000; // Hardcoded from constants sum for now for display speed
  const audioUsedPct = ((audioTotal - audioAvail) / audioTotal) * 100;

  // Display
  const displayAvail = await checkAvailability('DISPLAY', start, end);
  const displayTotal = 400000;
  const displayUsedPct = ((displayTotal - displayAvail) / displayTotal) * 100;

  // Email
  const emailAvail = await checkAvailability('EMAIL', start, end);
  const emailTotal = 98; // Total of A (4) + B (4) + Daily (90)
  const emailUsedPct = ((emailTotal - emailAvail) / emailTotal) * 100;

  return (
    <main className="grid-dashboard">
      <Sidebar />
      <section style={{ padding: '2rem' }}>
        <header style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Dashboard</h1>
            <p style={{ color: 'var(--text-muted)' }}>Welcome back, Judah Cole</p>
          </div>
          <Link href="/booking">
            <button className="btn-primary">
              + New Campaign
            </button>
          </Link>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
          <InventoryCard
            title="Audio Inventory"
            metric={`${(audioAvail / 1000).toFixed(0)}k`}
            subtext="Available Downloads/Streams"
            color="var(--primary)"
            percentage={audioUsedPct}
          />
          <InventoryCard
            title="Display Impressions"
            metric={`${(displayAvail / 1000).toFixed(0)}k`}
            subtext="Available Pageviews"
            color="var(--accent-cyan)"
            percentage={displayUsedPct}
          />
          <InventoryCard
            title="Email Slots"
            metric={emailAvail.toString()}
            subtext="Remaining Sends"
            color="var(--accent-pink)"
            percentage={emailUsedPct}
          />
        </div>

        <div className="glass-panel" style={{ padding: '2rem', borderRadius: '16px' }}>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '1.5rem', fontWeight: 600 }}>Guided Workflows</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <Link href="/audio-dashboard" style={{ flex: 1 }}>
              <div className="nav-item" style={{ padding: '1.5rem', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', cursor: 'pointer' }}>
                <h3 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>🔈 Audio Workflow</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Check specific podcast and radio stream availability by date.</p>
              </div>
            </Link>
            <Link href="/display-dashboard" style={{ flex: 1 }}>
              <div className="nav-item" style={{ padding: '1.5rem', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', cursor: 'pointer' }}>
                <h3 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>💻 Display Workflow</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Manage impressions across the entire Premier web portfolio.</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Activity / Graph placeholder could go here */}

      </section>
    </main>
  );
}


