import { createServerFn } from '@tanstack/react-start'
import { listWorkflows, listWorkflow, insertWorkflow } from './data'
import { auth } from '@clerk/tanstack-react-start/server'
import { z } from 'zod'
import type { Workflow } from '@/lib/db/schema'

export const listWorkflowsAction = createServerFn({ strict: false }).handler(
  async () => {
    const { userId, orgId } = await auth()
    if (!userId) throw new Error('unAuthorized')
    if (!orgId) return []
    const workflows = await listWorkflows(orgId)
    return workflows
  },
)

const listWorkflowActionSchema = z.object({
  workflowId: z.custom<Workflow['id']>(),
})

export const listWorkflowAction = createServerFn({ strict: false })
  .validator(listWorkflowActionSchema)
  .handler(async ({ data }) => {
    const { userId, orgId } = await auth()
    if (!userId) throw new Error('unAuthorized')
    if (!orgId) return null
    const [workflow] = await listWorkflow(data.workflowId, orgId)
    return workflow
  })

const insertWorkflowActionSchema = z.object({
  name: z.string(),
})

export const insertWorkflowAction = createServerFn()
  .validator(insertWorkflowActionSchema)
  .handler(async ({ data }) => {
    const { userId, orgId } = await auth()
    if (!userId || !orgId) throw new Error('unAuthorized')
    const [workflow] = await insertWorkflow(data.name, orgId)
    return workflow
  })
