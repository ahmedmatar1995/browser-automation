import type { Stagehand } from '@browserbasehq/stagehand'
import type { ActionNodeType, NodeType } from './node-registry'
import { openUrl } from './open-url'
import { act } from './act'
import { agent } from './agents'
import { extract } from './extract'
import { observe } from './observe'
import { sendMail } from './send-mail'

export type NodeContext = {
  values: Record<string, string>
  getStagehand: () => Promise<Stagehand>
}

export type NodeExecutor = (ctx: NodeContext) => Promise<unknown>

export const nodeExecutors: Partial<Record<NodeType, NodeExecutor>> = {
  'open-url': async ({ values, getStagehand }: NodeContext) =>
    openUrl({ url: values.url, stagehand: await getStagehand() }),
  act: async ({ values, getStagehand }: NodeContext) =>
    act({ stagehand: await getStagehand(), instructions: values.instructions }),
  extract: async ({ values, getStagehand }: NodeContext) =>
    extract({
      stagehand: await getStagehand(),
      instructions: values.instructions,
    }),
  observe: async ({ values, getStagehand }: NodeContext) =>
    observe({
      stagehand: await getStagehand(),
      instructions: values.instructions,
    }),
  agent: async ({ values, getStagehand }: NodeContext) =>
    agent({
      stagehand: await getStagehand(),
      instructions: values.instructions,
    }),
  sendMail: async ({ values }: NodeContext) =>
    sendMail({
      to: values.to,
      subject: values.subject,
      body: values.body,
    }),
} satisfies Record<ActionNodeType, NodeExecutor>

// Back-compat alias — some older code imports `nodeExecutor` singular
export const nodeExecutor = nodeExecutors
