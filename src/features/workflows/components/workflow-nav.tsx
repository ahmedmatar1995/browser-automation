import { Button } from '@/components/ui/button'
import {
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import type { Workflow } from '@/lib/db/schema'
import { Plus, WorkflowIcon } from 'lucide-react'
import { CreateWorkflowDialog } from '../create-workflow-dialog'
import { Link, useLocation } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { motion } from 'motion/react'

export function WorkflowNav({ workflows }: { workflows: Workflow[] }) {
  const [workflowId, setWorkflowId] = useState<string | null>(null)
  const { state } = useSidebar()
  const location = useLocation()
  useEffect(() => {
    setWorkflowId(location.pathname.split('/')[2])
  }, [location])
  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-sm tracking-tight leading-relaxed text-muted-foreground">
        Workflows
      </SidebarGroupLabel>
      <CreateWorkflowDialog>
        <SidebarGroupAction asChild>
          <Button size="xs" variant="ghost">
            <Plus className="size-4" />
          </Button>
        </SidebarGroupAction>
      </CreateWorkflowDialog>
      <SidebarGroupContent className="py-6">
        {state === 'collapsed' ? (
          <SidebarMenu className="space-y-4">
            {workflows.map((workflow) => (
              <SidebarMenuItem key={workflow.id}>
                {workflowId === workflow.id && (
                  <motion.div
                    className="absolute inset-0 rounded-lg bg-(--sea-ink)/12"
                    layoutId="active-workflow"
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  />
                )}
                <Link to="/workflows/$id" params={{ id: workflow.id }}>
                  <SidebarMenuButton
                    tooltip={workflow.name}
                    isActive={workflowId === workflow.id}

                    className="group/menu-item relative h-9 w-full gap-2.5 rounded-lg px-2.5 text-sm font-medium text-muted-foreground transition-colors before:absolute before:left-0 before:top-0.5 before:h-5 before:w-0.5 before:-translate-y-0.5 before:rounded-full before:bg-transparent hover:bg-(--sea-ink)/10 hover:text-(--sea-ink) data-[active=true]:bg-(--sea-ink)/12 data-[active=true]:text-(--sea-ink) data-[active=true]:before:bg-(--sea-ink)"
                  >
                    <WorkflowIcon className="size-4 text-muted-foreground" />
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        ) : (
          <SidebarMenu className="space-y-4">
            {workflows.map((workflow) => (
              <SidebarMenuItem key={workflow.id}>
                <Link to="/workflows/$id" params={{ id: workflow.id }}>
                  <SidebarMenuButton
                    isActive={workflowId === workflow.id}
                    tooltip={workflow.name}
                    className="group/menu-item relative h-9 w-full gap-2.5 rounded-lg px-2.5 text-sm font-medium text-muted-foreground transition-colors before:absolute before:left-0 before:top-0.5 before:h-5 before:w-0.5 before:-translate-y-0.5 before:rounded-full before:bg-transparent hover:bg-(--sea-ink)/10 hover:text-(--sea-ink) data-[active=true]:bg-(--sea-ink)/12 data-[active=true]:text-(--sea-ink) data-[active=true]:before:bg-(--sea-ink)"
                  >
                    <WorkflowIcon className="size-4 text-muted-foreground" />
                    <span>{workflow.name}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        )}
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
