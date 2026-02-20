const { Pool } = require('pg');

const connectionString = process.argv[2];

if (!connectionString) {
    console.error('❌ Please provide the DATABASE_URL as an argument.');
    console.error('Usage: node scripts/check-schema-columns.js "postgres://user:pass@host/db"');
    process.exit(1);
}

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function checkSchema() {
    console.log('🔍 Connecting to database...');
    try {
        const res = await pool.query(`
            SELECT column_name, data_type, column_default
            FROM information_schema.columns 
            WHERE table_name = 'class_subjects'
            ORDER BY ordinal_position;
        `);

        console.log('\n📊 Columns in "class_subjects" table:');
        console.table(res.rows);

        const hasDisplayOrder = res.rows.some(r => r.column_name === 'display_order');

        if (hasDisplayOrder) {
            console.log('\n✅ "display_order" column EXISTS.');
        } else {
            console.log('\n❌ "display_order" column is MISSING.');
        }

    } catch (err) {
        console.error('❌ Error querying database:', err.message);
    } finally {
        await pool.end();
    }
}

checkSchema();
