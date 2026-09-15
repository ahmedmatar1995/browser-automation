import { Room } from '@/features/workflows/components/room'
import { WorkflowShell } from '@/features/workflows/components/workflow-shell'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/(dashboard)/workflows/$id/')({
  component: RouteComponent,
})

function RouteComponent() {
  const { id } = Route.useParams()
  return (
    <Room workflowId={id}>
      <WorkflowShell workflowId={id} />
    </Room>
  )
}
