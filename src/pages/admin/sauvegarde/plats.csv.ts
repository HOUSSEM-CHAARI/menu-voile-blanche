import type { APIRoute } from 'astro'
import { exportCsv } from '../../../lib/admin/backup'
import { can } from '../../../lib/auth'

export const GET: APIRoute = async ({ locals }) => {
  if (!can(locals.user, 'backup')) return new Response('Action non autorisée.', { status: 403 })
  const day = new Date().toISOString().slice(0, 10)
  return new Response(await exportCsv(), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="plats-la-voile-blanche-${day}.csv"`,
    },
  })
}
