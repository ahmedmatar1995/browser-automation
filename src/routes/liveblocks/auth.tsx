import { createFileRoute } from '@tanstack/react-router'
import { liveblocks } from '@/lib/liveblocks'
import { checkOrg, checkUser } from '@/lib/check-auth'
import { listWorkflowAction } from '@/features/workflows/actions'
import { clerkClient } from '@clerk/tanstack-react-start/server'

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

        const client = await clerkClient()
        const clerkUser = await client.users.getUser(userId)
        const session = liveblocks.prepareSession(userId, {
          userInfo: {
            name:
              clerkUser.fullName ??
              clerkUser.username ??
              clerkUser.primaryEmailAddress?.emailAddress ??
              userId,
            avatar: clerkUser.imageUrl,
          },
        })

        session.allow(room, session.FULL_ACCESS)

        const { body, status } = await session.authorize()

        return new Response(body, { status })
      },
    },
  },
})
