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
import { auth as triggerAuth } from '@trigger.dev/sdk'
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

    const handle = await tasks.trigger<typeof runWorkflowTask>(
      'run-workflow',
      {
        workflowId: data.id,
        orgId,
      },
      {
        tags: [`workflow:${data.id}`],
      },
    )

    // Return only the run id — the raw Trigger handle isn't serializable
    // (it carries the task's output type with `unknown` fields) and the
    // client only needs the id for toasts and realtime hooks.
    return { id: handle.id }
  })

const runsTokenSchema = z.object({
  workflowId: z.custom<Workflow['id']>(),
})

// Server-only: mints a short-lived public token scoped to read this
// workflow's runs. Must stay in a server fn — @trigger.dev/sdk uses
// AsyncLocalStorage and crashes the browser bundle if imported client-side.
export const getWorkflowRunsTokenAction = createServerFn({ strict: false })
  .validator(runsTokenSchema)
  .handler(async ({ data }) => {
    await checkUser()
    await checkOrg()
    return await triggerAuth.createPublicToken({
      scopes: {
        read: {
          tags: [`workflow:${data.workflowId}`],
        },
      },
      expirationTime: '1hr',
    })
  })
