import Link from 'next/link';
import { db } from '@/app/lib/db';

async function getStats() {
    try {
        // We can fetch fee stats here later
        const studentsCount = await db.query('SELECT COUNT(*) FROM students');
        // Example: Total Fees Collected Today
        const todayCollection = await db.query("SELECT SUM(amount_paid) FROM fee_payments WHERE date(payment_date) = CURRENT_DATE");

        return {
            students: studentsCount.rows[0].count,
            todayCollection: todayCollection.rows[0].sum || 0
        };
    } catch (e) {
        return { students: '--', todayCollection: '--' };
    }
}

export default async function OfficeDashboard() {
    const stats = await getStats();

    const cards = [
        { title: 'Student Management', href: '/office/students', icon: '👨‍🎓', desc: 'Manage student records and admissions', color: 'bg-blue-500' },
        { title: 'Fee Management', href: '/office/fees', icon: '💰', desc: 'Collect fees and manage structures', color: 'bg-green-500' },
        { title: 'Daily Reports', href: '/office/fees/reports/daily', icon: '📄', desc: 'View daily collection summaries', color: 'bg-purple-500' },
    ];

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Office Dashboard</h1>
                <p className="text-gray-600 mt-2">Manage student data and fee collections.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {cards.map((card) => (
                    <Link key={card.href} href={card.href} className="block group">
                        <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-100 h-full">
                            <div className={`w-12 h-12 ${card.color} rounded-lg flex items-center justify-center text-white text-2xl mb-4 group-hover:scale-110 transition-transform`}>
                                {card.icon}
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">{card.title}</h3>
                            <p className="text-sm text-gray-500">{card.desc}</p>
                        </div>
                    </Link>
                ))}
            </div>

            <div className="mt-8 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <span className="block text-3xl font-bold text-indigo-600">{stats.students}</span>
                        <span className="text-sm text-gray-500">Total Students</span>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <span className="block text-3xl font-bold text-green-600">₹{stats.todayCollection}</span>
                        <span className="text-sm text-gray-500">Today's Collection</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
