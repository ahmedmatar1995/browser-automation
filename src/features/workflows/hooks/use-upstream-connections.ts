import { useMemo } from 'react'
import { getIncomers, useStore } from '@xyflow/react'
import {
  nodeRegistry,
  type StepNodeType,
  type NodeType,
} from '../nodes/node-registry'

export type UpStreamConnection = {
  token: string
  label: string
  nodeType: NodeType
}

export function useUpStreamConnections(): UpStreamConnection[] {
  const nodes = useStore((s) => s.nodes)
  const edges = useStore((s) => s.edges)
  const selected = nodes.find((n) => n.selected) as StepNodeType

  return useMemo(() => {
    if (!selected) return []

    const ancestors: StepNodeType[] = []
    const seen = new Set<string>()
    const queue: StepNodeType[] = [selected]

    while (queue.length) {
      const current = queue.shift()!

      for (const incomer of getIncomers(
        current,
        nodes,
        edges,
      ) as StepNodeType[]) {
        if (seen.has(incomer.id)) continue
        seen.add(incomer.id)
        ancestors.push(incomer)
        queue.push(incomer)
      }
    }
    return ancestors.flatMap((node) =>
      nodeRegistry[node.data.type].outputs.map((output) => ({
        token: `{{ ${node.id}.${output.path} }}`,
        label: `${node.data.title} · ${output.label}`,
        nodeType: node.data.type,
      })),
    )
  }, [selected, nodes, edges])
}
