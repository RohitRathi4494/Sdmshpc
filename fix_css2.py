import re

def fix_css_and_footer():
    filepath = 'app/components/reports/ReportTemplate_III_VIII.tsx'
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Restore the core foundational CSS to the previous standard
    # font-size from 10px back to 11px
    content = re.sub(
        r'(\.foundational-table td\s*\{[^}]*font-size:\s*)10px',
        r'\g<1>11px',
        content
    )
    # th font-size from 9.5px back to 10.5px
    content = re.sub(
        r'(\.foundational-table th\s*\{[^}]*font-size:\s*)9\.5px',
        r'\g<1>10.5px',
        content
    )
    
    # td padding back to 6px 10px
    content = re.sub(
        r'(\.foundational-table td\s*\{[^}]*padding:\s*)4px 4px\s*!important',
        r'\g<1>6px 10px !important',
        content
    )
    # th padding back to 9px 14px
    content = re.sub(
        r'(\.foundational-table th\s*\{[^}]*padding:\s*)6px 4px\s*!important',
        r'\g<1>9px 14px !important',
        content
    )
    # tr.domain-header td padding back to 10px 14px
    content = re.sub(
        r'(\.foundational-table tr\.domain-header td\s*\{[^}]*padding:\s*)6px 14px\s*!important',
        r'\g<1>10px 14px !important',
        content
    )

    # 2. Target ONLY the scholastic table for horizontal compression
    # We will inject a new CSS rule just before the closing </style>
    scholastic_css = r"""
        .scholastic-table th, .scholastic-table td {
            padding-left: 2px !important;
            padding-right: 2px !important;
        }
    """
    if '.scholastic-table' not in content:
        content = content.replace('    `}</style>', scholastic_css + '    `}</style>')

    # Apply the scholastic-table class to the first table
    content = content.replace('<table className="foundational-table">', '<table className="foundational-table scholastic-table">', 1)


    # 3. Fix the footer logic to ONLY display under Final Result
    old_footer = r"""                                                <tr className="domain-header">
                                                    <td colSpan={9} style={{ textAlign: 'left', paddingLeft: '12px' }}>Grand Total</td>
                                                    <td style={{ fontWeight: 800 }}>{max1 > 0 ? `${grandTotal1.toFixed(1)} / ${max1}` : ''}</td>
                                                    <td style={{ fontWeight: 800 }}>{max2 > 0 ? `${grandTotal2.toFixed(1)} / ${max2}` : ''}</td>
                                                    <td style={{ fontWeight: 800, color: C.navy }}>{maxAvg > 0 ? `${grandTotalAvg.toFixed(1)} / ${maxAvg}` : ''}</td>
                                                </tr>
                                                <tr className="domain-header" style={{ background: '#d1e0f7' }}>
                                                    <td colSpan={9} style={{ textAlign: 'left', paddingLeft: '12px' }}>Percentage</td>
                                                    <td style={{ fontWeight: 800 }}>{p1 ? `${p1}%` : ''}</td>
                                                    <td style={{ fontWeight: 800 }}>{p2 ? `${p2}%` : ''}</td>
                                                    <td style={{ fontWeight: 800, color: C.navy }}>{pAvg ? `${pAvg}%` : ''}</td>
                                                </tr>"""
                                                
    new_footer = r"""                                                <tr className="domain-header">
                                                    <td colSpan={11} style={{ textAlign: 'right', paddingRight: '15px' }}>Total Marks Obtained</td>
                                                    <td style={{ fontWeight: 800, color: C.navy }}>{maxAvg > 0 ? `${grandTotalAvg.toFixed(1)} / ${maxAvg}` : ''}</td>
                                                </tr>
                                                <tr className="domain-header" style={{ background: '#d1e0f7' }}>
                                                    <td colSpan={11} style={{ textAlign: 'right', paddingRight: '15px' }}>Overall Percentage</td>
                                                    <td style={{ fontWeight: 800, color: C.navy }}>{pAvg ? `${pAvg}%` : ''}</td>
                                                </tr>"""
    
    content = content.replace(old_footer, new_footer)


    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
        
    print("Fixed CSS and Scholastic Layout successfully.")

if __name__ == '__main__':
    fix_css_and_footer()
