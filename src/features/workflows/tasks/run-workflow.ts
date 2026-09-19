/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import toposort from 'toposort'
import { logger, task, metadata } from '@trigger.dev/sdk'
import { listWorkflow } from '../data'
import { nodeExecutors } from '../nodes/node-executor'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { interpolate, type NodeOutputs } from '../lib/interpolate'
import type { NodeType } from '../nodes/node-registry'
import type { DeserializedJson } from '@trigger.dev/core'

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

export type RunStep = {
  nodeId: string
  status: 'pending' | 'running' | 'done' | 'failed'
  type?: NodeType
  title?: string
  durationMs?: number
  output?: unknown
  error?: string
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

    const steps: RunStep[] = order.map((id) => {
      const node = byId.get(id)
      return {
        nodeId: id,
        status: 'pending',
        type: node?.data.type,
        title: node?.data.title,
      }
    })

    const publishSteps = () =>
      metadata.set('steps', steps as unknown as DeserializedJson[])
    publishSteps()

    // Stagehand/Browser handles — `any` to dodge strict `never` overload on `browserbase.launch` in this kit version
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let stagehand: any = null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let browser: any = null

    let browserbaseSessionId: string | undefined = undefined

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

      // Stagehand swallows the real session-creation error behind a generic
      // "Failed to create a Browserbase session", so validate the key first
      // with a cheap API call — auth/quota problems then surface with their
      // real status and message instead of a mystery failure at launch.
      const { Browserbase } = await import('@browserbasehq/sdk')
      try {
        await new Browserbase({ apiKey: bbKey }).projects.list()
      } catch (err) {
        const status =
          err instanceof Error
            ? (err as unknown as { status?: unknown }).status
            : undefined
        logger.error('Browserbase API key check failed', {
          error: err instanceof Error ? err.message : String(err),
          status,
        })
        throw new Error(
          `Browserbase rejected the API key (status ${String(status ?? 'unknown')}: ${err instanceof Error ? err.message : String(err)}). Check BROWSERBASE_API_KEY in the Trigger.dev dashboard env, plus plan/quota on the Browserbase dashboard.`,
          { cause: err },
        )
      }

      // BROWSERBASE_PROJECT_ID is optional — only needed when the key has
      // no default project to create sessions under.
      const projectId = process.env.BROWSERBASE_PROJECT_ID?.trim() || undefined

      try {
        browser = await browserbase.launch({
          apiKey: bbKey,
          ...(projectId ? { projectId } : {}),
        })
      } catch (err) {
        // Stagehand throws without the real API error, so probe a raw
        // session creation with identical params to capture the true
        // status/message. A probe session that succeeds is released
        // immediately to avoid quota leaks or charges.
        let probeStatus: unknown = 'not attempted'
        let probeMessage = ''
        try {
          const probeClient = new Browserbase({ apiKey: bbKey })
          const probeSession = await probeClient.sessions.create({
            ...(projectId ? { projectId } : {}),
          })
          probeMessage = `probe unexpectedly succeeded (id ${probeSession.id})`
          await probeClient.sessions
            .update(probeSession.id, { status: 'REQUEST_RELEASE' })
            .catch(() => undefined)
        } catch (probeErr) {
          probeStatus =
            probeErr instanceof Error
              ? (probeErr as unknown as { status?: unknown }).status
              : undefined
          probeMessage =
            probeErr instanceof Error ? probeErr.message : String(probeErr)
        }
        logger.error('Browserbase launch failed', {
          error: err instanceof Error ? err.message : String(err),
          cause: (err as Error)?.cause,
          projectId: projectId ?? '(default)',
          probeStatus,
          probeMessage,
        })
        throw new Error(
          `Browserbase session creation failed (API says: status ${String(probeStatus)} — ${probeMessage}). Most likely the key has no default project: set BROWSERBASE_PROJECT_ID (Browserbase Settings) in .env and the Trigger.dev dashboard env. Otherwise check plan/quota and concurrent-session limits.`,
          { cause: err },
        )
      }

      // Every run gets a fresh Browserbase session. Log its ID so the
      // session viewer link for *this* run is easy to find — old links
      // point at old sessions and never update.
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      browserbaseSessionId = browser?.sessionId
      if (browserbaseSessionId) {
        logger.log(`Browserbase session: ${browserbaseSessionId}`)
        metadata.set('browserSessionId', browserbaseSessionId)
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
      for (let i = 0; i < order.length; i++) {
        const id = order[i]
        const step = steps[i]
        const node = byId.get(id)
        if (!node) {
          if (step) {
            step.status = 'done'
            publishSteps()
          }
          continue
        }
        logger.log(`Running step ${node.data.title}`)

        const executor = nodeExecutors[node.data.type]
        if (!executor) {
          step.status = 'done'
          publishSteps()

          continue
        }
        step.status = 'running'
        publishSteps()
        await metadata.flush()
        const values = Object.fromEntries(
          Object.entries(node.data.values).map(([key, text]) => [
            key,
            interpolate({ text, outputs }),
          ]),
        )

        const startedAt = Date.now()
        try {
          const output = await executor({ values, getStagehand })
          outputs[id] = output
          step.output = output
          step.status = 'done'
          publishSteps()
        } catch (err) {
          step.status = 'failed'
          step.durationMs = Date.now() - startedAt
          step.error = err instanceof Error ? err.message : String(err)
          publishSteps()
          await metadata.flush()

          throw err
        }
      }

      return { steps, browserbaseSessionId }
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
