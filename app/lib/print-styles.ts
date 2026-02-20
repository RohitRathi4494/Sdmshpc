
export const PRINT_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;600;700&family=Work+Sans:wght@400;500;600;700&display=swap');

:root {
    --primary-navy: #1a3a52;
    --secondary-blue: #2c5f7f;
    --accent-gold: #c9a961;
    --light-cream: #fdfbf7;
    --border-grey: #d4d4d4;
    --text-dark: #2d2d2d;
}

@page {
    size: A4 portrait;
    margin: 0.25in;
}

body {
    font-family: 'Work Sans', sans-serif;
    color: var(--text-dark);
    line-height: 1.3;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
}

/* Header Section */
.header {
    background: linear-gradient(135deg, var(--primary-navy) 0%, var(--secondary-blue) 100%) !important;
    color: white !important;
    padding: 15px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 15px;
    text-align: center;
}

.header-logo {
    height: 80px;
    width: auto;
}

.header-text {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.header h1 {
    font-family: 'Crimson Pro', serif;
    font-size: 1.8em;
    font-weight: 700;
    margin: 0;
    line-height: 1.1;
    text-transform: uppercase;
    color: white !important;
}

.subtitle {
    font-family: 'Crimson Pro', serif;
    font-size: 1.4em;
    margin-top: 5px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.9) !important;
}

/* Section Styling */
.section {
    margin-bottom: 20px;
    page-break-inside: avoid;
}

.section-title {
    font-family: 'Crimson Pro', serif;
    font-size: 1.4em;
    font-weight: 700;
    color: var(--primary-navy) !important;
    margin-bottom: 15px;
    padding-bottom: 5px;
    border-bottom: 2px solid var(--accent-gold) !important;
    display: flex;
    align-items: center;
    gap: 10px;
}

.section-title::before {
    content: '';
    width: 6px;
    height: 24px;
    background: var(--accent-gold) !important;
    border-radius: 3px;
    display: inline-block;
}

/* General Information */
.info-grid {
    background: white;
    padding: 15px;
    border: 1px solid var(--border-grey);
    border-radius: 8px;
}

.info-row, .info-row-half {
    display: grid;
    grid-template-columns: 200px 1fr;
    margin-bottom: 10px;
    align-items: center;
    gap: 15px;
}

.info-row-split {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-bottom: 10px;
}

.info-row-compact {
    display: grid;
    grid-template-columns: max-content 1fr;
    gap: 15px;
    align-items: center;
}

.info-label {
    font-weight: 600;
    color: var(--secondary-blue) !important;
}

.info-input {
    border: 1px solid var(--border-grey);
    border-radius: 4px;
    padding: 6px 10px;
    min-height: 36px;
    background: rgba(232, 241, 245, 0.1);
    display: flex;
    align-items: center;
}

/* Tables */
table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 15px;
    font-size: 0.9em;
}

th {
    background: var(--primary-navy) !important;
    color: white !important;
    padding: 10px;
    text-align: center;
    border: 1px solid #000; /* Darker border */
}

td {
    padding: 8px;
    border: 1px solid #000; /* Darker border */
    text-align: center;
}

td.subject-name {
    text-align: left;
    font-weight: 600;
    color: var(--primary-navy);
    padding-left: 15px;
}

/* Attendance Table */
.attendance-table th, .attendance-table td {
    padding: 4px !important;
    font-size: 0.85em;
}

/* Co-Scholastic & Personality */
.subject-header {
    background-color: var(--light-cream) !important;
    color: var(--primary-navy) !important;
    font-weight: 700;
    text-align: center;
    padding: 8px !important;
}

.compact-table td, .compact-table th {
    padding: 5px !important;
}

/* Feedback Section */
.feedback-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 20px;
}

.feedback-card {
    border: 1px solid var(--secondary-blue);
    border-radius: 8px;
    padding: 15px;
}

.feedback-card h3 {
    color: var(--primary-navy);
    margin-top: 0;
    border-bottom: 1px solid var(--border-grey);
    padding-bottom: 10px;
}

.feedback-row {
    display: grid;
    grid-template-columns: 200px 1fr;
    gap: 15px;
    margin-bottom: 10px;
}

.feedback-input {
    min-height: 40px;
    background: white;
}

/* Signature Section */
.signature-section {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 20px;
    margin-top: 40px;
    padding-top: 20px;
    border-top: 2px solid var(--border-grey);
}

.signature-box {
    text-align: center;
}

.signature-line {
    border-bottom: 2px solid var(--text-dark);
    height: 40px;
    margin-bottom: 5px;
}

.signature-label {
    font-weight: 600;
    font-size: 0.9em;
    color: var(--secondary-blue);
}

/* Grading Framework */
.grading-section {
    border: 1px solid var(--border-grey);
    padding: 15px;
    border-radius: 8px;
}

.grading-section h3 {
    text-align: center;
    font-size: 1.6em; /* Increased size */
    font-family: 'Crimson Pro', serif;
    font-weight: 700;
    color: var(--primary-navy);
    margin-top: 10px;
    margin-bottom: 20px;
    text-transform: uppercase;
}

.grading-grid {
    display: grid;
    grid-template-columns: 60px 120px 1fr;
    border: 1px solid var(--text-dark);
}

.grading-cell {
    padding: 8px;
    border-right: 1px solid var(--text-dark);
    border-bottom: 1px solid var(--text-dark);
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
}

.grading-cell:nth-child(3n) {
    border-right: none;
    text-align: left;
    justify-content: flex-start;
}

.grading-header {
    background: var(--primary-navy) !important;
    color: white !important;
    font-weight: 700;
}

.grade-label {
    font-weight: 700;
    color: var(--primary-navy);
}

/* Print Specifics */
@media print {
    body {
        -webkit-print-color-adjust: exact;
    }
    .no-print {
        display: none !important;
    }
    .page-break {
        page-break-before: always;
    }
}
`;
