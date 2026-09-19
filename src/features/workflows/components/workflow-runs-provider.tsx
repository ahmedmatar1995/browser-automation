'use client'

import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { useRealtimeRunsWithTag } from '@trigger.dev/react-hooks'

import type { RunStep, runWorkflowTask } from '../tasks/run-workflow'
import type { Workflow } from '@/lib/db/schema'

type WorkflowRun = ReturnType<
  typeof useRealtimeRunsWithTag<typeof runWorkflowTask>
>['runs'][number]

type WorkflowRunsContextValue = {
  runs: WorkflowRun[]
  error?: Error
}

const WorkflowRunsContext = createContext<WorkflowRunsContextValue | null>(null)

type WorkflowrunsProvider = {
  workflowId: Workflow['id']
  accessToken: string
  children: ReactNode
}

export function WorkflowRunsProvider({
  workflowId,
  accessToken,
  children,
}: WorkflowrunsProvider) {
  const { runs, error } = useRealtimeRunsWithTag<typeof runWorkflowTask>(
    `workflow:${workflowId}`,
    {
      accessToken,
    },
  )

  const value = useMemo<WorkflowRunsContextValue>(
    () => ({ runs, error }),
    [runs, error],
  )

  return (
    <WorkflowRunsContext.Provider value={value}>
      {children}
    </WorkflowRunsContext.Provider>
  )
}

export function useWorkflowRuns() {
  const value = useContext(WorkflowRunsContext)
  if (!value) {
    throw new Error('useWorkflowRuns must be within WorkflowRunsProvider')
  }
  return value
}

// The realtime hook types createdAt as Date, but SSE payloads can arrive as
// ISO strings at runtime. Normalize at the boundary so every reader below
// can safely call Date methods without crashing the panel.
function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value)
}

function isRunLive(run: WorkflowRun) {
  return run.status === 'QUEUED' || run.status === 'EXECUTING'
}

function stepsForRun(run: WorkflowRun): RunStep[] {
  const metadataSteps = run.metadata?.steps as RunStep[] | undefined
  return run.output?.steps ?? metadataSteps ?? []
}

interface LatestRunSteps {
  steps: RunStep[]
  // True while the latest run is queued or executing — i.e. still producing steps.
  isLive: boolean
}

export function useLatestRunSteps(): LatestRunSteps {
  const { runs } = useWorkflowRuns()

  return useMemo<LatestRunSteps>(() => {
    const latest = runs.reduce<WorkflowRun | undefined>((newest, run) => {
      if (!newest || toDate(run.createdAt) > toDate(newest.createdAt))
        return run
      return newest
    }, undefined)

    if (!latest) return { steps: [], isLive: false }
    const isLive = latest.status === 'QUEUED' || latest.status === 'EXECUTING'
    const metadataSteps = latest.metadata?.steps as RunStep[] | undefined
    const steps = latest.output?.steps ?? metadataSteps ?? []

    return { steps, isLive }
  }, [runs])
}

function sessionIdForRun(run: WorkflowRun): string | undefined {
  return run.output?.browserbaseSessionId
}

export type ConsoleRun = {
  id: string
  status: WorkflowRun['status']
  createdAt: Date
  isLive: boolean
  steps: RunStep[]
  browserbaseSessionId: string | undefined
}

export function useConsoleRuns(): ConsoleRun[] {
  const { runs } = useWorkflowRuns()

  return useMemo<ConsoleRun[]>(
    () =>
      [...runs]
        .sort(
          (a, b) =>
            toDate(b.createdAt).getTime() - toDate(a.createdAt).getTime(),
        )
        .map((run) => ({
          id: run.id,
          status: run.status,
          createdAt: toDate(run.createdAt),
          isLive: isRunLive(run),
          steps: stepsForRun(run),
          browserbaseSessionId: sessionIdForRun(run),
        })),
    [runs],
  )
}
