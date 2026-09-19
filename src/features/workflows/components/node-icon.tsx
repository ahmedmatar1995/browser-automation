import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'
import { HelpCircle } from 'lucide-react'

import {
  nodeRegistry,
  type NodeType,
} from '@/features/workflows/nodes/node-registry'

// The accent-colored icon chip, mirroring the node on the canvas. Pass `running`
// to swap the node's icon for a spinner inside the same colored chip.
// Unknown or missing types render a neutral fallback instead of crashing,
// so panels stay up even for steps whose node no longer resolves.
export function NodeIcon({
  type,
  running,
  className,
}: {
  type: NodeType | undefined
  running?: boolean
  className?: string
}) {
  const fallback = {
    icon: HelpCircle,
    accent: 'bg-zinc-500 text-white',
  }
  const def = type ? (nodeRegistry[type] ?? fallback) : fallback
  const Icon = def.icon
  return (
    <span
      className={cn(
        'flex size-6 shrink-0 items-center justify-center rounded-md',
        def.accent,
        className,
      )}
    >
      {running ? (
        <Spinner className="size-3.5" />
      ) : (
        <Icon className="size-3.5" />
      )}
    </span>
  )
}
