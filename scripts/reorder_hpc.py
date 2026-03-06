import re

with open('app/components/reports/ReportTemplate_III_VIII.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Helper to find exactly one match
def extract(pattern, string):
    m = re.search(pattern, string, re.DOTALL)
    if not m:
        raise ValueError(f"Pattern not found: {pattern}")
    return m.group(1).strip() + '\n'

# Get everything before page 1 body starts
prefix_match = re.search(r'^(.*?(?:<SchoolHeader />\s*<div style={{ padding: \'22px 14px 28px\' }}>\s*))', text, re.DOTALL)
prefix = prefix_match.group(1)

# Get everything after evaluation section
suffix_match = re.search(r'(\s*\{\/\*\s*Local Styles for Matching Foundational\s*\*\/\}.*)$', text, re.DOTALL)
suffix = suffix_match.group(1)

# Sections
sec_gen_info = extract(r'(\{\/\*\s*GENERAL INFORMATION\s*\*\/\}.*?)(?=\{\/\*\s*ATTENDANCE RECORD\s*\*\/\})', text)
sec_attendance = extract(r'(\{\/\*\s*ATTENDANCE RECORD\s*\*\/\}.*?)(?=\s*<\/div>\s*<\/div>\s*\{\/\*\s*---> PAGE BREAK <--- \*\/\})', text)

sec_scholastic = extract(r'(\{\/\*\s*SCHOLASTIC DOMAINS\s*\*\/\}.*?)(?=\{\/\*\s*CO-SCHOLASTIC DOMAINS\s*\*\/\})', text)
sec_cosch_1 = extract(r'(\{\/\*\s*CO-SCHOLASTIC DOMAINS\s*\*\/\}.*?)(?=\s*<\/div>\s*<\/div>\s*\{\/\*\s*---> PAGE BREAK <--- \*\/\})', text)
sec_cosch_2 = extract(r'(\{\/\*\s*CO-SCHOLASTIC DOMAINS \(Continued\)\s*\*\/\}.*?)(?=\{\/\*\s*PERSONALITY DEVELOPMENT SKILLS\s*\*\/\})', text)

# Personality split
pers_full = extract(r'(\{\/\*\s*PERSONALITY DEVELOPMENT SKILLS\s*\*\/\}.*?)(?=\s*<\/div>\s*<\/div>\s*\{\/\*\s*---> PAGE BREAK <--- \*\/\})', text)
pers_head = re.search(r'^(.*?)<tbody', pers_full, re.DOTALL).group(1).strip() + '\n'
pers_social = re.search(r'(<tbody.*?\{\/\*\s*Social Skills\s*\*\/\}.*?<\/tbody>)', pers_full, re.DOTALL).group(1).strip() + '\n'
pers_emot = re.search(r'(<tbody.*?\{\/\*\s*Emotional Skills\s*\*\/\}.*?<\/tbody>)', pers_full, re.DOTALL).group(1).strip() + '\n'
pers_work = re.search(r'(<tbody.*?\{\/\*\s*Work Habit\s*\*\/\}.*?<\/tbody>)', pers_full, re.DOTALL).group(1).strip() + '\n'
pers_health = re.search(r'(<tbody.*?\{\/\*\s*Health & Wellness\s*\*\/\}.*?<\/table>\s*<\/div>\s*<\/div>)', pers_full, re.DOTALL).group(1).strip() + '\n'

pers_head_2 = pers_head.replace('Personality Development Skills', 'Personality Development Skills (Continued)')

# Feedback sections
feedback_head = extract(r'(\{\/\*\s*FEEDBACK SECTIONS\s*\*\/\}.*?)<div className="feedback-card">', text)
fb_learner = extract(r'(<div className="feedback-card">\s*<h3>Learner\'s Profile by the Teacher.*?<\/div>\s*<\/div>)', text)
fb_parent = extract(r'(<div className="feedback-card">\s*<h3>Parent\'s Feedback.*?<\/div>\s*<\/div>)', text)
fb_self_raw = extract(r'(<div className="feedback-card">\s*<h3>Self-Assessment.*?<\/div>\s*<\/div>)', text)
fb_self = fb_self_raw.replace('<h3>Self-Assessment</h3>', '<h3>Student Feedback (Self-Assessment)</h3>')

sec_signature = extract(r'(\{\/\*\s*SIGNATURE SECTION\s*\*\/\}.*?)(?=\s*<\/div>\s*<\/div>\s*\{\/\*\s*---> PAGE BREAK <--- \*\/\})', text)
sec_evaluations = extract(r'(\{\/\*\s*EVALUATION LEVELS\s*\*\/\}.*?)(?=\s*<\/div>\s*<\/div>\s*<\/div>\s*(?:\{\/\*\s*Local Styles))', text)

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

# Reassemble
def indent(t, spaces=20):
    pad = ' ' * spaces
    lines = t.strip().split('\n')
    return '\n'.join([(pad + l if l.strip() else '') for l in lines]) + '\n'

p1 = indent(sec_gen_info) + indent(sec_scholastic)

p2 = indent(sec_cosch_1) + indent(sec_cosch_2) + indent(pers_head) + indent(pers_social, 32) + indent(pers_emot, 32) + indent("                            </table>\n                        </div>\n                    </div>\n", 0)

p3 = indent(pers_head_2) + indent(pers_work, 32) + indent(pers_health, 32) + \
     indent(feedback_head) + indent(fb_learner, 28) + indent(fb_parent, 28) + indent("                        </div>\n                    </div>\n", 0)

p4 = indent('                    <div className="section" style={{ marginTop: 0 }}>\n                        <div className="feedback-grid">\n' + \
    indent(fb_self, 28) + '                        </div>\n                    </div>\n', 0) + \
    indent(sec_attendance) + indent(sec_signature) + indent(sec_evaluations)

final_str = prefix + '\n' + p1 + page_break + p2 + page_break + p3 + page_break + p4 + \
            '                </div>\n            </div>\n            </div>\n' + suffix

with open('app/components/reports/ReportTemplate_III_VIII.tsx', 'w', encoding='utf-8') as f:
    f.write(final_str)

print("Python rewrite complete.")
