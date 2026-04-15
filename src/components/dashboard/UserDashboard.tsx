import { useAuth } from '@/lib/auth-context';
import EditBookingModal from '../calendar/EditBookingModal';

interface UserDashboardProps {
    initialBookings: any[];
}

export default function UserDashboard({ initialBookings }: UserDashboardProps) {
    const { session } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [filterProduct, setFilterProduct] = useState('ALL');
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
    const [selectedBooking, setSelectedBooking] = useState<any>(null);

    const currentUserEmail = session?.email || '';

    const filteredBookings = useMemo(() => {
        let filtered = initialBookings.filter(b => 
            b.bookerName === currentUserEmail || 
            (session?.role === 'ADMIN')
        );

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(b => 
                (b.clientName && b.clientName.toLowerCase().includes(q)) || 
                (b.campaignName && b.campaignName.toLowerCase().includes(q)) ||
                (b.contractNumber && b.contractNumber.toLowerCase().includes(q))
            );
        }

        if (filterProduct !== 'ALL') {
            filtered = filtered.filter(b => {
                if (filterProduct === 'AUDIO') return b.bookingType === 'AUDIO';
                if (filterProduct === 'DISPLAY') return b.bookingType === 'DISPLAY';
                if (filterProduct === 'EMAIL') return b.bookingType === 'BESPOKE_ESEND' || b.bookingType === 'ADS_IN_ESEND';
                return true;
            });
        }

        if (filterStatus !== 'ALL') {
            filtered = filtered.filter(b => b.status === filterStatus);
        }

        filtered.sort((a, b) => {
            const dateA = new Date(a.startDate).getTime();
            const dateB = new Date(b.startDate).getTime();
            return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
        });

        return filtered;
    }, [initialBookings, currentUser, searchQuery, filterProduct, filterStatus, sortOrder]);

    const getStatusStyle = (status: string) => {
        if (status === 'CONFIRMED') return { bg: 'rgba(34, 197, 94, 0.2)', text: 'var(--success)' };
        if (status === 'RESERVED') return { bg: 'rgba(234, 179, 8, 0.2)', text: 'var(--warning, #eab308)' };
        if (status === 'CANCELLED') return { bg: 'rgba(239, 68, 68, 0.2)', text: 'var(--danger)' };
        return { bg: 'rgba(255, 255, 255, 0.1)', text: 'var(--text-muted)' };
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px', display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Filtering for:</span>
                    <span style={{ fontWeight: 600, color: 'white' }}>{session?.role === 'ADMIN' ? 'All Campaigns (Admin)' : session?.email}</span>
                </div>

                <div style={{ width: '1px', height: '24px', background: 'var(--border-subtle)' }} />

                <input
                    type="text"
                    placeholder="Search client or campaign..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '8px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid var(--border-subtle)',
                        width: '250px',
                        fontSize: '0.9rem'
                    }}
                />

                <select
                    value={filterProduct}
                    onChange={e => setFilterProduct(e.target.value)}
                    style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--border-subtle)' }}
                >
                    <option value="ALL">All Products</option>
                    <option value="AUDIO">Audio</option>
                    <option value="DISPLAY">Display</option>
                    <option value="EMAIL">E-Sends</option>
                </select>

                <select
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                    style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--border-subtle)' }}
                >
                    <option value="ALL">All Statuses</option>
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="RESERVED">Reserved</option>
                    <option value="CANCELLED">Cancelled</option>
                </select>

                <div style={{ flex: 1 }} />

                <button 
                    onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                    className="btn-secondary"
                    style={{ padding: '0.5rem 1rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', color: 'white' }}
                >
                    Sort Date {sortOrder === 'desc' ? '↓' : '↑'}
                </button>
            </div>

            <div className="glass-panel" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-subtle)' }}>
                            <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>Campaign</th>
                            <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>Product</th>
                            <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>Date Range</th>
                            <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>Volume</th>
                            <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>Status</th>
                            <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)', textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredBookings.length === 0 ? (
                            <tr>
                                <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    No bookings found matching your criteria.
                                </td>
                            </tr>
                        ) : (
                            filteredBookings.map((booking) => {
                                const statusStyle = getStatusStyle(booking.status);
                                return (
                                    <tr key={booking.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }} className="hover-row">
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontWeight: 600 }}>{booking.campaignName}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{booking.clientName}</div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            {booking.bookingType || 'Mixed'}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontSize: '0.9rem' }}>{booking.startDate}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>to {booking.endDate}</div>
                                        </td>
                                        <td style={{ padding: '1rem', fontSize: '0.9rem' }}>
                                            {booking.bookingType === 'AUDIO' && `${booking.audioSpots} Spots`}
                                            {booking.bookingType === 'DISPLAY' && `${booking.displayImpressions?.toLocaleString()} Imps`}
                                            {(booking.bookingType === 'BESPOKE_ESEND' || booking.bookingType === 'ADS_IN_ESEND') && `${booking.emailDates ? booking.emailDates.length : 0} Sends`}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{ 
                                                display: 'inline-block', 
                                                padding: '0.2rem 0.6rem', 
                                                borderRadius: '12px', 
                                                fontSize: '0.75rem', 
                                                fontWeight: 600,
                                                background: statusStyle.bg, 
                                                color: statusStyle.text 
                                            }}>
                                                {booking.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                                            <button 
                                                onClick={() => setSelectedBooking(booking)}
                                                className="btn-primary"
                                                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderRadius: '6px' }}
                                            >
                                                Manage
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {selectedBooking && (
                <EditBookingModal 
                    booking={selectedBooking} 
                    onClose={() => setSelectedBooking(null)} 
                />
            )}

            <style dangerouslySetInnerHTML={{__html:`
                .hover-row:hover { background: rgba(255,255,255,0.02); }
            `}} />
        </div>
    );
}
