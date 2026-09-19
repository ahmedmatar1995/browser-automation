import { auth } from '@clerk/tanstack-react-start/server'
import { createFileRoute } from '@tanstack/react-router'
import { browserbase } from '@/lib/browserbase'
import { NotFoundError } from '@browserbasehq/sdk'

export const Route = createFileRoute('/replays/$sessionId')({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const { userId, orgId } = await auth()
        if (!userId || !orgId)
          return new Response('unAuthorized', { status: 401 })

        const { sessionId } = params

        try {
          const replay = await browserbase.sessions.replays.retrieve(sessionId)
          const firstPage = replay.pages[0]
          if (!firstPage) {
            return new Response(null, { status: 202 })
          }

          // The playlist itself. Its segment URLs are pre-signed CDN links, so only
          // this manifest needs proxying — hls.js fetches the segments directly.
          const playlist = await browserbase.sessions.replays.retrievePage(
            sessionId,
            firstPage.pageId,
          )
          const m3u8 = await playlist.text()

          return new Response(m3u8, {
            status: 200,
            headers: {
              'Content-Type': 'application/vnd.apple.mpegurl',
              // The playlist's pre-signed segment URLs rotate, so don't let a stale
              // manifest be cached.
              'Cache-Control': 'no-store',
            },
          })
        } catch (err) {
          if (err instanceof NotFoundError) {
            return new Response('Not Found', { status: 202 })
          }
          throw err
        }
      },
    },
  },
})
