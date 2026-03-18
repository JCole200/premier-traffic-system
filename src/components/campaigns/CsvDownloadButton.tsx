'use client';

interface CsvDownloadButtonProps {
    logs: any[];
    clientName: string;
    bookingId: string;
}

export default function CsvDownloadButton({ logs, clientName, bookingId }: CsvDownloadButtonProps) {
    const downloadCSV = () => {
        const headers = ['Action', 'Field', 'Old Value', 'New Value', 'Changed By', 'Timestamp'];
        const rows = logs.map((log: any) => [
            log.action,
            log.field || 'N/A',
            log.oldValue || '',
            log.newValue || '',
            log.changedBy || 'Unknown',
            log.createdAt
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map((row: any[]) => row.map((cell: any) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `audit_trail_${clientName?.replace(/\s+/g, '_')}_${bookingId}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <button
            onClick={downloadCSV}
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
            📥 Download CSV
        </button>
    );
}
