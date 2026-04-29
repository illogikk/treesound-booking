import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/signin?callbackUrl=/admin');
  }

  // @ts-expect-error – role is added via Prisma adapter
  const role = session.user?.role as string | undefined;
  if (!role || !['ADMIN', 'MANAGER', 'STAFF'].includes(role)) {
    redirect('/');
  }

  const [totalBookings, confirmedBookings, pendingBookings, totalRooms] = await Promise.all([
    prisma.booking.count(),
    prisma.booking.count({ where: { status: 'CONFIRMED' } }),
    prisma.booking.count({ where: { status: { in: ['HOLD', 'PENDING'] } } }),
    prisma.room.count({ where: { active: true } }),
  ]);

  const recentBookings = await prisma.booking.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: { user: true, room: true },
  });

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
          <span className="rounded-full border border-neutral-700 px-3 py-1 text-sm text-neutral-400">
            {role}
          </span>
        </div>

        {/* Stats */}
        <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Total Bookings', value: totalBookings },
            { label: 'Confirmed', value: confirmedBookings },
            { label: 'Pending / Holds', value: pendingBookings },
            { label: 'Active Rooms', value: totalRooms },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-neutral-800 bg-neutral-900 p-5"
            >
              <p className="mb-1 text-sm text-neutral-500">{stat.label}</p>
              <p className="text-3xl font-bold text-white">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Recent bookings */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">Recent Bookings</h2>
          {recentBookings.length === 0 ? (
            <p className="text-sm text-neutral-500">No bookings yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-800 text-left text-neutral-500">
                    <th className="pr-4 pb-2 font-medium">ID</th>
                    <th className="pr-4 pb-2 font-medium">Room</th>
                    <th className="pr-4 pb-2 font-medium">User</th>
                    <th className="pr-4 pb-2 font-medium">Start</th>
                    <th className="pr-4 pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  {recentBookings.map((b) => (
                    <tr key={b.id} className="text-neutral-300">
                      <td className="py-2 pr-4 font-mono text-xs text-neutral-500">
                        {b.id.slice(0, 8)}…
                      </td>
                      <td className="py-2 pr-4">{b.room.name}</td>
                      <td className="py-2 pr-4">{b.user.email}</td>
                      <td className="py-2 pr-4">
                        {b.start.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}{' '}
                        {b.start.toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-2 pr-4">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            b.status === 'CONFIRMED'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : b.status === 'CANCELLED' || b.status === 'REFUNDED'
                                ? 'bg-red-500/20 text-red-400'
                                : 'bg-yellow-500/20 text-yellow-400'
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="py-2">${(b.totalCents / 100).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
