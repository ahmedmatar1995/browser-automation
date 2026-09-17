import { Room } from '@/features/workflows/components/room'
import { WorkflowShell } from '@/features/workflows/components/workflow-shell'
import { createFileRoute } from '@tanstack/react-router'
import { WorkflowRunsProvider } from '@/features/workflows/components/workflow-runs-provider'
import { getWorkflowRunsTokenAction } from '@/features/workflows/actions'
import { checkOrg, checkUser } from '@/lib/check-auth'

export const Route = createFileRoute('/(dashboard)/workflows/$id/')({
  component: RouteComponent,
  beforeLoad: async () => await checkUser(),
  loader: async ({ params }) => {
    await checkOrg()
    const runsToken = await getWorkflowRunsTokenAction({
      data: { workflowId: params.id },
    })

    return { runsToken }
  },
})

function RouteComponent() {
  const { id } = Route.useParams()
  const { runsToken } = Route.useLoaderData()
  return (
    <Room workflowId={id}>
      <WorkflowRunsProvider workflowId={id} accessToken={runsToken}>
        <WorkflowShell workflowId={id} />
      </WorkflowRunsProvider>
    </Room>
  )
}
