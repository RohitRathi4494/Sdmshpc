
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
    size: A4;
    margin: 0.25in; /* 0.25 inch margins */
}

:root {
    --primary-navy: #1a3a52;
    --secondary-blue: #2c5f7f;
    --accent-gold: #c9a961;
    --light-cream: #fdfbf7;
    --border-grey: #d4d4d4;
    --text-dark: #2d2d2d;
}

body {
    font-family: 'Work Sans', sans-serif;
    background: white;
    color: var(--text-dark);
    line-height: 1.3;
    margin: 0;
    padding: 0;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
}

.container {
    width: 100%;
    max-width: 100%;
    min-height: 297mm;
    margin: 0 auto;
    padding: 0;
    box-sizing: border-box;
    background: white;
    overflow: hidden;
    position: relative;
}

/* Header Section */
/* Header Section */
.header {
    background: linear-gradient(135deg, var(--primary-navy) 0%, var(--secondary-blue) 100%) !important;
    color: white !important;
    padding: 15px; /* Compact padding */
    position: relative;
    overflow: hidden;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 15px;
    text-align: center; /* Center align text */
}

.header-logo {
    height: 90px;
    width: auto;
    background: transparent;
    padding: 0;
    border-radius: 0;
    box-shadow: none;
}

.header-text {
    display: flex;
    flex-direction: column;
    align-items: center; /* Center align text blocks */
}

.header h1 {
    font-family: 'Crimson Pro', serif;
    font-size: 2.2em; /* Reduced to fit one line */
    font-weight: 700;
    margin: 0;
    line-height: 1.1;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.subtitle {
    font-family: 'Crimson Pro', serif;
    font-size: 1.6em; /* Slightly reduced */
    margin-top: 5px;
    font-weight: 600;
    opacity: 0.9;
}

/* ... */

/* Content Area */
.content {
    padding: 5px 0; /* Minimal vertical padding */
    height: 100%;
}

.section {
    margin-bottom: 10px; /* Reduced section gap */
    page-break-inside: avoid;
}

.section-title {
    font-family: 'Crimson Pro', serif;
    font-size: 1.4em; /* Slightly smaller */
    font-weight: 700;
    color: var(--primary-navy) !important;
    margin-bottom: 10px; /* Reduced margin */
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
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
}

/* General Information */
.info-grid {
    background: white;
    padding: 15px; /* Reduced padding */
    border: 2px solid var(--border-grey);
    border-radius: 8px;
}

.info-row {
    display: grid;
    grid-template-columns: 220px 1fr;
    margin-bottom: 8px; /* Compact spacing */
    align-items: center;
    gap: 10px;
    font-size: 1em;
}

.info-row-split {
    display: grid;
    grid-template-columns: 1.5fr 1fr;
    gap: 20px;
    margin-bottom: 8px; /* Compact spacing */
}

.info-row-half {
    display: grid;
    grid-template-columns: 220px 1fr; /* Match info-row label width for alignment */
    gap: 15px;
    align-items: center;
    font-size: 1em;
}

.info-row-compact {
    display: grid;
    grid-template-columns: max-content 1fr; /* Auto width for specific labels like Adm No */
    gap: 15px;
    align-items: center;
    font-size: 1em;
}

.info-label {
    font-weight: 600;
    color: var(--secondary-blue) !important;
    font-size: 1.05em;
}

.info-input {
    border: 1px solid var(--border-grey);
    border-radius: 4px;
    padding: 8px 12px;
    min-height: 40px; /* Taller input boxes */
    background: rgba(232, 241, 245, 0.1);
    display: flex;
    align-items: center;
    font-size: 1.1em;
}

/* Tables */
table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 25px;
    font-size: 0.9em; /* Standard readable size */
    box-shadow: none;
}

/* Specific compact style for huge attendance table */
.attendance-table {
    font-size: 0.85em !important; /* Increased from 0.75em */
    table-layout: fixed;
    width: 100%;
}

.attendance-table th, 
.attendance-table td {
    padding: 4px 2px !important; /* Slightly increased padding */
    overflow: hidden;
    white-space: nowrap;
}

.attendance-table td:first-child {
    white-space: normal !important; /* Allow wrapping for row headers */
    line-height: 1.1;
    padding: 4px 5px !important;
    text-align: left;
}

.attendance-table .input-cell {
    min-width: auto !important;
}

thead {
    background: var(--primary-navy) !important;
    color: white !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
}

th {
    padding: 10px 8px; /* Comfortable padding */
    text-align: center;
    font-weight: 600;
    letter-spacing: 0.5px;
    border: 1px solid #000;
    color: white !important;
    font-size: 1em;
}

td {
    padding: 8px 6px; /* Comfortable padding */
    border: 1px solid var(--border-grey);
    background: white;
    text-align: center;
    vertical-align: middle;
}

td.subject-name {
    font-weight: 600;
    color: var(--primary-navy) !important;
    text-align: left;
    padding-left: 15px;
    font-size: 1em;
}

td.input-cell {
    min-width: 50px;
    text-align: center;
    font-weight: 500;
    font-size: 1.1em;
}

/* Unified Table Styles for Co-Scholastic & Personality */
.subject-header {
    background-color: var(--light-cream) !important;
    color: var(--primary-navy) !important;
    font-weight: 700;
    text-align: center;
    padding: 8px !important;
    border-bottom: 2px solid var(--accent-gold);
}

/* Remove obsolete grid/card styles for these sections if no longer used */
/* But keeping generic table styles as they apply to the new tables */

/* Feedback Sections */
.feedback-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 25px;
    margin-bottom: 25px;
}

.feedback-card {
    border: 2px solid var(--secondary-blue) !important;
    border-radius: 8px;
    padding: 20px;
    background: white;
    break-inside: avoid;
}

.feedback-card h3 {
    font-family: 'Crimson Pro', serif;
    font-size: 1.4em;
    color: var(--primary-navy) !important;
    margin: 0 0 15px 0;
}

.feedback-row {
    display: grid;
    grid-template-columns: 180px 1fr;
    margin-bottom: 12px;
    align-items: start;
    font-size: 0.95em;
}

.feedback-label {
    font-weight: 600;
    color: var(--secondary-blue) !important;
    padding: 6px 0;
}

.feedback-input {
    border: 1px solid var(--border-grey);
    border-radius: 4px;
    padding: 6px 10px;
    min-height: 35px;
    background: white;
}

/* Signature Section */
.signature-section {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 20px;
    margin-top: 30px;
    padding-top: 30px;
    border-top: 2px solid var(--border-grey);
    page-break-inside: avoid;
}

.signature-box {
    text-align: center;
    padding: 10px 5px;
}

.signature-line {
    height: 50px;
    border-bottom: 2px solid var(--text-dark);
    margin-bottom: 8px;
}

.signature-label {
    font-size: 0.9em;
    font-weight: 600;
    color: var(--secondary-blue) !important;
}

/* Grading Framework */
/* Grading Framework */
.grading-section {
    background: white;
    padding: 15px; /* Reduced padding */
    border-radius: 8px;
    margin-top: 15px; /* Reduced margin */
    border: 2px solid var(--border-grey);
    page-break-inside: avoid;
    height: 100%; /* Ensure full height usage if needed */
}

.grading-section h3 {
    font-family: 'Crimson Pro', serif;
    font-size: 1.3em; /* Slightly smaller */
    color: var(--primary-navy) !important;
    margin-bottom: 10px; /* Reduced margin */
    text-align: center;
}

.grading-grid {
    display: grid;
    grid-template-columns: 60px 100px 1fr; /* Slightly tighter columns */
    gap: 1px;
    background: var(--border-grey);
    border: 1px solid var(--border-grey);
    margin-bottom: 15px; /* Reduced margin */
    font-size: 0.85em; /* Slightly smaller font */
}

.grading-cell {
    padding: 5px 8px; /* Compact padding */
    background: white;
    display: flex;
    align-items: center;
    justify-content: center;
}

.grading-cell:nth-child(3n) {
    justify-content: flex-start; /* Align description text to left */
    text-align: left;
}

.grading-header {
    background: var(--primary-navy) !important;
    color: white !important;
    font-weight: 600;
    text-align: center;
    padding: 8px; /* Reduced padding */
}

.grade-label {
    font-weight: 700;
    color: var(--primary-navy) !important;
    text-align: center;
    font-size: 1.1em;
}

.grade-range {
    font-weight: 600;
    color: var(--secondary-blue) !important;
    text-align: center;
}

/* Evaluation Wrapper for Side-by-Side */
.evaluation-wrapper {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-top: 10px;
}

.evaluation-levels {
    font-size: 0.85em; /* Smaller font */
}

.evaluation-levels h4 {
    font-family: 'Crimson Pro', serif;
    font-size: 1.1em;
    color: var(--primary-navy) !important;
    margin-bottom: 8px; 
    border-bottom: 1px solid #eee;
    padding-bottom: 5px;
}

.level-item {
    display: grid;
    grid-template-columns: 40px 1fr; /* Tighter label column */
    gap: 10px;
    padding: 6px; /* Compact padding */
    margin-bottom: 5px; /* Reduced margin */
    background: white;
    border-left: 4px solid var(--accent-gold) !important;
    border-radius: 4px;
    page-break-inside: avoid;
}

.level-label {
    font-weight: 700;
    font-size: 1.2em;
    color: var(--primary-navy) !important;
    text-align: center;
    align-self: center;
}

@page {
    size: A4 portrait;
    margin: 0.5in; /* 12.7mm margin on all sides */
}
`;
