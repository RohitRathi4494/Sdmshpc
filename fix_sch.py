import re

def modify_scholastic():
    filepath = 'app/components/reports/ReportTemplate_III_VIII.tsx'
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Modify Final Result header to not be gold
    content = content.replace(
        '<th rowSpan={2} className="gold-bg">Final Result<br />(Avg)</th>',
        '<th rowSpan={2}>Final Result<br />(Avg)</th>'
    )
    
    # Also fix the previous version just in case no space in <br/>
    content = content.replace(
        '<th rowSpan={2} className="gold-bg">Final Result<br/>(Avg)</th>',
        '<th rowSpan={2}>Final Result<br/>(Avg)</th>'
    )

    # 2. Modify the CSS padding via replace
    # We want padding in th to be smaller
    content = content.replace(
        'padding: 9px 14px !important;',
        'padding: 6px 4px !important;'
    )
    # We want padding in td to be smaller (was 6px 10px or 8px 10px)
    content = content.replace(
        'padding: 6px 10px !important;',
        'padding: 4px 4px !important;'
    )
    
    # Lower td font-size slightly to 10px to fit everything seamlessly
    content = re.sub(
        r'(\.foundational-table td\s*\{[^}]*font-size:\s*)11px',
        r'\g<1>' + '10px',
        content
    )
    
    # Lower th font-size slightly to 9.5px to fit everything seamlessly
    content = re.sub(
        r'(\.foundational-table th\s*\{[^}]*font-size:\s*)10\.5px',
        r'\g<1>' + '9.5px',
        content
    )


    # 3. Add total and percentage footer to the scholastic table
    # We will replace the entire <tbody> mapping for scholastic and compute vars before map
    
    # We need to find the tbody of Scholastic
    sch_start = content.find('<tbody>\n                                    {reportData.subjects?.map((sub: any) => {')
    if sch_start == -1:
        print("Could not find start of scholastic mapping.")
        return
        
    sch_end = content.find('</tbody>\n                            </table>\n                        </div>\n                    </div>\n\n                    {/* ---> PAGE BREAK <--- */}')
    if sch_end == -1:
        # Fallback to general
        sch_end = content.find('</tbody>\n                            </table>\n                        </div>\n                    </div>\n\n                    {/* CO-SCHOLASTIC DOMAINS */}')
        
    if sch_end == -1:
        # Try finding just table close
        s = content[sch_start:]
        end_idx = s.find('</tbody>')
        if end_idx != -1:
            sch_end = sch_start + end_idx
        else:
            print("Could not find end of scholastic table.")
            return

    new_tbody = """<tbody>
                                    {(() => {
                                        let grandTotal1 = 0;
                                        let grandTotal2 = 0;
                                        let grandTotalAvg = 0;
                                        let subjectCount1 = 0;
                                        let subjectCount2 = 0;

                                        const rows = reportData.subjects?.map((sub: any) => {
                                            const subject = sub.subject_name;
                                            
                                            const getVal = (comp: string, term: string) => {
                                                const s = getScholasticScore(subject, comp, term);
                                                if (!s || !s.marks) return 0;
                                                const num = parseFloat(s.marks);
                                                return isNaN(num) ? 0 : num;
                                            };
                                            
                                            const hasMarks = (term: string) => {
                                                return getScholasticScore(subject, 'Periodic Assessment', term) || 
                                                       getScholasticScore(subject, 'Terminal Assessment', term);
                                            };

                                            const total1 = getVal('Periodic Assessment', 'Term I') + 
                                                           getVal('Subject Enrichment Activities', 'Term I') + 
                                                           getVal('Internal Assessment', 'Term I') + 
                                                           getVal('Terminal Assessment', 'Term I');
                                                           
                                            const total2 = getVal('Periodic Assessment', 'Term II') + 
                                                           getVal('Subject Enrichment Activities', 'Term II') + 
                                                           getVal('Internal Assessment', 'Term II') + 
                                                           getVal('Terminal Assessment', 'Term II');
                                            
                                            if (hasMarks('Term I')) {
                                                grandTotal1 += total1;
                                                subjectCount1++;
                                            }
                                            if (hasMarks('Term II')) {
                                                grandTotal2 += total2;
                                                subjectCount2++;
                                            }
                                            
                                            const avg = (total1 + total2) / 2;
                                            if (hasMarks('Term I') || hasMarks('Term II')) {
                                                grandTotalAvg += avg;
                                            }

                                            const displayTotal1 = hasMarks('Term I') ? parseFloat(total1.toFixed(2)) : '';
                                            const displayTotal2 = hasMarks('Term II') ? parseFloat(total2.toFixed(2)) : '';
                                            const displayAvg = (hasMarks('Term I') || hasMarks('Term II')) ? parseFloat(avg.toFixed(2)) : '';

                                            return (
                                                <tr key={subject}>
                                                    <td className="text-left" style={{ paddingLeft: '12px' }}>{subject}</td>
                                                    {renderScoreCell(subject, 'Periodic Assessment', 'Term I')}
                                                    {renderScoreCell(subject, 'Periodic Assessment', 'Term II')}
                                                    {renderScoreCell(subject, 'Subject Enrichment Activities', 'Term I')}
                                                    {renderScoreCell(subject, 'Subject Enrichment Activities', 'Term II')}
                                                    {renderScoreCell(subject, 'Internal Assessment', 'Term I')}
                                                    {renderScoreCell(subject, 'Internal Assessment', 'Term II')}
                                                    {renderScoreCell(subject, 'Terminal Assessment', 'Term I')}
                                                    {renderScoreCell(subject, 'Terminal Assessment', 'Term II')}
                                                    <td style={{ fontWeight: 700 }}>{displayTotal1}</td>
                                                    <td style={{ fontWeight: 700 }}>{displayTotal2}</td>
                                                    <td style={{ fontWeight: 800, color: C.navy }}>{displayAvg}</td>
                                                </tr>
                                            );
                                        });
                                        
                                        const max1 = subjectCount1 * 100;
                                        const max2 = subjectCount2 * 100;
                                        const maxAvg = Math.max(subjectCount1, subjectCount2) * 100;

                                        const p1 = max1 > 0 ? ((grandTotal1 / max1) * 100).toFixed(2) : '';
                                        const p2 = max2 > 0 ? ((grandTotal2 / max2) * 100).toFixed(2) : '';
                                        const pAvg = maxAvg > 0 ? ((grandTotalAvg / maxAvg) * 100).toFixed(2) : '';

                                        return (
                                            <>
                                                {rows}
                                                <tr className="domain-header">
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
                                                </tr>
                                            </>
                                        );
                                    })()}
                                """

    content = content[:sch_start] + new_tbody + content[sch_end:]
    
    # Also adjust the "Subjects" column width back to auto or 15% instead of 18% so data columns expand
    content = content.replace("<th rowSpan={2} style={{ width: '18%' }}>Subjects</th>", "<th rowSpan={2} style={{ width: '15%' }}>Subjects</th>")

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

    print("Updated scholastic tables and computations!")

if __name__ == "__main__":
    modify_scholastic()
