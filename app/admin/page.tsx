import Link from 'next/link';
import { getActiveAcademicYear } from '../lib/actions';
import { db } from '@/app/lib/db';

export const dynamic = 'force-dynamic';

async function getDashboardStats() {
    try {
        const studentRes = await db.query('SELECT COUNT(*) FROM students');
        const classRes = await db.query('SELECT COUNT(*) FROM classes');

        return {
            totalStudents: studentRes.rows[0].count,
            trainClasses: classRes.rows[0].count
        };
    } catch (e) {
        console.error("Stats error", e);
        return { totalStudents: '--', trainClasses: '--' };
    }
}

export default async function AdminDashboard() {
    const academicYear = await getActiveAcademicYear();
    const stats = await getDashboardStats();

    const cards = [
        { title: 'Academic Years', href: '/admin/academic-years', icon: '📅', desc: 'Manage sessions and activate current year', color: 'bg-blue-500' },
        { title: 'Classes & Sections', href: '/admin/classes', icon: '🏫', desc: 'Configure class structure and sections', color: 'bg-green-500' },
        { title: 'Subject Mapping', href: '/admin/subjects', icon: '📚', desc: 'Assign subjects to classes for report cards', color: 'bg-purple-500' },
        { title: 'Manage Teachers', href: '/admin/teachers', icon: '👨‍🏫', desc: 'Create teacher accounts and manage access', color: 'bg-teal-500' },
        { title: 'Student Management', href: '/admin/students', icon: '👨‍🎓', desc: 'Import students and manage enrollments', color: 'bg-orange-500' },
        { title: 'Communication', href: '/admin/communication', icon: '📢', desc: 'Send notices and circulars', color: 'bg-indigo-500' },
    ];

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Welcome, Administrator</h1>
                <p className="text-gray-600 mt-2">Manage your institution's master data and configurations.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

            <div className="mt-12 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <span className="block text-3xl font-bold text-indigo-600">{stats.totalStudents}</span>
                        <span className="text-sm text-gray-500">Total Students</span>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <span className="block text-3xl font-bold text-indigo-600">{stats.trainClasses}</span>
                        <span className="text-sm text-gray-500">Active Classes</span>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <span className="block text-3xl font-bold text-indigo-600">{academicYear}</span>
                        <span className="text-sm text-gray-500">Current Session</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
