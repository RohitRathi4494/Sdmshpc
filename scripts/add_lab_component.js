const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://neondb_owner:npg_cDigIX2KlzW7@ep-odd-tree-aiom0qmv-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require' });

pool.query("INSERT INTO assessment_components (component_name) VALUES ('Lab Assessment') RETURNING *")
    .then(r => console.log('Added Lab Assessment with id:', r.rows[0].id))
    .catch(e => console.error('Error:', e.message))
    .finally(() => pool.end());
