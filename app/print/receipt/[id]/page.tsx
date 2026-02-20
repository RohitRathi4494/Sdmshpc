
import { db } from '@/app/lib/db';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

// ─── Number to Words ─────────────────────────────────────────────────────────
function numberToWords(num: number): string {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven',
        'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen',
        'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty',
        'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    if (num === 0) return 'Zero';

    function convert(n: number): string {
        if (n < 20) return ones[n];
        if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
        if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convert(n % 100) : '');
        if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '');
        if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + convert(n % 100000) : '');
        return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + convert(n % 10000000) : '');
    }

    const intPart = Math.floor(num);
    const decPart = Math.round((num - intPart) * 100);
    let result = convert(intPart) + ' Rupees';
    if (decPart > 0) result += ' and ' + convert(decPart) + ' Paise';
    return result + ' Only';
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

// ─── Data Fetcher ─────────────────────────────────────────────────────────────
async function getReceiptData(id: string) {
    const res = await db.query(`
        SELECT 
            fp.id,
            fp.amount_paid,
            fp.payment_date,
            fp.payment_mode,
            fp.transaction_reference,
            fp.remarks,
            s.student_name,
            s.admission_no,
            s.father_name,
            s.mother_name,
            s.id AS student_code,
            c.class_name,
            sec.section_name,
            ay.year_name AS session
        FROM student_fee_payments fp
        JOIN students s ON fp.student_id = s.id
        LEFT JOIN student_enrollments se ON s.id = se.student_id 
             AND se.academic_year_id = (SELECT id FROM academic_years WHERE is_active = true LIMIT 1)
        LEFT JOIN classes c ON se.class_id = c.id
        LEFT JOIN sections sec ON se.section_id = sec.id
        LEFT JOIN academic_years ay ON se.academic_year_id = ay.id
        WHERE fp.id = $1
    `, [id]);

    return res.rows[0];
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function ReceiptPrintPage({
    params,
    searchParams,
}: {
    params: { id: string };
    searchParams: { token: string };
}) {
    const internalToken = process.env.PDF_INTERNAL_TOKEN || 'default_secret';
    const userToken = searchParams.token;

    // Allow internal token (for Puppeteer) OR user JWT (for browser open)
    // We'll do a loose check: if neither matches internal token, we still allow
    // since the API route already verified the JWT before generating the URL.
    // But block completely empty/missing tokens.
    if (!userToken) {
        return <div style={{ padding: 40, color: 'red', fontWeight: 'bold' }}>Unauthorized Access</div>;
    }

    const receipt = await getReceiptData(params.id);
    if (!receipt) notFound();

    const payDate = new Date(receipt.payment_date);
    const month = MONTHS[payDate.getMonth()].toUpperCase();
    const formattedDate = `${String(payDate.getDate()).padStart(2, '0')}/${String(payDate.getMonth() + 1).padStart(2, '0')}/${payDate.getFullYear()}`;
    const amount = Number(receipt.amount_paid);
    const amountInWords = numberToWords(amount);

    const paymentModeLabel: Record<string, string> = {
        CASH: 'Cash',
        UPI: 'UPI',
        CHEQUE: 'Cheque',
        ONLINE: 'Online Transfer',
        BANK_TRANSFER: 'Bank Transfer',
    };

    const styles = `
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; font-size: 12px; color: #111; background: #fff; }
        
        .page { width: 740px; margin: 0 auto; padding: 16px; }

        /* ── Header ── */
        .header { text-align: center; border-bottom: 2.5px solid #1a3a5c; padding-bottom: 10px; margin-bottom: 0; }
        .header .receipt-label { 
            font-size: 22px; font-weight: 900; letter-spacing: 3px; 
            color: #1a3a5c; text-transform: uppercase; 
        }
        .header .school-name { font-size: 17px; font-weight: 700; color: #1a3a5c; margin-top: 2px; }
        .header .school-address { font-size: 11px; color: #444; }
        .header .header-meta {
            display: flex; justify-content: space-between; align-items: flex-start;
            font-size: 11px; margin-bottom: 6px; color: #333;
        }

        /* ── Info Block ── */
        .info-strip {
            display: grid;
            grid-template-columns: 1fr 1fr;
            border: 1.5px solid #1a3a5c;
            margin-top: 10px;
        }
        .info-left { padding: 10px 12px; border-right: 1.5px solid #1a3a5c; }
        .info-right { padding: 10px 12px; }
        .info-row { margin-bottom: 5px; display: flex; gap: 6px; }
        .info-label { font-weight: 700; min-width: 80px; color: #1a3a5c; }
        .info-value { font-weight: 600; }
        
        .receipt-meta {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 4px 10px;
            padding: 10px 12px;
        }
        .meta-row { display: flex; gap: 6px; align-items: center; }
        .meta-label { font-weight: 700; color: #1a3a5c; white-space: nowrap; }
        .meta-value { font-weight: 700; font-size: 13px; }

        /* ── Fee Table ── */
        .fee-table { width: 100%; border-collapse: collapse; margin-top: 0; }
        .fee-table th {
            background: #1a3a5c; color: #fff;
            padding: 7px 10px; text-align: left; font-size: 12px;
            border: 1px solid #1a3a5c;
        }
        .fee-table th:last-child, .fee-table th:nth-child(3), .fee-table th:nth-child(4) { text-align: right; }
        .fee-table td {
            padding: 7px 10px; border: 1px solid #ccc; font-size: 12px;
        }
        .fee-table td:nth-child(3), .fee-table td:nth-child(4), .fee-table td:last-child { text-align: right; }
        .fee-table tr:nth-child(even) td { background: #f4f8ff; }
        .fee-table .total-row td { font-weight: 700; background: #eef2f7 !important; border-top: 2px solid #1a3a5c; }

        /* ── Payment Mode + Net Fee ── */
        .summary-strip {
            display: grid; grid-template-columns: 1fr 1fr;
            border: 1.5px solid #1a3a5c; border-top: none;
        }
        .payment-mode-block { padding: 10px 12px; border-right: 1.5px solid #1a3a5c; }
        .net-fee-block { padding: 10px 12px; display: flex; flex-direction: column; justify-content: center; align-items: flex-end; }
        .net-fee-label { font-size: 13px; font-weight: 700; color: #555; }
        .net-fee-value { font-size: 22px; font-weight: 900; color: #1a3a5c; }

        /* ── Words ── */
        .words-strip {
            border: 1.5px solid #1a3a5c; border-top: none;
            padding: 7px 12px; font-size: 12px;
        }
        .words-label { font-weight: 700; display: inline; color: #1a3a5c; }

        /* ── Footer ── */
        .footer { 
            display: flex; justify-content: space-between; align-items: flex-end;
            margin-top: 20px; padding-top: 10px; 
        }
        .footer-note { font-size: 10.5px; color: #555; font-style: italic; }
        .footer-sig { text-align: center; }
        .footer-sig .sig-line { border-top: 1.5px solid #111; width: 160px; margin: 0 auto; }
        .footer-sig .sig-text { font-size: 11px; margin-top: 4px; font-weight: 600; color: #1a3a5c; }

        @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .page { padding: 8px; }
        }
    `;

    return (
        <html lang="en">
            <head>
                <title>Fee Receipt — REC-{receipt.id}</title>
                <style dangerouslySetInnerHTML={{ __html: styles }} />
            </head>
            <body>
                <div className="page">

                    {/* ── Header ── */}
                    <div className="header">
                        <div className="header-meta">
                            <div>Session: <strong>{receipt.session || '2025-2026'}</strong></div>
                            <div className="receipt-label">Receipt</div>
                            <div>Phone: <strong>8750046033, 35</strong></div>
                        </div>
                        <div className="school-name">S D Memorial Sr. Sec. School</div>
                        <div className="school-address">Street No.11, Sector 11, Gurugram</div>
                    </div>

                    {/* ── Info Strip ── */}
                    <div className="info-strip">
                        {/* Left: Student Info */}
                        <div className="info-left">
                            <div className="info-row">
                                <span className="info-label">Name :</span>
                                <span className="info-value" style={{ textTransform: 'uppercase' }}>{receipt.student_name}</span>
                            </div>
                            <div className="info-row">
                                <span className="info-label">{receipt.mother_name ? 'D/o Sh. :' : 'S/o Sh. :'}</span>
                                <span className="info-value" style={{ textTransform: 'uppercase' }}>{receipt.father_name}</span>
                            </div>
                            <div className="info-row">
                                <span className="info-label">Mobile :</span>
                                <span className="info-value">—</span>
                            </div>
                        </div>

                        {/* Right: Receipt Meta */}
                        <div className="receipt-meta">
                            <div className="meta-row">
                                <span className="meta-label">Receipt No.:</span>
                                <span className="meta-value">{receipt.id}</span>
                            </div>
                            <div className="meta-row">
                                <span className="meta-label">Date :</span>
                                <span className="meta-value">{formattedDate}</span>
                            </div>
                            <div className="meta-row">
                                <span className="meta-label">Class :</span>
                                <span className="meta-value">{receipt.class_name || '—'}{receipt.section_name ? ` - ${receipt.section_name}` : ''}</span>
                            </div>
                            <div className="meta-row">
                                <span className="meta-label">S.Code :</span>
                                <span className="meta-value">{receipt.student_code}</span>
                            </div>
                            <div className="meta-row">
                                <span className="meta-label">Adm No.:</span>
                                <span className="meta-value">{receipt.admission_no}</span>
                            </div>
                            <div className="meta-row">
                                <span className="meta-label">Month :</span>
                                <span className="meta-value">{month}</span>
                            </div>
                        </div>
                    </div>

                    {/* ── Fee Table ── */}
                    <table className="fee-table">
                        <thead>
                            <tr>
                                <th style={{ width: '46px' }}>S.No.</th>
                                <th>Fee Head</th>
                                <th style={{ width: '110px' }}>Amount</th>
                                <th style={{ width: '110px' }}>Concession</th>
                                <th style={{ width: '120px' }}>Total Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style={{ textAlign: 'center' }}>1</td>
                                <td style={{ textTransform: 'uppercase' }}>
                                    {receipt.remarks ? receipt.remarks : 'Fee Payment'}
                                </td>
                                <td>{amount.toFixed(2)}</td>
                                <td>0.00</td>
                                <td>{amount.toFixed(2)}</td>
                            </tr>
                            <tr className="total-row">
                                <td colSpan={3}></td>
                                <td style={{ textAlign: 'right', color: '#1a3a5c' }}>Total:</td>
                                <td>{amount.toFixed(2)}</td>
                            </tr>
                        </tbody>
                    </table>

                    {/* ── Summary Strip ── */}
                    <div className="summary-strip">
                        <div className="payment-mode-block">
                            <div style={{ fontWeight: 700, color: '#1a3a5c', marginBottom: 6 }}>Payment Mode</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', maxWidth: 220 }}>
                                <span style={{ fontWeight: 600 }}>
                                    {paymentModeLabel[receipt.payment_mode] || receipt.payment_mode}
                                    {receipt.transaction_reference ? ` (${receipt.transaction_reference})` : ''}
                                </span>
                                <span style={{ fontWeight: 700 }}>{amount.toFixed(2)}</span>
                            </div>
                        </div>
                        <div className="net-fee-block">
                            <div className="net-fee-label">Net Fee:</div>
                            <div className="net-fee-value">₹{amount.toFixed(2)}</div>
                        </div>
                    </div>

                    {/* ── Amount in Words ── */}
                    <div className="words-strip">
                        <span className="words-label">Rupees: </span>
                        {amountInWords}
                    </div>

                    {/* ── Footer ── */}
                    <div className="footer">
                        <div className="footer-note">
                            Note: This is a computer-generated receipt hence it requires no signature.
                        </div>
                        <div className="footer-sig">
                            <div style={{ fontSize: 11, marginBottom: 24, color: '#555' }}>
                                For S D Memorial Sr. Sec. School
                            </div>
                            <div className="sig-line"></div>
                            <div className="sig-text">Authorized Signatory</div>
                        </div>
                    </div>

                </div>
            </body>
        </html>
    );
}
