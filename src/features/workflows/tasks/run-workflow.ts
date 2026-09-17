/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import toposort from 'toposort'
import { logger, task } from '@trigger.dev/sdk'
import { listWorkflow } from '../data'
import { nodeExecutors } from '../nodes/node-executor'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { interpolate, type NodeOutputs } from '../lib/interpolate'

function ensureStagehandExtensionPath() {
  if (process.env.STAGEHAND_EXTENSION_ARCHIVE_PATH) return
  for (const candidate of [
    join(
      process.cwd(),
      'node_modules/@browserbasehq/stagehand/dist/assets/stagehand-extension.zip',
    ),
    join(
      dirname(fileURLToPath(import.meta.url)),
      '../../../../node_modules/@browserbasehq/stagehand/dist/assets/stagehand-extension.zip',
    ),
    join(
      dirname(fileURLToPath(import.meta.url)),
      '../../../node_modules/@browserbasehq/stagehand/dist/assets/stagehand-extension.zip',
    ),
  ]) {
    if (existsSync(candidate)) {
      process.env.STAGEHAND_EXTENSION_ARCHIVE_PATH = candidate
      break
    }
  }
}

export const runWorkflowTask = task({
  id: 'run-workflow',
  run: async ({ workflowId, orgId }: { workflowId: string; orgId: string }) => {
    const [workflow] = await listWorkflow(workflowId, orgId)
    if (!workflow.graph) throw new Error('Workflow Graph not found')
    const { nodes, edges } = workflow.graph

    const byId = new Map(nodes.map((n) => [n.id, n]))

    const connected = new Set(edges.flatMap((e) => [e.source, e.target]))

    const order = toposort
      .array(
        nodes.map((n) => n.id),
        edges.map((e) => [e.source, e.target]),
      )
      .filter((id: string) => connected.has(id))

    logger.log(`${workflow.name} running, ${order.length}`)

    // Stagehand/Browser handles — `any` to dodge strict `never` overload on `browserbase.launch` in this kit version
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let stagehand: any = null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let browser: any = null

    const getStagehand = async () => {
      if (stagehand) return stagehand
      const bbKey = process.env.BROWSERBASE_API_KEY
      const gemKey = process.env.GEMINI_API_KEY
      if (!bbKey)
        throw new Error(
          'BROWSERBASE_API_KEY is not set — add it to .env and Trigger.dev dashboard env',
        )
      if (!gemKey)
        throw new Error(
          'GEMINI_API_KEY is not set — add it to .env and Trigger.dev dashboard env',
        )

      ensureStagehandExtensionPath()
      const { browserbase, Stagehand } =
        await import('@browserbasehq/stagehand')

      try {
        browser = await browserbase.launch({ apiKey: bbKey })
      } catch (err) {
        logger.error('Browserbase launch failed', {
          error: err instanceof Error ? err.message : String(err),
          cause: (err as Error)?.cause,
        })
        throw err
      }

      try {
        stagehand = await Stagehand.create({
          browser,
          model: { modelName: 'google/gemini-2.5-flash', apiKey: gemKey },
        })
      } catch (err) {
        // Surface the *cause* — Stagehand wraps extension upload errors opaquely
        logger.error('Stagehand.create failed', {
          error: err instanceof Error ? err.message : String(err),
          cause:
            err instanceof Error
              ? (err as unknown as { cause?: unknown }).cause
              : undefined,
          extensionPath: process.env.STAGEHAND_EXTENSION_ARCHIVE_PATH,
        })
        throw new Error(
          `Stagehand init failed: ${err instanceof Error ? err.message : String(err)} — check BROWSERBASE_API_KEY, GEMINI_API_KEY, and that stagehand-extension.zip is bundled (see STAGEHAND_EXTENSION_ARCHIVE_PATH)`,
          { cause: err },
        )
      }

      return stagehand
    }

    const outputs: NodeOutputs = {}

    try {
      for (const id of order) {
        const node = byId.get(id)
        if (!node) continue
        logger.log(`Running step ${node.data.title}`)

        const executor = nodeExecutors[node.data.type]
        if (!executor) continue
        const values = Object.fromEntries(
          Object.entries(node.data.values).map(([key, text]) => [
            key,
            interpolate({ text, outputs }),
          ]),
        )
        outputs[id] = await executor({ values, getStagehand })
      }

      return { steps: order.length }
    } finally {
      // Stagehand owns the Browserbase session via `browser` — closing stagehand
      // tears down the context/pages and releases the remote session. `browser`
      // is kept as fallback if stagehand never initialized.
      if (stagehand) {
        try {
          await stagehand.close()
        } catch (err) {
          logger.error('Failed to close Stagehand', {
            error: err instanceof Error ? err.message : String(err),
          })
        }
      } else if (browser) {
        try {
          await browser.close()
        } catch {}
      }
    }
  },
})
