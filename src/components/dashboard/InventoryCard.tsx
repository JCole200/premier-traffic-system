interface InventoryCardProps {
    title: string;
    metric: string;
    subtext: string;
    percentage: number;
    color: string;
}

export default function InventoryCard({
    title,
    metric,
    subtext,
    percentage,
    color,
}: InventoryCardProps) {
    return (
        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px' }}>
            <h3 style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>{title}</h3>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                {metric}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                {subtext}
            </div>
            <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${percentage}%`, height: '100%', background: color, transition: 'width 0.5s ease' }}></div>
            </div>
        </div>
    );
}
