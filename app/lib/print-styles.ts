
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
    line-height: 1.6;
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
    padding: 20px 40px;
    text-align: center;
    position: relative;
    overflow: hidden;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
}

.header h1 {
    font-family: 'Crimson Pro', serif;
    font-size: 2.2em;
    font-weight: 700;
    margin-bottom: 8px;
    letter-spacing: 0.5px;
    position: relative;
    z-index: 1;
    color: white;
}

.header .subtitle {
    font-size: 1.3em;
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
    padding: 20px 40px;
}

.section {
    margin-bottom: 30px;
    page-break-inside: avoid;
}

.section-title {
    font-family: 'Crimson Pro', serif;
    font-size: 1.5em;
    font-weight: 700;
    color: var(--primary-navy) !important;
    margin-bottom: 15px;
    padding-bottom: 5px;
    border-bottom: 3px solid var(--accent-gold) !important;
    display: flex;
    align-items: center;
    gap: 10px;
}

.section-title::before {
    content: '';
    width: 6px;
    height: 25px;
    background: var(--accent-gold) !important;
    border-radius: 3px;
    display: inline-block;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
}

/* General Information */
.info-grid {
    background: white;
    padding: 15px;
    border: 2px solid var(--border-grey);
    border-radius: 6px;
}

.info-row {
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

.info-row-half {
    display: grid;
    grid-template-columns: 100px 1fr;
    gap: 10px;
    align-items: center;
}

.info-label {
    font-weight: 600;
    color: var(--secondary-blue) !important;
}

.info-input {
    border: 1px solid var(--border-grey);
    border-radius: 4px;
    padding: 5px 10px;
    min-height: 30px;
    background: rgba(232, 241, 245, 0.1);
    display: flex;
    align-items: center;
}

/* Tables */
table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 20px;
    font-size: 0.85em;
    box-shadow: none;
}

thead {
    background: var(--primary-navy) !important;
    color: white !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
}

th {
    padding: 8px;
    text-align: center;
    font-weight: 600;
    letter-spacing: 0.5px;
    border: 1px solid #000;
    color: white !important;
}

td {
    padding: 6px;
    border: 1px solid var(--border-grey);
    background: white;
    text-align: center;
}

td.subject-name {
    font-weight: 600;
    color: var(--primary-navy) !important;
    text-align: left;
    padding-left: 10px;
}

td.input-cell {
    min-width: 50px;
    text-align: center;
}

/* Grid Layout for Co-Scholastic */
.grid-2col {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-bottom: 20px;
}

.skill-card {
    border: 2px solid var(--border-grey);
    border-radius: 6px;
    padding: 10px;
    background: white;
    break-inside: avoid;
}

.skill-card h3 {
    font-family: 'Crimson Pro', serif;
    font-size: 1.1em;
    color: var(--secondary-blue) !important;
    margin: 0 0 10px 0;
    padding-bottom: 5px;
    border-bottom: 2px solid var(--accent-gold) !important;
}

.skill-header {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr;
    padding: 5px 0;
    font-weight: 600;
    color: var(--primary-navy) !important;
    border-bottom: 2px solid var(--accent-gold) !important;
    margin-bottom: 5px;
    text-align: center;
    font-size: 0.8em;
}

.skill-header .header-label:first-child {
    text-align: left;
}

.skill-item {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr;
    padding: 5px 0;
    border-bottom: 1px solid rgba(212, 212, 212, 0.4);
    align-items: center;
    font-size: 0.8em;
}

.skill-item:last-child {
    border-bottom: none;
}

.skill-name {
    font-weight: 500;
    color: var(--text-dark);
    text-align: left;
}

.achievement-box {
    text-align: center;
    padding: 2px;
    border: 1px solid var(--border-grey);
    border-radius: 4px;
    font-weight: 500;
    min-height: 20px;
}

/* Personality Development */
.personality-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
    margin-bottom: 20px;
}

.personality-card {
    border: 2px solid var(--border-grey);
    border-radius: 6px;
    padding: 10px;
    background: white;
    break-inside: avoid;
}

.personality-card h4 {
    font-family: 'Crimson Pro', serif;
    font-size: 1em;
    color: var(--primary-navy) !important;
    margin: 0 0 8px 0;
    padding-bottom: 4px;
    border-bottom: 2px solid var(--accent-gold) !important;
}

.personality-header {
    display: grid;
    grid-template-columns: 3fr 1fr 1fr;
    padding: 5px 0;
    font-weight: 600;
    color: var(--primary-navy) !important;
    border-bottom: 2px solid var(--accent-gold) !important;
    margin-bottom: 5px;
    text-align: center;
    font-size: 0.8em;
}

.personality-header .header-label:first-child {
    text-align: left;
}

.personality-item {
    display: grid;
    grid-template-columns: 3fr 1fr 1fr;
    padding: 5px 0;
    border-bottom: 1px solid rgba(212, 212, 212, 0.3);
    font-size: 0.8em;
    align-items: center;
}

.personality-item:last-child {
    border-bottom: none;
}

/* Feedback Sections */
.feedback-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 20px;
    margin-bottom: 20px;
}

.feedback-card {
    border: 2px solid var(--secondary-blue) !important;
    border-radius: 6px;
    padding: 15px;
    background: white;
    break-inside: avoid;
}

.feedback-card h3 {
    font-family: 'Crimson Pro', serif;
    font-size: 1.2em;
    color: var(--primary-navy) !important;
    margin: 0 0 10px 0;
}

.feedback-row {
    display: grid;
    grid-template-columns: 150px 1fr;
    margin-bottom: 8px;
    align-items: start;
    font-size: 0.85em;
}

.feedback-label {
    font-weight: 600;
    color: var(--secondary-blue) !important;
    padding: 4px 0;
}

.feedback-input {
    border: 1px solid var(--border-grey);
    border-radius: 4px;
    padding: 4px 8px;
    min-height: 25px;
    background: white;
}

/* Signature Section */
.signature-section {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 15px;
    margin-top: 20px;
    padding-top: 20px;
    border-top: 2px solid var(--border-grey);
    page-break-inside: avoid;
}

.signature-box {
    text-align: center;
    padding: 10px 5px;
}

.signature-line {
    height: 40px;
    border-bottom: 2px solid var(--text-dark);
    margin-bottom: 5px;
}

.signature-label {
    font-size: 0.8em;
    font-weight: 600;
    color: var(--secondary-blue) !important;
}

/* Grading Framework */
.grading-section {
    background: white;
    padding: 15px;
    border-radius: 6px;
    margin-top: 20px;
    border: 2px solid var(--border-grey);
    page-break-inside: avoid;
}

.grading-section h3 {
    font-family: 'Crimson Pro', serif;
    font-size: 1.2em;
    color: var(--primary-navy) !important;
    margin-bottom: 15px;
    text-align: center;
}

.grading-grid {
    display: grid;
    grid-template-columns: 60px 100px 1fr;
    gap: 1px;
    background: var(--border-grey);
    border: 1px solid var(--border-grey);
    margin-bottom: 15px;
    font-size: 0.8em;
}

.grading-cell {
    padding: 8px;
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
    margin-top: 15px;
    font-size: 0.8em;
}

.evaluation-levels h4 {
    font-family: 'Crimson Pro', serif;
    font-size: 1.1em;
    color: var(--primary-navy) !important;
    margin-bottom: 10px;
}

.level-item {
    display: grid;
    grid-template-columns: 40px 1fr;
    gap: 10px;
    padding: 8px;
    margin-bottom: 5px;
    background: white;
    border-left: 4px solid var(--accent-gold) !important;
    border-radius: 4px;
}

.level-label {
    font-weight: 700;
    font-size: 1.1em;
    color: var(--primary-navy) !important;
    text-align: center;
    align-self: center;
}

@page {
    size: A4 portrait;
    margin: 0;
}
\`;
