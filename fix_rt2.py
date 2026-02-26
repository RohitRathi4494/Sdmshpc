import sys
import re

def main():
    file_path = 'app/components/reports/ReportTemplate_III_VIII.tsx'
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Part 1: Co-Scholastic Merge
    co_scholastic_pattern = re.compile(
        r'([ \t]*\{\/\* PHYSICAL EDUCATION \(Split from Co-Scholastic\) \*\/}.*?)\{\/\* PERSONALITY DEVELOPMENT SKILLS \*\/}',
        re.DOTALL
    )

    merged_co_scholastic = """                    {/* CO-SCHOLASTIC DOMAINS */}
                    <div className="section" style={{ marginTop: 16 }}>
                        <SectionHeading>Co-Scholastic Domains</SectionHeading>
                        <div style={{ borderRadius: '4px', border: `1px solid ${C.navy}`, overflow: 'hidden' }}>
                            <table className="foundational-table">
                                <thead>
                                    <tr>
                                        <th rowSpan={2} style={{ textAlign: 'left', width: '50%' }}>Sub-Skills</th>
                                        <th colSpan={2}>Grades</th>
                                    </tr>
                                    <tr>
                                        <th style={{ width: '25%' }}>Term I</th>
                                        <th style={{ width: '25%' }}>Term II</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {/* Physical Education */}
                                    <tr className="domain-header">
                                        <td colSpan={3} className="text-left" style={{ textAlign: 'center' }}>Physical Education</td>
                                    </tr>
                                    {['Physical Fitness', 'Muscular Strength', 'Agility & Balance', 'Stamina'].map(skill => (
                                        <tr key={skill}>
                                            <td className="text-left" style={{ paddingLeft: '15px' }}>{skill}</td>
                                            <td>{getCoScholastic(skill, 'Term I')?.grade || ''}</td>
                                            <td>{getCoScholastic(skill, 'Term II')?.grade || ''}</td>
                                        </tr>
                                    ))}

                                    {/* Visual Art */}
                                    <tr className="domain-header">
                                        <td colSpan={3} className="text-left" style={{ textAlign: 'center' }}>Visual Art</td>
                                    </tr>
                                    {['Creative Expression', 'Fine Motor Skills', 'Reflecting, Responding and Analyzing', 'Use of Technique'].map(skill => (
                                        <tr key={skill}>
                                            <td className="text-left" style={{ paddingLeft: '15px' }}>{skill}</td>
                                            <td>{getCoScholastic(skill, 'Term I')?.grade || ''}</td>
                                            <td>{getCoScholastic(skill, 'Term II')?.grade || ''}</td>
                                        </tr>
                                    ))}

                                    {/* Performing Art - Dance */}
                                    <tr className="domain-header">
                                        <td colSpan={3} className="text-left" style={{ textAlign: 'center' }}>Performing Art - Dance</td>
                                    </tr>
                                    {['Posture', 'Expression', 'Rhythm', 'Overall Performance'].map(skill => (
                                        <tr key={skill}>
                                            <td className="text-left" style={{ paddingLeft: '15px' }}>{skill}</td>
                                            <td>{getCoScholastic(skill, 'Term I')?.grade || ''}</td>
                                            <td>{getCoScholastic(skill, 'Term II')?.grade || ''}</td>
                                        </tr>
                                    ))}

                                    {/* Performing Art - Music */}
                                    <tr className="domain-header">
                                        <td colSpan={3} className="text-left" style={{ textAlign: 'center' }}>Performing Art - Music</td>
                                    </tr>
                                    {['Rhythm', 'Pitch', 'Melody (Sings in Tune)', 'Overall Performance'].map(skill => (
                                        <tr key={skill}>
                                            <td className="text-left" style={{ paddingLeft: '15px' }}>{skill}</td>
                                            <td>{getCoScholastic(skill, 'Term I')?.grade || ''}</td>
                                            <td>{getCoScholastic(skill, 'Term II')?.grade || ''}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                {/* PERSONALITY DEVELOPMENT SKILLS */}"""

    if not co_scholastic_pattern.search(content):
        print("Co-Scholastic pattern not found!")
        sys.exit(1)

    content = co_scholastic_pattern.sub(merged_co_scholastic, content)

    # Part 2: Personality Development Header
    personality_header_pattern = re.compile(
        r'\{\/\* PERSONALITY DEVELOPMENT SKILLS \*\/\}(.*?<table className="foundational-table">[\s\n]*)<thead>(.*?)<\/thead>',
        re.DOTALL
    )

    merged_personality_header = r"""{/* PERSONALITY DEVELOPMENT SKILLS */}\g<1><thead>
                                <tr>
                                    <th rowSpan={2} style={{ textAlign: 'left', width: '50%' }}>Sub-Skills</th>
                                    <th colSpan={2}>Grades</th>
                                </tr>
                                <tr>
                                    <th style={{ width: '25%' }}>Term I</th>
                                    <th style={{ width: '25%' }}>Term II</th>
                                </tr>
                            </thead>"""

    if not personality_header_pattern.search(content):
        print("Personality header pattern not found!")
        sys.exit(1)

    content = personality_header_pattern.sub(merged_personality_header, content)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Code successfully replaced!")

if __name__ == '__main__':
    main()
