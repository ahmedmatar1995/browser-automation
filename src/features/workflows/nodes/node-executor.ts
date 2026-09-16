import type { Stagehand } from '@browserbasehq/stagehand'
import type { ActionNodeType, NodeType } from './node-registry'
import { openUrl } from './open-url'

export type NodeContext = {
  values: Record<string, string>
  getStagehand: () => Promise<Stagehand>
}

export type NodeExecutor = (ctx: NodeContext) => Promise<unknown>

export const nodeExecutors: Partial<Record<NodeType, NodeExecutor>> = {
  'open-url': async ({ values, getStagehand }: NodeContext) =>
    openUrl({ url: values.url, stagehand: await getStagehand() }),
} satisfies Record<ActionNodeType, NodeExecutor>

// Back-compat alias — some older code imports `nodeExecutor` singular
export const nodeExecutor = nodeExecutors
