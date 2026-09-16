import toposort from 'toposort'
import type { WorkflowGraph } from '@/lib/db/schema'

export function validateGraph({ nodes, edges }: WorkflowGraph): string[] {
  const problems: string[] = []

  const triggers = nodes.filter((n) => n.data.kind === 'trigger').length

  if (triggers !== 1) {
    problems.push(
      `Workflow can only has one trigger, found ${triggers} triggers`,
    )
  }

  if (edges.length == 0) {
    problems.push('Connect your nodes before running')
  } else {
    try {
      toposort(edges.map((edge) => [edge.source, edge.target]))
    } catch (err) {
      problems.push('Workflow has a cycle, remove the loop before running')
    }
  }

  return problems
}
