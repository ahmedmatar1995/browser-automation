import { createFileRoute } from '@tanstack/react-router'
import { liveblocks } from '@/lib/liveblocks'
import { checkOrg, checkUser } from '@/lib/check-auth'
import { listWorkflowAction } from '@/features/workflows/actions'

export const Route = createFileRoute('/liveblocks/auth')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        await checkUser()
        const { userId, orgId } = await checkOrg()
        if (!userId || !orgId)
          return new Response('unAuthorized', { status: 401 })
        const { room } = (await request.json()) as { room: string }
        const workflow = await listWorkflowAction({
          data: {
            workflowId: room,
          },
        })

        if (!workflow) {
          return new Response('Workflow not found', { status: 404 })
        }

        const session = await liveblocks.prepareSession(userId, {
          userInfo: {
            name: userId,
          },
        })

        session.allow(room, session.FULL_ACCESS)

        const { body, status } = await session.authorize()

        console.log(body, status)

        return new Response(body, { status })
      },
    },
  },
})
