with open('app/components/reports/ReportTemplate_III_VIII.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Based on exact view_file output:
# p1 header + gen info: lines 0 to 147
p1_start = lines[0:148]

# Attendance: 148 to 195 (inclusive of blank line)
attendance = lines[148:196]

# p1 end + p2 break + goldbar: 196 to 208
p1_end_p2_start = lines[196:208]

# Scholastic: 208 to 332 (from {/* SCHOLASTIC to just before {/* CO-SCHOLASTIC)
scholastic = lines[208:332]

# Co-Scholastic part 1: 332 to 379
co_scholastic_1 = lines[332:380]

# p2 end + p3 break + goldbar: 380 to 389
p2_end_p3_start = lines[380:389]

# Co-Scholastic part 2: 389 to 428
co_scholastic_2 = lines[389:428]

# Personality Header + Social + Emotional: 428 to 469
pers_part1 = lines[428:469]
# Close the table for half 1
pers_close = ["                            </table>\n", "                        </div>\n", "                    </div>\n"]

# Work + Health: 469 to 495
pers_part2 = lines[469:496]

# p3 end + p4 break + goldbar: 496 to 511
p3_end_p4_start = lines[496:511]

# Feedback Header + Learner + Parent: 511 to 531
feedback_part1 = lines[511:531]
# Close the grid
feedback_close = ["                        </div>\n", "                    </div>\n"]

# Self Assessment: 531 to 544
feedback_part2 = lines[531:545]
feedback_part2_mod = [line.replace('<h3>Self-Assessment</h3>', '<h3>Student Feedback (Self-Assessment)</h3>') for line in feedback_part2]
feedback_part2_open = ['                    <div className="section" style={{ marginTop: 0 }}>\n', '                        <div className="feedback-grid">\n']

# Signature: 546 to 568
signature = lines[546:569]

# p4 end + p5 break + goldbar: 569 to 579
p4_end_p5_start = lines[569:579]

# Evaluations + end file: 579 to end
evaluations = lines[579:]

# Reassemble to 4 pages!
# Page 1: p1_start + scholastic + page-end
new_file = p1_start + scholastic

# Page 2: p1_end_p2_start (contains page break & header) + co_scholastic_1 + co_scholastic_2 + pers_part1 + pers_close
new_file += p1_end_p2_start + co_scholastic_1 + co_scholastic_2 + pers_part1 + pers_close

# Page 3: p2_end_p3_start + pers header (modified to say (Continued)) + pers_part2 + feedback_part1 + feedback_close
pers_header_mod = lines[428:444]
pers_header_mod[2] = pers_header_mod[2].replace('Personality Development Skills', 'Personality Development Skills (Continued)')
new_file += p2_end_p3_start + pers_header_mod + pers_part2 + pers_close + feedback_part1 + feedback_close

# Page 4: p3_end_p4_start + feedback_part2_open + feedback_part2_mod + feedback_close + attendance + signature + evaluations (removing the p5 page break wrapper!)
# p5 break wrapper is `p4_end_p5_start` which is lines 569-579
# wait, if evaluation just needs to jump to page 4, we omit the page 5 break entirely!
new_file += p3_end_p4_start + feedback_part2_open + feedback_part2_mod + feedback_close + attendance + signature + evaluations

with open('app/components/reports/ReportTemplate_III_VIII.tsx', 'w', encoding='utf-8') as f:
    f.writelines(new_file)

print("Line-based rewrite complete.")
