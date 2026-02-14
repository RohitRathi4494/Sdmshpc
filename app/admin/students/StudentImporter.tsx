'use client';

import { useState } from 'react';
import { ApiClient } from '@/app/lib/api-client';
import XLSX from 'xlsx-js-style';

export default function StudentImporter({ onImportSuccess }: { onImportSuccess: () => void }) {
    const [file, setFile] = useState<File | null>(null);
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [errors, setErrors] = useState<any[]>([]);
    const [isPreviewing, setIsPreviewing] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [importSummary, setImportSummary] = useState<any>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setPreviewData([]);
            setErrors([]);
            setImportSummary(null);
        }
    };

    const parseFile = async (file: File) => {
        console.log('Parsing file:', file.name);

        return new Promise<any[]>((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const data = e.target?.result;
                    // cellDates: true converts Excel serial dates to JS Date objects
                    const workbook = XLSX.read(data, { type: 'array', cellDates: true });
                    const sheetName = workbook.SheetNames[0];
                    const sheet = workbook.Sheets[sheetName];
                    const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }); // Get as array of arrays

                    console.log('Raw Sheet Data:', jsonData);

                    // Skip header row if it looks like a header
                    let rows: any[] = jsonData as any[];
                    if (rows.length > 0 && Array.isArray(rows[0]) && String(rows[0][0]).toLowerCase().includes('admission')) {
                        rows = rows.slice(1);
                    }

                    const parsed = [];
                    for (let i = 0; i < rows.length; i++) {
                        const row: any = rows[i];
                        // Skip empty rows
                        if (!row || row.length === 0) continue;

                        // Expect at least 5 columns, but now we want 7
                        // Format: admission_no, student_name, father_name, mother_name, dob, class_name, section_name
                        if (row.length >= 5) {
                            let dob = row[4];
                            // Handle Excel Date Objects
                            if (dob instanceof Date) {
                                // Convert to YYYY-MM-DD, adjusting for timezone / extracting date part
                                // toISOString() uses UTC. Excel dates are typically local 00:00:00.
                                // Safe-ish way for date-only:
                                const year = dob.getFullYear();
                                const month = String(dob.getMonth() + 1).padStart(2, '0');
                                const day = String(dob.getDate()).padStart(2, '0');
                                dob = `${year}-${month}-${day}`;
                            } else {
                                dob = String(dob || '').trim();
                            }

                            parsed.push({
                                admission_no: String(row[0] || '').trim(),
                                student_name: String(row[1] || '').trim(),
                                father_name: String(row[2] || '').trim(),
                                mother_name: String(row[3] || '').trim(),
                                dob: dob,
                                class_name: row[5] ? String(row[5]).trim() : '',
                                section_name: row[6] ? String(row[6]).trim() : ''
                            });
                        }
                    }
                    console.log('Parsed rows:', parsed.length);
                    resolve(parsed);
                } catch (err) {
                    reject(err);
                }
            };

            reader.onerror = (err) => reject(err);
            reader.readAsArrayBuffer(file);
        });
    };

    const handlePreview = async () => {
        console.log('Preview triggered');
        if (!file) {
            console.log('No file selected');
            return;
        }
        setIsUploading(true);
        try {
            const data = await parseFile(file);
            console.log('Data for preview:', data);

            if (data.length === 0) {
                alert('No valid rows found. Please check the file format.');
                setIsUploading(false);
                return;
            }

            const token = localStorage.getItem('hpc_token') || '';
            console.log('Sending request to API...');
            const res = await ApiClient.post<any>('/admin/students/import', { action: 'preview', data }, token);
            console.log('API Response:', res);

            // Handle API errors gracefully
            if (!res.success && res.message) {
                alert('Preview Failed: ' + res.message);
                return;
            }

            setPreviewData(res.data); // Valid rows
            setErrors(res.errors || []);
            setImportSummary(res.summary);
            setIsPreviewing(true);

        } catch (error: any) {
            console.error('Preview error:', error);
            alert(error.message || 'Failed to parse file');
        } finally {
            setIsUploading(false);
        }
    };

    const handleConfirm = async () => {
        if (previewData.length === 0) return;
        setIsUploading(true);
        try {
            const token = localStorage.getItem('hpc_token') || '';
            await ApiClient.post('/admin/students/import', { action: 'confirm', data: previewData }, token);
            alert('Students imported and enrolled successfully!');
            setFile(null);
            setPreviewData([]);
            setIsPreviewing(false);
            onImportSuccess();
        } catch (error: any) {
            alert(error.message || 'Failed to import students');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold mb-4">Import Students via Excel/CSV</h3>

            <div className="mb-6">
                <p className="text-sm text-gray-500 mb-2">
                    Format: <code>admission_no, student_name, father_name, mother_name, dob, class_name, section_name</code>
                </p>
                <input
                    type="file"
                    accept=".csv, .xlsx, .xls"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
            </div>

            {!isPreviewing && (
                <div className="flex gap-3">
                    <button
                        onClick={handlePreview}
                        disabled={!file || isUploading}
                        className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {isUploading ? 'Processing...' : 'Preview Import'}
                    </button>

                    <button
                        onClick={async () => {
                            if (!file) return;
                            if (!confirm('Are you sure you want to import without preview? ensure data is correct.')) return;
                            setIsUploading(true);
                            try {
                                const data = await parseFile(file);
                                if (data.length === 0) {
                                    alert('No valid rows found.');
                                    setIsUploading(false);
                                    return;
                                }
                                const token = localStorage.getItem('hpc_token') || '';
                                const res = await ApiClient.post<any>('/admin/students/import', { action: 'confirm', data }, token);

                                if (res.success) {
                                    let msg = res.message || 'Import successful';
                                    if (res.errors && res.errors.length > 0) {
                                        msg += `\n\n${res.errors.length} records skipped:\n` + res.errors.map((e: any) => `- Row ${e.index + 1}: ${e.error}`).join('\n');
                                    }
                                    alert(msg);
                                    setFile(null);
                                    onImportSuccess();
                                } else {
                                    let msg = 'Import failed: ' + res.message;
                                    if (res.errors && res.errors.length > 0) {
                                        msg += `\n\n${res.errors.length} records failed:\n` + res.errors.map((e: any) => `- Row ${e.index + 1}: ${e.error}`).join('\n');
                                    }
                                    alert(msg);
                                }
                            } catch (e: any) {
                                let msg = e.message || 'Import failed';
                                if (e.details && e.details.errors && e.details.errors.length > 0) {
                                    msg += `\n\n${e.details.errors.length} records failed:\n` + e.details.errors.map((err: any) => `- Row ${err.index + 1}: ${err.error}`).join('\n');
                                }
                                alert(msg);
                            } finally {
                                setIsUploading(false);
                            }
                        }}
                        disabled={!file || isUploading}
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                    >
                        Direct Import & Enroll
                    </button>
                </div>
            )}

            {isPreviewing && importSummary && (
                <div className="mt-6">
                    <div className="flex gap-4 mb-4 text-sm">
                        <div className="px-3 py-1 bg-gray-100 rounded">Total: {importSummary.total}</div>
                        <div className="px-3 py-1 bg-green-100 text-green-800 rounded">Valid: {importSummary.valid}</div>
                        <div className="px-3 py-1 bg-red-100 text-red-800 rounded">Invalid: {importSummary.invalid}</div>
                    </div>

                    {errors.length > 0 && (
                        <div className="mb-4 max-h-40 overflow-auto bg-red-50 p-3 rounded text-xs text-red-700">
                            <strong>Errors:</strong>
                            <ul>
                                {errors.map((e: any, i) => (
                                    <li key={i}>Row {e.index + 1}: {e.error} (Adm: {e.admission_no})</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {previewData.length > 0 && (
                        <div className="mb-4">
                            <h4 className="font-medium text-gray-700 mb-2">Valid Data Preview (First 5)</h4>
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-xs text-gray-500">
                                    <thead>
                                        <tr className="bg-gray-50 border-b">
                                            <th className="px-2 py-1 text-left">Adm No</th>
                                            <th className="px-2 py-1 text-left">Name</th>
                                            <th className="px-2 py-1 text-left">Class</th>
                                            <th className="px-2 py-1 text-left">Section</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {previewData.slice(0, 5).map((row: any, i) => (
                                            <tr key={i} className="border-b">
                                                <td className="px-2 py-1">{row.admission_no}</td>
                                                <td className="px-2 py-1">{row.student_name}</td>
                                                <td className="px-2 py-1">{row.class_name || '-'}</td>
                                                <td className="px-2 py-1">{row.section_name || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button
                            onClick={handleConfirm}
                            disabled={isUploading}
                            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                        >
                            {isUploading ? 'Importing...' : 'Confirm Import'}
                        </button>
                        <button
                            onClick={() => { setIsPreviewing(false); setFile(null); }}
                            className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
