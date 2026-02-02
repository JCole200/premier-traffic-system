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

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
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

        {/* Recent Activity / Graph placeholder could go here */}

      </section>
    </main>
  );
}


