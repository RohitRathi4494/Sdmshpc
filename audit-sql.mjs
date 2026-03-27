import fs from 'fs';
import path from 'path';

const TARGET_TABLES = [
    'sections', 'classes', 'subjects', 'class_subjects', 'academic_years', 
    'student_enrollments', 'scholastic_scores', 'attendance_records', 'remarks', 
    'foundational_text_fields', 'users', 'foundational_skill_ratings', 'students', 
    'co_scholastic_scores', 'student_subjects', 'assessment_locks', 'assessment_locks_audit'
];

function isUnsafeQuery(queryStr) {
    const qLower = queryStr.toLowerCase();
    
    // Check if it targets any isolated table
    const targetsTable = TARGET_TABLES.some(t => {
        // Look for basic SQL operations containing the table name
        const regex = new RegExp(`(?:from|join|update|insert into|delete from)\\s+${t}\\b`, 'i');
        return regex.test(qLower);
    });

    if (!targetsTable) return false; // Safe: Doesn't touch user data tables

    // Check if it's missing tenant_id filtering
    // It should have either 'tenant_id' in the string OR be dynamically building the WHERE clause
    if (qLower.includes('tenant_id') || qLower.includes('tenantclause') || qLower.includes('tenantforinsertion')) {
        return false; // Safe: Has tenant filtering mapped
    }

    return true; // Unsafe!
}

function scanDirectory(dir, results) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            scanDirectory(fullPath, results);
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.js')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            
            // Simple regex to catch db.query(`...`) or client.query(`...`) or db.query('...')
            // We look at chunks of text around db.query and client.query
            const lines = content.split('\n');
            let insideQueryBlock = false;
            let currentQuery = [];
            let startLine = 0;

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                
                // If we see db.query or client.query and it has backticks or quotes
                if ((line.includes('db.query') || line.includes('client.query') || line.includes('query = ') || line.includes('query(')) && (line.includes('`') || line.includes("'") || line.includes('"'))) {
                    // Just grab a 10 line window to check context
                    const windowStart = Math.max(0, i - 15);
                    const windowEnd = Math.min(lines.length - 1, i + 15);
                    const queryContext = lines.slice(windowStart, windowEnd).join('\n');
                    
                    if (isUnsafeQuery(queryContext)) {
                        results.push({ file: fullPath, line: i + 1, snippet: line.trim() });
                    }
                }
            }
        }
    }
}

const results = [];
scanDirectory(path.join(process.cwd(), 'app/api'), results);
scanDirectory(path.join(process.cwd(), 'app/lib'), results);

// Deduplicate results by file and approx line block
const unique = [];
const seen = new Set();
for (const r of results) {
    const key = r.file + ':' + Math.floor(r.line / 10);
    if (!seen.has(key)) {
        seen.add(key);
        unique.push(r);
    }
}

console.log(`Found ${unique.length} potentially unsafe queries:`);
for (const r of unique) {
    console.log(`- ${r.file}:${r.line} -> ${r.snippet}`);
}
