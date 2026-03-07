const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_cDigIX2KlzW7@ep-odd-tree-aiom0qmv-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require' });

pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'attendance_records'").then(res => {
    console.log('Cols:', res.rows);
    process.exit(0);
}).catch(console.error);
