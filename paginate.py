import re

def slice_report():
    filepath = 'app/components/reports/ReportTemplate_III_VIII.tsx'
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # The user wants explicitly:
    # Page 1 - General Information and Attendance
    # Page 2- Scholastic Areas and 2 Skills of Coscholastic Area (Physical Ed, Visual Art)
    # Page 3 - Remaining 2 skills of Coscholastis (Performing Dance, Music) and Personality Development
    # Page 4 - Learner's Profile, Self Assessment, parent Feedback and signature box
    # Page 5 - Assessment tables

    # Let's break the monolithic <div className="print-page"> inner contents into pieces.
    # To do this safely and precisely via script in this massive file:
    
    # Define a helper to replace a target with a page break enclosed version
    page_break = """
                </div>
            </div>

            {/* ---> PAGE BREAK <--- */}
            <div className="print-page" style={{
                width: '210mm', minHeight: '293mm', margin: '0 auto 36px', background: C.white,
                borderRadius: 4, boxShadow: '0 4px 24px rgba(0,0,0,0.12)', overflow: 'hidden',
                boxSizing: 'border-box', position: 'relative', pageBreakBefore: 'always'
            }}>
                <div style={{ padding: '22px 28px 28px' }}>
"""

    header_break = """
                </div>
            </div>

            {/* ---> PAGE BREAK <--- */}
            <div className="print-page page-break" style={{
                width: '210mm', minHeight: '293mm', margin: '0 auto 36px', background: C.white,
                borderRadius: 4, boxShadow: '0 4px 24px rgba(0,0,0,0.12)', overflow: 'hidden',
                boxSizing: 'border-box', position: 'relative'
            }}>
                <SchoolHeader />
                <div style={{ padding: '22px 28px 28px' }}>
"""
    
    # 1. Page Break BEFORE Scholastic Domains
    q1 = r'(\{\/\* SCHOLASTIC DOMAINS \*\/\})'
    content = re.sub(q1, header_break + r'\1', content)

    # 2. Page Break INSIDE Co-Scholastic? The user asked for 2 skills on pg 2, 2 on pg 3.
    # Let's physically split the Co-Scholastic table.
    
    # The Co-Scholastic table has Visual Art ending, then Dance.
    visual_art_end = r'(\{\/\* Performing Art - Dance \*\/\})'
    
    split_table = r"""                                </tbody>
                            </table>
                        </div>
                    </div>
""" + header_break + r"""
                    {/* CO-SCHOLASTIC DOMAINS (Continued) */}
                    <div className="section" style={{ marginTop: 0 }}>
                        <div style={{ borderRadius: '4px', border: `1px solid ${C.navy}`, overflow: 'hidden', borderTop: 'none' }}>
                            <table className="foundational-table">
                                <tbody>
                                    \1"""
    
    content = re.sub(visual_art_end, split_table, content)

    # Note: we need to ensure the columns align for the continued table. 
    # Let's inject a visually hidden header so column widths match perfectly.
    hidden_header = r"""                                <tbody>
                                    <tr style={{ visibility: 'collapse' }}>
                                        <th style={{ width: '50%' }}></th>
                                        <th style={{ width: '25%' }}></th>
                                        <th style={{ width: '25%' }}></th>
                                    </tr>
                                    {/* Performing"""
                                    
    content = content.replace('<tbody>\n                                    {/* Performing', hidden_header)


    # 3. Page Break BEFORE Feedback (which brings Feedback + Signatures to Page 4)
    q3 = r'(\{\/\* FEEDBACK SECTIONS \*\/\})'
    content = re.sub(q3, header_break + r'\1', content)

    # 4. Page Break BEFORE Grading Framework (brings Grading to Page 5)
    q4 = r'(\{\/\* GRADING FRAMEWORK \*\/\})'
    content = re.sub(q4, header_break + r'\1', content)
    
    # CSS rule injection for page-break
    css_break = r"""        @media print {
            .page-break {
                page-break-before: always;
                break-before: page;
            }"""
            
    content = content.replace("        @media print {", css_break)


    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
        
    print("Code paginated successfully.")

if __name__ == '__main__':
    slice_report()
