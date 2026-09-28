import type { APIRoute } from 'astro'
import { exportMenu } from '../../../lib/admin/backup'
import { can } from '../../../lib/auth'

export const GET: APIRoute = async ({ locals }) => {
  if (!can(locals.user, 'backup')) return new Response('Action non autorisée.', { status: 403 })
  const day = new Date().toISOString().slice(0, 10)
  return new Response(JSON.stringify(await exportMenu(), null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="menu-la-voile-blanche-${day}.json"`,
    },
  })
}
