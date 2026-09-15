import { checkOrg } from '@/lib/check-auth'
import { clerkClient } from '@clerk/tanstack-react-start/server'
import { createFileRoute } from '@tanstack/react-router'

type UserInfo = Liveblocks['UserMeta']['info']

export const Route = createFileRoute('/liveblocks/users')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { userId, orgId } = await checkOrg()
        if (!userId || !orgId)
          return new Response('unAuthorized', { status: 401 })

        let userIds: unknown

        try {
          ;({ userIds } = await request.json())
        } catch (err) {
          return new Response('Invalid JSON Body', { status: 400 })
        }

        if (
          !Array.isArray(userIds) ||
          userIds.some((id) => typeof id !== 'string')
        ) {
          return new Response('Invalid JSON Body', { status: 400 })
        }

        const ids = userIds as string[]

        if (ids.length === 0) {
          return Response.json([])
        }

        const client = await clerkClient()
        const { data: users } = await client.users.getUserList({
          userId: ids,
          organizationId: [orgId],
          limit: ids.length,
        })

        const userById = new Map(users.map((user) => [user.id, user]))

        const resolved: (UserInfo | null)[] = ids.map((id) => {
          const user = userById.get(id)

          if (!user) {
            return null
          }

          return {
            name:
              user.fullName ??
              user.username ??
              user.primaryEmailAddress?.emailAddress ??
              'Anonymous',
            avatar: user.imageUrl,
          }
        })

        return Response.json(resolved)
      },
    },
  },
})
