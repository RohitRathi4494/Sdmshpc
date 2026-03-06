import os

with open('app/components/reports/ReportTemplate_III_VIII.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# I will define exactly what starts and ends each block.
# I will use code.find() and code.substring() natively.

def get_bound(start_str, end_str):
    start = code.find(start_str)
    if start == -1: raise ValueError("Not found: " + start_str)
    
    if end_str is None:
        return code[start:]
    
    end = code.find(end_str, start)
    if end == -1: raise ValueError("Not found: " + end_str + " after " + start_str)
    
    # We return the block EXCEPT the end_str
    return code[start:end]

# Extractor definitions
# Page 1
prefix = code[:code.find('{/* GENERAL INFORMATION */}')]
gen_info = get_bound('{/* GENERAL INFORMATION */}', '{/* ATTENDANCE RECORD */}')
attendance = get_bound('{/* ATTENDANCE RECORD */}', '                </div>\n            </div>\n\n            {/* ---> PAGE BREAK <--- */}')

# Page 2
scholastic = get_bound('{/* SCHOLASTIC DOMAINS */}', '{/* CO-SCHOLASTIC DOMAINS */}')
co_scholastic_1 = get_bound('{/* CO-SCHOLASTIC DOMAINS */}', '                </div>\n            </div>\n\n            {/* ---> PAGE BREAK <--- */}')

# Page 3
co_scholastic_2 = get_bound('{/* CO-SCHOLASTIC DOMAINS (Continued) */}', '{/* PERSONALITY DEVELOPMENT SKILLS */}')

pers_full = get_bound('{/* PERSONALITY DEVELOPMENT SKILLS */}', '                </div>\n            </div>\n\n            {/* ---> PAGE BREAK <--- */}')
# split Personality Full into halves
# half 1 ends right before work habit tbody
# We need to find the <tbody> for Work Habit
work_habit_tbody_idx = pers_full.find('<tbody', pers_full.find('{/* Work Habit */}'))
# wait, the tbody comes BEFORE the comment!
# Let's find the closing </tbody> for Emotional Skills instead
emo_end_idx = pers_full.find('</tbody>', pers_full.find('{/* Emotional Skills */}')) + 8
pers_half_1 = pers_full[:emo_end_idx] + '\n                            </table>\n                        </div>\n                    </div>\n'

# half 2 needs the section header, the table header, and then Work Habit + Health
pers_head_raw = pers_full[:pers_full.find('<tbody')]
pers_head = pers_head_raw.replace('Personality Development Skills', 'Personality Development Skills (Continued)')
pers_half_2 = pers_head + pers_full[emo_end_idx:]

# Page 4
feedback_full = get_bound('{/* FEEDBACK SECTIONS */}', '{/* SIGNATURE SECTION */}')
# we split feedback_full at Self Assessment
self_assess_idx = feedback_full.find('{/* Self Assessment */}')
fb_half_1 = feedback_full[:self_assess_idx] + '\n                        </div>\n                    </div>\n'

# half 2 is wrapped in its own section
fb_half_2_raw = feedback_full[self_assess_idx:]
fb_half_2 = '                    <div className="section" style={{ marginTop: 0 }}>\n                        <div className="feedback-grid">\n' + \
            fb_half_2_raw.replace('<h3>Self-Assessment</h3>', '<h3>Student Feedback (Self-Assessment)</h3>')

signature = get_bound('{/* SIGNATURE SECTION */}', '                </div>\n            </div>\n\n            {/* ---> PAGE BREAK <--- */}')

# Page 5
evaluations = get_bound('{/* EVALUATION LEVELS */}', '                </div>\n            </div>\n\n            {/* Local Styles for Matching Foundational */}')

suffix = code[code.find('            {/* Local Styles for Matching Foundational */}'):]

# REASSEMBLE
# Note: get_bound did NOT include the `</div></div>` for the pages or the page breaks.
page_break = """                </div>
            </div>

            {/* ---> PAGE BREAK <--- */}
            <div className="print-page page-break" style={{
                width: '100%', maxWidth: '210mm', minHeight: '293mm', margin: '0 auto 36px', background: C.white,
                borderRadius: 4, boxShadow: '0 4px 24px rgba(0,0,0,0.12)', overflow: 'hidden',
                boxSizing: 'border-box', position: 'relative'
            }}>
                <GoldBar />
                <div style={{ padding: '22px 14px 28px' }}>
"""

# Page 1: Prefix already has the page header and padding div
page1 = prefix + gen_info + scholastic

# Page 2: 
page2 = co_scholastic_1 + co_scholastic_2 + pers_half_1

# Page 3:
page3 = pers_half_2 + fb_half_1

# Page 4:
page4 = fb_half_2 + attendance + signature + evaluations

final = page1 + page_break + page2 + page_break + page3 + page_break + page4 + '                </div>\n            </div>\n\n' + suffix

with open('app/components/reports/ReportTemplate_III_VIII.tsx', 'w', encoding='utf-8') as f:
    f.write(final)

print("Split logic rebuild successful.")
