
const months: { [key: string]: string } = {
    'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04', 'May': '05', 'Jun': '06',
    'Jul': '07', 'Aug': '08', 'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12',
    'JAN': '01', 'FEB': '02', 'MAR': '03', 'APR': '04', 'MAY': '05', 'JUN': '06',
    'JUL': '07', 'AUG': '08', 'SEP': '09', 'OCT': '10', 'NOV': '11', 'DEC': '12'
};

function normalizeDate(dateStr: string): string | null {
    if (!dateStr) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;

    // Handle DD-MMM-YY
    const parts = dateStr.split('-');
    if (parts.length === 3) {
        const day = parts[0].padStart(2, '0');
        const monthStr = parts[1];
        const yearShort = parts[2];

        const month = months[monthStr];
        const year = yearShort.length === 2 ? '20' + yearShort : yearShort;

        if (day && month && year) {
            return `${year}-${month}-${day}`;
        }
    }
    return null;
}

const samples = [
    { dob: '8-May-14', name: 'AANYA' },
    { dob: '13-Dec-13', name: 'AARADHYA' },
    { dob: '1-Jan-15', name: 'ANUJ' },
    { dob: '2-Jan-14', name: 'ABHAY' },
    { dob: '17-Aug-14', name: 'ABHASH' },
    { dob: '7-Mar-14', name: 'ABHISHEK' }
];

console.log('Testing Date Normalization:');
samples.forEach(s => {
    const norm = normalizeDate(s.dob);
    console.log(`${s.name} (${s.dob}) -> ${norm}`);
    if (!norm) console.error('FAILED TO PARSE');
});
