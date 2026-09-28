import type { APIRoute } from 'astro'
import { z } from 'zod'
import { ActionError, reorderDishes } from '../../../lib/admin/data'
import { json } from '../../../lib/admin/http'
import { can } from '../../../lib/auth'

const body = z.object({
  groupId: z.number().int().positive(),
  ids: z.array(z.number().int().positive()).max(500),
})

/** Saves the order after a drag-and-drop in the dish list. */
export const POST: APIRoute = async ({ request, locals }) => {
  if (!can(locals.user, 'menu:write') || !locals.user)
    return json(false, 'Action non autorisée.', {}, 403)
  const parsed = body.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return json(false, 'Données invalides.')
  try {
    await reorderDishes(parsed.data.groupId, parsed.data.ids, locals.user)
    return json(true, 'Ordre enregistré')
  } catch (error) {
    return json(false, error instanceof ActionError ? error.message : 'Une erreur est survenue.')
  }
}
