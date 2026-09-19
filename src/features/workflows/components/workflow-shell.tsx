import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import type { Workflow } from '@/lib/db/schema'
import { Canvas } from './canvas'
import { RightSidebar } from './right-sidebar'
import { ConsolePanel } from './console-panel'

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
            <ConsolePanel />
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel
        defaultSize="16rem"
        minSize="14rem"
        maxSize="36rem"
        groupResizeBehavior="preserve-pixel-size"
      >
        <RightSidebar workflowId={workflowId} />
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
