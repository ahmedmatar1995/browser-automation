import { Spinner } from '@/components/ui/spinner'
import type { Workflow } from '@/lib/db/schema'
import {
  ClientSideSuspense,
  LiveblocksProvider,
  RoomProvider,
} from '@liveblocks/react'
import { ReactFlowProvider } from '@xyflow/react'
import type { ReactNode } from 'react'

export function Room({
  workflowId,
  children,
}: {
  workflowId: Workflow['id']
  children: ReactNode
}) {
  return (
    <LiveblocksProvider
      authEndpoint="/liveblocks/auth"
      resolveUsers={async ({ userIds }) => {
        try {
          const response = await fetch('/liveblocks/users', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userIds }),
          })
          if (!response.ok) return undefined
          // users endpoint returns (UserInfo | null)[], Liveblocks accepts null/undefined for unknown
          return await response.json()
        } catch {
          return undefined
        }
      }}
      throttle={16}
    >
      <RoomProvider id={workflowId}>
        <ClientSideSuspense
          fallback={
            <div className="flex min-h-screen items-center justify-center">
              <div className="max-w-sm flex items-center justify-center p-4">
                <Spinner className="size-6 animate-spin text-muted-foreground" />
              </div>
            </div>
          }
        >
          <ReactFlowProvider>{children}</ReactFlowProvider>
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  )
}
