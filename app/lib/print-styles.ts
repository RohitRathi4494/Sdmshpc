
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
    line-height: 1.5; /* Increased for better filling */
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
    position: relative;
}

/* Header Section */
.header {
    background: linear-gradient(135deg, var(--primary-navy) 0%, var(--secondary-blue) 100%) !important;
    color: white !important;
    padding: 25px 30px; /* Increased vertical padding to fill space */
    text-align: center;
    position: relative;
    overflow: hidden;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
}

.header h1 {
    font-family: 'Crimson Pro', serif;
    font-size: 2.4em; /* Larger Title */
    font-weight: 700;
    margin-bottom: 10px;
    letter-spacing: 0.5px;
    position: relative;
    z-index: 1;
    color: white;
}

.header .subtitle {
    font-size: 1.4em;
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
    padding: 20px 30px; /* Balanced side padding */
    height: 100%;
}

.section {
    margin-bottom: 35px; /* Generous spacing between sections */
    page-break-inside: avoid;
}

.section-title {
    font-family: 'Crimson Pro', serif;
    font-size: 1.6em;
    font-weight: 700;
    color: var(--primary-navy) !important;
    margin-bottom: 20px;
    padding-bottom: 8px;
    border-bottom: 3px solid var(--accent-gold) !important;
    display: flex;
    align-items: center;
    gap: 12px;
}

.section-title::before {
    content: '';
    width: 8px;
    height: 30px;
    background: var(--accent-gold) !important;
    border-radius: 4px;
    display: inline-block;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
}

/* General Information */
.info-grid {
    background: white;
    padding: 20px;
    border: 2px solid var(--border-grey);
    border-radius: 8px;
}

.info-row {
    display: grid;
    grid-template-columns: 220px 1fr;
    margin-bottom: 15px; /* More vertical space */
    align-items: center;
    gap: 15px;
    font-size: 1em;
}

.info-row-split {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 30px;
    margin-bottom: 15px;
}

.info-row-half {
    display: grid;
    grid-template-columns: 120px 1fr;
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

/* Grid Layout for Co-Scholastic */
.grid-2col {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 25px;
    margin-bottom: 25px;
}

.skill-card {
    border: 2px solid var(--border-grey);
    border-radius: 8px;
    padding: 15px; /* More padding */
    background: white;
    break-inside: avoid;
    height: 100%; /* Fill available height */
}

.skill-card h3 {
    font-family: 'Crimson Pro', serif;
    font-size: 1.2em;
    color: var(--secondary-blue) !important;
    margin: 0 0 12px 0;
    padding-bottom: 8px;
    border-bottom: 2px solid var(--accent-gold) !important;
}

.skill-header {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr;
    padding: 8px 0;
    font-weight: 600;
    color: var(--primary-navy) !important;
    border-bottom: 2px solid var(--accent-gold) !important;
    margin-bottom: 8px;
    text-align: center;
    font-size: 0.9em;
}

.skill-header .header-label:first-child {
    text-align: left;
}

.skill-item {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr;
    padding: 8px 0;
    border-bottom: 1px solid rgba(212, 212, 212, 0.4);
    align-items: center;
    font-size: 0.9em;
}

.skill-item:last-child {
    border-bottom: none;
}

.skill-name {
    font-weight: 500;
    color: var(--text-dark);
    text-align: left;
    padding-right: 5px;
}

.achievement-box {
    text-align: center;
    padding: 4px;
    border: 1px solid var(--border-grey);
    border-radius: 4px;
    font-weight: 600;
    min-height: 24px;
    background: #fdfdfd;
}

/* Personality Development */
.personality-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
    margin-bottom: 25px;
}

.personality-card {
    border: 2px solid var(--border-grey);
    border-radius: 8px;
    padding: 15px;
    background: white;
    break-inside: avoid;
    height: 100%;
}

.personality-card h4 {
    font-family: 'Crimson Pro', serif;
    font-size: 1.1em;
    color: var(--primary-navy) !important;
    margin: 0 0 10px 0;
    padding-bottom: 6px;
    border-bottom: 2px solid var(--accent-gold) !important;
}

.personality-header {
    display: grid;
    grid-template-columns: 3fr 1fr 1fr;
    padding: 8px 0;
    font-weight: 600;
    color: var(--primary-navy) !important;
    border-bottom: 2px solid var(--accent-gold) !important;
    margin-bottom: 8px;
    text-align: center;
    font-size: 0.9em;
}

.personality-header .header-label:first-child {
    text-align: left;
}

.personality-item {
    display: grid;
    grid-template-columns: 3fr 1fr 1fr;
    padding: 8px 0;
    border-bottom: 1px solid rgba(212, 212, 212, 0.3);
    font-size: 0.9em;
    align-items: center;
}

.personality-item:last-child {
    border-bottom: none;
}

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
.grading-section {
    background: white;
    padding: 20px;
    border-radius: 8px;
    margin-top: 25px;
    border: 2px solid var(--border-grey);
    page-break-inside: avoid;
}

.grading-section h3 {
    font-family: 'Crimson Pro', serif;
    font-size: 1.4em;
    color: var(--primary-navy) !important;
    margin-bottom: 20px;
    text-align: center;
}

.grading-grid {
    display: grid;
    grid-template-columns: 70px 120px 1fr;
    gap: 1px;
    background: var(--border-grey);
    border: 1px solid var(--border-grey);
    margin-bottom: 20px;
    font-size: 0.9em;
}

.grading-cell {
    padding: 10px;
    background: white;
}

.grading-header {
    background: var(--primary-navy) !important;
    color: white !important;
    font-weight: 600;
    text-align: center;
    padding: 12px;
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

.evaluation-levels {
    margin-top: 20px;
    font-size: 0.9em;
}

.evaluation-levels h4 {
    font-family: 'Crimson Pro', serif;
    font-size: 1.2em;
    color: var(--primary-navy) !important;
    margin-bottom: 12px;
}

.level-item {
    display: grid;
    grid-template-columns: 50px 1fr;
    gap: 15px;
    padding: 10px;
    margin-bottom: 8px;
    background: white;
    border-left: 5px solid var(--accent-gold) !important;
    border-radius: 4px;
}

.level-label {
    font-weight: 700;
    font-size: 1.3em;
    color: var(--primary-navy) !important;
    text-align: center;
    align-self: center;
}

@page {
    size: A4 portrait;
    margin: 0;
}
`;
