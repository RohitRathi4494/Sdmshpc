
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

body {
    font-family: 'Work Sans', sans-serif;
    background: white;
    color: var(--text-dark);
    line-height: 1.4; /* Reduced line height */
    margin: 0;
    padding: 0;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
}

.container {
    width: 210mm;
    min-height: 297mm;
    margin: 0 auto;
    padding: 0;
    box-sizing: border-box;
    background: white;
    overflow: hidden;
}

/* Header Section */
.header {
    background: linear-gradient(135deg, var(--primary-navy) 0%, var(--secondary-blue) 100%) !important;
    color: white !important;
    padding: 15px 25px; /* Reduced padding */
    text-align: center;
    position: relative;
    overflow: hidden;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
}

.header h1 {
    font-family: 'Crimson Pro', serif;
    font-size: 1.8em; /* Reduced size */
    font-weight: 700;
    margin-bottom: 5px;
    letter-spacing: 0.5px;
    position: relative;
    z-index: 1;
    color: white;
}

.header .subtitle {
    font-size: 1.1em; /* Reduced size */
    font-weight: 600;
    opacity: 0.95;
    letter-spacing: 2px;
    text-transform: uppercase;
    position: relative;
    z-index: 1;
    color: white;
}

/* Content Area */
.content {
    padding: 15px 25px; /* Reduced padding to fit wider tables */
}

.section {
    margin-bottom: 20px; /* Reduced margin */
    page-break-inside: avoid;
}

.section-title {
    font-family: 'Crimson Pro', serif;
    font-size: 1.3em; /* Reduced size */
    font-weight: 700;
    color: var(--primary-navy) !important;
    margin-bottom: 10px;
    padding-bottom: 5px;
    border-bottom: 2px solid var(--accent-gold) !important;
    display: flex;
    align-items: center;
    gap: 8px;
}

.section-title::before {
    content: '';
    width: 5px;
    height: 20px;
    background: var(--accent-gold) !important;
    border-radius: 2px;
    display: inline-block;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
}

/* General Information */
.info-grid {
    background: white;
    padding: 10px; /* Reduced padding */
    border: 2px solid var(--border-grey);
    border-radius: 6px;
}

.info-row {
    display: grid;
    grid-template-columns: 180px 1fr; /* Compact labels */
    margin-bottom: 8px;
    align-items: center;
    gap: 10px;
    font-size: 0.9em; /* Smaller font */
}

.info-row-split {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 15px;
    margin-bottom: 8px;
}

.info-row-half {
    display: grid;
    grid-template-columns: 90px 1fr;
    gap: 8px;
    align-items: center;
    font-size: 0.9em;
}

.info-label {
    font-weight: 600;
    color: var(--secondary-blue) !important;
}

.info-input {
    border: 1px solid var(--border-grey);
    border-radius: 4px;
    padding: 4px 8px;
    min-height: 24px; /* Reduced height */
    background: rgba(232, 241, 245, 0.1);
    display: flex;
    align-items: center;
}

/* Tables */
table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 15px;
    font-size: 0.75em; /* Smaller font for table content */
    box-shadow: none;
    page-break-inside: auto; /* Allow rows to break if needed, but prefer section break */
}

thead {
    background: var(--primary-navy) !important;
    color: white !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    display: table-header-group; /* Repeat headers on new page */
}

th {
    padding: 6px 4px; /* Tighter padding */
    text-align: center;
    font-weight: 600;
    letter-spacing: 0.3px;
    border: 1px solid #000;
    color: white !important;
    font-size: 1.1em; /* Slightly larger relative to cell text */
}

td {
    padding: 4px 2px; /* Tighter padding */
    border: 1px solid var(--border-grey);
    background: white;
    text-align: center;
    vertical-align: middle;
}

td.subject-name {
    font-weight: 600;
    color: var(--primary-navy) !important;
    text-align: left;
    padding-left: 8px;
}

td.input-cell {
    min-width: 40px; /* Reduced min-width */
    text-align: center;
}

/* Grid Layout for Co-Scholastic */
.grid-2col {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 15px;
    margin-bottom: 15px;
}

.skill-card {
    border: 2px solid var(--border-grey);
    border-radius: 6px;
    padding: 8px;
    background: white;
    break-inside: avoid;
}

.skill-card h3 {
    font-family: 'Crimson Pro', serif;
    font-size: 1em;
    color: var(--secondary-blue) !important;
    margin: 0 0 8px 0;
    padding-bottom: 4px;
    border-bottom: 2px solid var(--accent-gold) !important;
}

.skill-header {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr;
    padding: 4px 0;
    font-weight: 600;
    color: var(--primary-navy) !important;
    border-bottom: 1px solid var(--accent-gold) !important;
    margin-bottom: 4px;
    text-align: center;
    font-size: 0.75em;
}

.skill-header .header-label:first-child {
    text-align: left;
}

.skill-item {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr;
    padding: 4px 0;
    border-bottom: 1px solid rgba(212, 212, 212, 0.4);
    align-items: center;
    font-size: 0.75em;
}

.skill-item:last-child {
    border-bottom: none;
}

.skill-name {
    font-weight: 500;
    color: var(--text-dark);
    text-align: left;
    line-height: 1.2;
}

.achievement-box {
    text-align: center;
    padding: 2px;
    border: 1px solid var(--border-grey);
    border-radius: 4px;
    font-weight: 500;
    min-height: 18px;
}

/* Personality Development */
.personality-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
    margin-bottom: 15px;
}

.personality-card {
    border: 2px solid var(--border-grey);
    border-radius: 6px;
    padding: 8px;
    background: white;
    break-inside: avoid;
}

.personality-card h4 {
    font-family: 'Crimson Pro', serif;
    font-size: 0.95em;
    color: var(--primary-navy) !important;
    margin: 0 0 6px 0;
    padding-bottom: 3px;
    border-bottom: 2px solid var(--accent-gold) !important;
}

.personality-header {
    display: grid;
    grid-template-columns: 3fr 1fr 1fr;
    padding: 4px 0;
    font-weight: 600;
    color: var(--primary-navy) !important;
    border-bottom: 1px solid var(--accent-gold) !important;
    margin-bottom: 4px;
    text-align: center;
    font-size: 0.75em;
}

.personality-header .header-label:first-child {
    text-align: left;
}

.personality-item {
    display: grid;
    grid-template-columns: 3fr 1fr 1fr;
    padding: 4px 0;
    border-bottom: 1px solid rgba(212, 212, 212, 0.3);
    font-size: 0.75em;
    align-items: center;
}

.personality-item:last-child {
    border-bottom: none;
}

/* Feedback Sections */
.feedback-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 15px;
    margin-bottom: 15px;
}

.feedback-card {
    border: 2px solid var(--secondary-blue) !important;
    border-radius: 6px;
    padding: 12px;
    background: white;
    break-inside: avoid;
}

.feedback-card h3 {
    font-family: 'Crimson Pro', serif;
    font-size: 1.1em;
    color: var(--primary-navy) !important;
    margin: 0 0 8px 0;
}

.feedback-row {
    display: grid;
    grid-template-columns: 140px 1fr;
    margin-bottom: 6px;
    align-items: start;
    font-size: 0.8em;
}

.feedback-label {
    font-weight: 600;
    color: var(--secondary-blue) !important;
    padding: 3px 0;
}

.feedback-input {
    border: 1px solid var(--border-grey);
    border-radius: 4px;
    padding: 3px 6px;
    min-height: 22px;
    background: white;
}

/* Signature Section */
.signature-section {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 10px;
    margin-top: 15px;
    padding-top: 15px;
    border-top: 2px solid var(--border-grey);
    page-break-inside: avoid;
}

.signature-box {
    text-align: center;
    padding: 8px 4px;
}

.signature-line {
    height: 35px;
    border-bottom: 2px solid var(--text-dark);
    margin-bottom: 4px;
}

.signature-label {
    font-size: 0.75em;
    font-weight: 600;
    color: var(--secondary-blue) !important;
}

/* Grading Framework */
.grading-section {
    background: white;
    padding: 12px;
    border-radius: 6px;
    margin-top: 15px;
    border: 2px solid var(--border-grey);
    page-break-inside: avoid;
}

.grading-section h3 {
    font-family: 'Crimson Pro', serif;
    font-size: 1.1em;
    color: var(--primary-navy) !important;
    margin-bottom: 12px;
    text-align: center;
}

.grading-grid {
    display: grid;
    grid-template-columns: 50px 90px 1fr;
    gap: 1px;
    background: var(--border-grey);
    border: 1px solid var(--border-grey);
    margin-bottom: 12px;
    font-size: 0.75em;
}

.grading-cell {
    padding: 6px;
    background: white;
}

.grading-header {
    background: var(--primary-navy) !important;
    color: white !important;
    font-weight: 600;
    text-align: center;
}

.grade-label {
    font-weight: 700;
    color: var(--primary-navy) !important;
    text-align: center;
}

.grade-range {
    font-weight: 600;
    color: var(--secondary-blue) !important;
    text-align: center;
}

.evaluation-levels {
    margin-top: 12px;
    font-size: 0.75em;
}

.evaluation-levels h4 {
    font-family: 'Crimson Pro', serif;
    font-size: 1em;
    color: var(--primary-navy) !important;
    margin-bottom: 8px;
}

.level-item {
    display: grid;
    grid-template-columns: 35px 1fr;
    gap: 8px;
    padding: 6px;
    margin-bottom: 4px;
    background: white;
    border-left: 3px solid var(--accent-gold) !important;
    border-radius: 3px;
}

.level-label {
    font-weight: 700;
    font-size: 1em;
    color: var(--primary-navy) !important;
    text-align: center;
    align-self: center;
}

@page {
    size: A4 portrait;
    margin: 0;
}
`;
