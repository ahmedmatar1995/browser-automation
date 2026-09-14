import type { Workflow } from '@/lib/db/schema'

export async function WorkflowNav({ workflows }: { workflows: Workflow[] }) {
  return (
    <div>
      <p>Workflow Nav</p>
      <p>{JSON.stringify(workflows, null, 2)}</p>
    </div>
  )
}
