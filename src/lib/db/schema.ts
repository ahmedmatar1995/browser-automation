import { pgTable, uuid, text, jsonb, timestamp } from 'drizzle-orm/pg-core'

type WorkflowGraph = { nodes: []; edges: [] }

export const workflows = pgTable('workflows', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: text('orgId').notNull(),
  name: text('name').notNull(),
  graph: jsonb('graph').$type<WorkflowGraph>(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export type Workflow = typeof workflows.$inferSelect
