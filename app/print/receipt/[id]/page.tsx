
import { db } from '@/app/lib/db';
import { notFound } from 'next/navigation';
import { PRINT_STYLES } from '@/app/lib/print-styles'; // Start with report styles, verified later

export const dynamic = 'force-dynamic';

async function getReceiptData(id: string) {
    const res = await db.query(`
        SELECT fp.*, 
               s.student_name, s.admission_no, s.father_name,
               c.class_name, sec.section_name
        FROM student_fee_payments fp
        JOIN students s ON fp.student_id = s.id
        LEFT JOIN student_enrollments se ON s.id = se.student_id 
             AND se.academic_year_id = (SELECT id FROM academic_years WHERE is_active = true LIMIT 1)
        LEFT JOIN classes c ON se.class_id = c.id
        LEFT JOIN sections sec ON se.section_id = sec.id
        WHERE fp.id = $1
    `, [id]);

    return res.rows[0];
}

export default async function ReceiptPrintPage({ params, searchParams }: { params: { id: string }, searchParams: { token: string } }) {
    // 1. Verify Internal Token
    const internalToken = process.env.PDF_INTERNAL_TOKEN || 'default_secret';
    if (searchParams.token !== internalToken) {
        return <div className="p-10 text-red-500 font-bold">Unauthorized Access</div>;
    }

    const receipt = await getReceiptData(params.id);

    if (!receipt) {
        notFound();
    }

    return (
        <html>
            <head>
                <style dangerouslySetInnerHTML={{ __html: PRINT_STYLES }} />
                <style dangerouslySetInnerHTML={{
                    __html: `
                    .receipt-box {
                        border: 2px solid #000;
                        padding: 20px;
                        margin: 20px auto;
                        max-width: 800px;
                    }
                    .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
                    .row { display: flex; justify-content: space-between; margin-bottom: 10px; }
                    .label { font-weight: bold; }
                    .amount-box { border: 1px solid #000; padding: 10px; text-align: center; font-size: 1.2em; font-weight: bold; }
                    .footer { margin-top: 50px; display: flex; justify-content: space-between; }
                `}} />
            </head>
            <body>
                <div className="receipt-box">
                    <div className="header">
                        <h2>SDMS EduPulse School</h2>
                        <p>123 School Lane, Education City</p>
                        <h3>FEE RECEIPT</h3>
                    </div>

                    <div className="row">
                        <div>
                            <span className="label">Receipt No:</span> REC-{receipt.id}
                        </div>
                        <div>
                            <span className="label">Date:</span> {new Date(receipt.payment_date).toLocaleDateString()}
                        </div>
                    </div>

                    <div className="row">
                        <div>
                            <span className="label">Student Name:</span> {receipt.student_name}
                        </div>
                        <div>
                            <span className="label">Admission No:</span> {receipt.admission_no}
                        </div>
                    </div>

                    <div className="row">
                        <div>
                            <span className="label">Class/Section:</span> {receipt.class_name || 'N/A'} - {receipt.section_name || 'N/A'}
                        </div>
                        <div>
                            <span className="label">Father's Name:</span> {receipt.father_name}
                        </div>
                    </div>

                    <hr className="my-4 border-t border-gray-400" />

                    <div className="mb-6">
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    <th style={{ border: '1px solid black', padding: '8px', textAlign: 'left' }}>Description</th>
                                    <th style={{ border: '1px solid black', padding: '8px', textAlign: 'right' }}>Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style={{ border: '1px solid black', padding: '8px' }}>
                                        Fee Payment
                                        {receipt.remarks && <div style={{ fontSize: '0.8em', color: '#555' }}>({receipt.remarks})</div>}
                                    </td>
                                    <td style={{ border: '1px solid black', padding: '8px', textAlign: 'right' }}>
                                        ₹{receipt.amount_paid}
                                    </td>
                                </tr>
                                {/* Future: Map fee items here */}
                            </tbody>
                        </table>
                    </div>

                    <div className="row" style={{ marginTop: '20px' }}>
                        <div>
                            <span className="label">Payment Mode:</span> {receipt.payment_mode}
                            {receipt.transaction_reference && <span> (Ref: {receipt.transaction_reference})</span>}
                        </div>
                        <div className="amount-box">
                            Total Paid: ₹{receipt.amount_paid}
                        </div>
                    </div>

                    <div className="footer">
                        <div style={{ textAlign: 'center' }}>
                            <p>____________________</p>
                            <p style={{ width: '150px', margin: '0 auto' }}>Collected By</p>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <br />
                            <p style={{ borderTop: '1px solid #000', width: '150px', margin: '0 auto' }}>Authorized Signatory</p>
                        </div>
                    </div>

                    <div style={{ textAlign: 'center', fontSize: '0.8em', marginTop: '20px' }}>
                        This is a computer-generated receipt.
                    </div>
                </div>
            </body>
        </html>
    );
}
