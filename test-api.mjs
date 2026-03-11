import { SignJWT } from 'jose';

async function checkApi() {
    try {
        const secret = new TextEncoder().encode('secure-hpc-secret-key-2024');
        const token = await new SignJWT({ user_id: 1, role: 'ADMIN' })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('1h')
            .sign(secret);

        const url = 'http://localhost:3000/api/admin/analytics/subject-performance?academic_year_id=1&class_id=1&section_id=1';
        console.log("Fetching URL:", url);

        const res = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await res.json();
        console.log("Status:", res.status);
        console.log("Response:", data);
    } catch (e) {
        console.error(e);
    }
}

checkApi();
