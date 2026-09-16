import type { StepNodeType } from '@/features/workflows/nodes/node-registry'
import type { Edge } from '@xyflow/react'
import { pgTable, uuid, text, jsonb, timestamp } from 'drizzle-orm/pg-core'

export type WorkflowGraph = { nodes: StepNodeType[]; edges: Edge[] }

export const workflows = pgTable('workflows', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: text('orgId').notNull(),
  name: text('name').notNull(),
  graph: jsonb('graph').$type<WorkflowGraph>(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export type Workflow = typeof workflows.$inferSelect
