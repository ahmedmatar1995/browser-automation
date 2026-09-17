import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'
import { nodeRegistry } from '../nodes/node-registry'
import type { StepNodeType } from '../nodes/node-registry'
import { cn } from '@/lib/utils'
import { HelpCircle } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'

import { useLatestRunSteps } from './workflow-runs-provider'

export function StepNodeComponent({
  id,
  data,
  selected,
}: NodeProps<StepNodeType>) {
  const { type, kind, title } = data
  const def = nodeRegistry[type]

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const Icon = def?.icon ?? HelpCircle
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const accent = def?.accent ?? 'bg-zinc-500 text-white'
  const hasTarget = kind !== 'trigger'

  const { steps, isLive } = useLatestRunSteps()
  const status = steps.find((step) => step.nodeId === id)?.status
  const isRunning = status === 'running' && isLive
  const isFailed = status === 'failed'

  return (
    <div
      className={cn(
        'min-w-50 max-w-80 rounded-lg border-2 border-border bg-card text-card-foreground',
        selected && 'ring-2 ring-ring ring-offset-2 ring-offset-background',
        isRunning && 'border-blue-500',
        isFailed && 'border-destructive',
      )}
    >
      {hasTarget && (
        <Handle
          type="target"
          position={Position.Left}
          className="h-3.5! w-1.5! min-w-0! rounded-l-xs! rounded-r-none! border-0! bg-border!"
          style={{ transform: 'translate(-100%, -50%)' }}
        />
      )}
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        <div
          className={cn(
            'flex size-7 shrink-0 items-center justify-center rounded-md',
            accent,
          )}
        >
          {isRunning ? (
            <Spinner className="size-4" />
          ) : (
            <Icon className="size-4" />
          )}
        </div>
        <span className="text-sm font-semibold">{title}</span>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="h-3.5! w-1.5! min-w-0! rounded-l-none! rounded-r-xs! border-0! bg-border!"
        style={{ transform: 'translate(100%, -50%)' }}
      />
    </div>
  )
}

export const StepNode = memo(StepNodeComponent)
