import { createServerFn } from '@tanstack/react-start'
import {
  listWorkflows,
  listWorkflow,
  insertWorkflow,
  deleteWorkflow,
  saveWorkflowGraph,
} from './data'
import { auth } from '@clerk/tanstack-react-start/server'
import { z } from 'zod'
import type { Workflow, WorkflowGraph } from '@/lib/db/schema'
import { tasks } from '@trigger.dev/sdk'
import { checkOrg, checkUser } from '@/lib/check-auth'
import type { runWorkflowTask } from './tasks/run-workflow'

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

export const insertWorkflowAction = createServerFn({ strict: false })
  .validator(insertWorkflowActionSchema)
  .handler(async ({ data }) => {
    const { userId, orgId } = await auth()
    if (!userId || !orgId) throw new Error('unAuthorized')
    const [workflow] = await insertWorkflow(data.name, orgId)
    return workflow
  })

const deleteWorkflowSchema = z.object({
  id: z.string(),
})

export const deleteWorkflowAction = createServerFn()
  .validator(deleteWorkflowSchema)
  .handler(async ({ data }) => {
    const { userId, orgId } = await auth()
    if (!userId || !orgId) throw new Error('missing userId or orgId')
    const workflowId = await deleteWorkflow(data.id, orgId)
    return workflowId
  })

const runWorkflowSchema = z.object({
  id: z.custom<Workflow['id']>(),
  graph: z.custom<WorkflowGraph>(),
})

export const runWorkflowAction = createServerFn()
  .validator(runWorkflowSchema)
  .handler(async ({ data }) => {
    await checkUser()
    const { orgId } = await checkOrg()

    await saveWorkflowGraph(data.id, orgId, data.graph)

    const handle = await tasks.trigger<typeof runWorkflowTask>('run-workflow', {
      workflowId: data.id,
      orgId,
    })

    return handle
  })
