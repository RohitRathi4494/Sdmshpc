const fs = require('fs');
const source = fs.readFileSync('app/components/reports/ReportTemplate_III_VIII.tsx', 'utf8');

const prefixIdx = source.indexOf('            {/* ---> PAGE BREAK <--- */}');
if (prefixIdx === -1) throw new Error("Could not find first page break.");

// Page 1 ends just before the first PAGE BREAK comment.
const beforePageBreaks = source.substring(0, prefixIdx);

// The rest of the file contains the page breaks
const restOfFile = source.substring(prefixIdx);

// Let's split by the page break comment.
const pages = restOfFile.split('            {/* ---> PAGE BREAK <--- */}\n');

// pages[0] is empty because the string starts with the delimiter.
// pages[1] is Page 2 (Scholastic + Co-Scholastic part 1)
// pages[2] is Page 3 (Co-Scholastic part 2 + Personality)
// pages[3] is Page 4 (Feedback + Signature)
// pages[4] is Page 5 (Evaluation)

let page1 = beforePageBreaks; // This has the initial `<div className="print-page" ... SchoolHeader ... General Info ... Attendance ... </div></div>\n`

const extractBlock = (text, startMarker, endMarker) => {
    const start = text.indexOf(startMarker);
    const end = endMarker ? text.indexOf(endMarker, start) : text.length;
    if (start === -1) throw new Error("Marker not found: " + startMarker);
    return text.substring(start, end);
};

// 1. Extract from Page 1
const p1_startToGeneralInfo = page1.substring(0, page1.indexOf('{/* ATTENDANCE RECORD */}'));
const p1_attendance = extractBlock(page1, '{/* ATTENDANCE RECORD */}', '                </div>\n            </div>');
const p1_end = page1.substring(page1.indexOf('                </div>\n            </div>'));

// 2. Extract from Page 2
const p2_startToScholastic = pages[1].substring(0, pages[1].indexOf('{/* SCHOLASTIC DOMAINS */}'));
const p2_scholastic = extractBlock(pages[1], '{/* SCHOLASTIC DOMAINS */}', '{/* CO-SCHOLASTIC DOMAINS */}');
const p2_coScholastic1 = extractBlock(pages[1], '{/* CO-SCHOLASTIC DOMAINS */}', '                </div>\n            </div>');
const p2_end = pages[1].substring(pages[1].indexOf('                </div>\n            </div>'));

// 3. Extract from Page 3
const p3_startToCoSchol2 = pages[2].substring(0, pages[2].indexOf('{/* CO-SCHOLASTIC DOMAINS (Continued) */}'));
const p3_coScholastic2 = extractBlock(pages[2], '{/* CO-SCHOLASTIC DOMAINS (Continued) */}', '{/* PERSONALITY DEVELOPMENT SKILLS */}');
const p3_personalityFull = extractBlock(pages[2], '{/* PERSONALITY DEVELOPMENT SKILLS */}', '                </div>\n            </div>');
const p3_end = pages[2].substring(pages[2].indexOf('                </div>\n            </div>'));

// Split Personality into Half 1 and Half 2
// Half 1: Up to end of Emotional Skills
const emotionalEndIdx = p3_personalityFull.indexOf('</tbody>', p3_personalityFull.indexOf('{/* Emotional Skills */}')) + 8; // length of </tbody>
const p3_pers_half1 = p3_personalityFull.substring(0, emotionalEndIdx) + '\n                            </table>\n                        </div>\n                    </div>\n';

// Half 2: from Work Habit onwards, but we need the table header too
const p3_pers_head = p3_personalityFull.substring(0, p3_personalityFull.indexOf('<tbody'));
const p3_pers_head_renamed = p3_pers_head.replace('<SectionHeading>Personality Development Skills</SectionHeading>', '<SectionHeading>Personality Development Skills (Continued)</SectionHeading>');
const p3_pers_body2 = p3_personalityFull.substring(emotionalEndIdx); // contains Activity + Health + closing table divs
const p3_pers_half2 = p3_pers_head_renamed + p3_pers_body2;

// 4. Extract from Page 4
const p4_startToFeedback = pages[3].substring(0, pages[3].indexOf('{/* FEEDBACK SECTIONS */}'));
const p4_feedbackFull = extractBlock(pages[3], '{/* FEEDBACK SECTIONS */}', '{/* SIGNATURE SECTION */}');
const p4_signature = extractBlock(pages[3], '{/* SIGNATURE SECTION */}', '                </div>\n            </div>');
const p4_end = pages[3].substring(pages[3].indexOf('                </div>\n            </div>'));

// Split Feedback into Profile/Parent and Self-Assessment
const selfAssmtStart = p4_feedbackFull.indexOf('{/* Self Assessment */}');
const p4_feedback_half1 = p4_feedbackFull.substring(0, selfAssmtStart) + '\n                        </div>\n                    </div>\n';
const p4_feedback_half2_raw = p4_feedbackFull.substring(selfAssmtStart);
const p4_feedback_half2 = `                    <div className="section" style={{ marginTop: 0 }}>
                        <div className="feedback-grid">
                            ${p4_feedback_half2_raw.replace('<h3>Self-Assessment</h3>', '<h3>Student Feedback (Self-Assessment)</h3>')}
`;

// 5. Extract from Page 5
const p5_evaluations = pages[4]; // The whole of page 5 goes at the end of page 4

// --- RECONSTRUCTION ---

// NEW PAGE 1: General Info + Scholastic
const newPage1 = p1_startToGeneralInfo + p2_scholastic + p1_end;

// NEW PAGE 2: Co-Scholastic 1 + Co-Scholastic 2 + Personality Half 1
const newPage2 = p2_startToScholastic + p2_coScholastic1 + p3_coScholastic2 + p3_pers_half1 + p2_end;

// NEW PAGE 3: Personality Half 2 + Feedback Half 1 (Profile & Parent)
const newPage3 = p3_startToCoSchol2 + p3_pers_half2 + '\n' + p4_feedback_half1 + p3_end;

// NEW PAGE 4: Feedback Half 2 (Self) + Attendance + Signature + Evaluations
// Wait, we need to strip `p4_end` and append evaluations directly.
// Evaluations has the closing `</div></div></div>` at the end of the file implicitly.
// Actually, p5_evaluations already contains the outer wrappers. Let's just append p5_evaluations into Page 4.
let p5_clean = p5_evaluations.replace('                    {/* EVALUATION LEVELS */}', ''); // strip start comment just in case
// Wait, p5 starts with `<div className="print-page ...` which makes it a 5th page. We want it on Page 4.
// Let's extract the inside of p5.
const p5_inside = extractBlock(pages[4], '{/* EVALUATION LEVELS */}', '                </div>\n            </div>');
const p5_end = pages[4].substring(pages[4].indexOf('                </div>\n            </div>'));

const newPage4 = p4_startToFeedback + p4_feedback_half2 + p1_attendance + p4_signature + p5_inside + p5_end;

// Combine all 4 pages!
const finalSource = newPage1 +
    '            {/* ---> PAGE BREAK <--- */}\n' + newPage2 +
    '            {/* ---> PAGE BREAK <--- */}\n' + newPage3 +
    '            {/* ---> PAGE BREAK <--- */}\n' + newPage4; // no page 5!

fs.writeFileSync('app/components/reports/ReportTemplate_III_VIII.tsx', finalSource);
console.log("Successfully rebuilt 4-page layout.");
