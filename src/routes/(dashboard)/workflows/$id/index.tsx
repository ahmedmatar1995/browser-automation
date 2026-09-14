import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/(dashboard)/workflows/$id/')({
  component: RouteComponent,
})

function RouteComponent() {
  const { id } = Route.useParams()
  return (
    <div className="p-4">
      <p>{JSON.stringify(id, null, 2)}</p>
    </div>
  )
}
