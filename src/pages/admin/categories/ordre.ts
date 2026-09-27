import type { APIRoute } from 'astro'
import { z } from 'zod'
import { listCategories, reorderCategories } from '../../../lib/admin/data'
import { json } from '../../../lib/admin/http'
import { can } from '../../../lib/auth'

const body = z.object({ ids: z.array(z.number().int().positive()).max(200) })

export const POST: APIRoute = async ({ request, locals }) => {
  if (!locals.user || !can(locals.user, 'menu:write'))
    return json(false, 'Action non autorisée.', {}, 403)
  const parsed = body.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return json(false, 'Données invalides.')
  const current = (await listCategories()).map((c) => c.id)
  const ids = parsed.data.ids
  if (ids.length !== current.length || current.some((id) => !ids.includes(id))) {
    return json(false, 'La liste a changé entre-temps : rechargez la page.')
  }
  await reorderCategories(ids, locals.user)
  return json(true, 'Ordre enregistré')
}
