import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import type { Workflow } from '@/lib/db/schema'
import { Canvas } from './canvas'
import { RightSidebar } from './right-sidebar'

export function WorkflowShell({ workflowId }: { workflowId: Workflow['id'] }) {
  void workflowId
  return (
    <ResizablePanelGroup className="size-full" orientation="horizontal">
      <ResizablePanel minSize="30rem">
        <ResizablePanelGroup orientation="vertical">
          <ResizablePanel minSize="18rem">
            <Canvas />
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize="8rem" minSize="6rem">
            <div className="flex size-full items-center justify-center">
              logs
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize="16rem" minSize="14rem" maxSize="36rem">
        <RightSidebar />
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
