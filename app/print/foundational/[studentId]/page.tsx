import { Suspense } from 'react';
import { FoundationalReportContent } from '@/app/components/reports/FoundationalReportContent';

export default function PrintFoundationalPage() {
    return (
        <Suspense fallback={<div style={{ padding: 40, textAlign: 'center', color: '#666', fontFamily: 'Arial' }}>Loading report…</div>}>
            <FoundationalReportContent autoPrint={true} />
        </Suspense>
    );
}
