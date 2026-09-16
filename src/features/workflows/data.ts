import { db } from '@/lib/db'
import { workflows } from '@/lib/db/schema'
import type { Workflow } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'

export async function listWorkflows(orgId: string) {
  return await db.select().from(workflows).where(eq(workflows.orgId, orgId))
}

export async function listWorkflow(id: Workflow['id'], orgId: string) {
  return await db
    .select()
    .from(workflows)
    .where(and(eq(workflows.id, id), eq(workflows.orgId, orgId)))
}

export async function insertWorkflow(name: string, orgId: string) {
  const workflow = await db
    .insert(workflows)
    .values({
      name,
      orgId,
    })
    .returning()

  return workflow
}

export async function deleteWorkflow(id: Workflow['id'], orgId: string) {
  const [workflow] = await db
    .delete(workflows)
    .where(and(eq(workflows.id, id), eq(workflows.orgId, orgId)))
    .returning()

  return workflow.id
}
