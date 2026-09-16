import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Workflow } from '@/lib/db/schema'
import { MoreHorizontal, Play, Trash2Icon } from 'lucide-react'
import { useState } from 'react'
import type { ReactNode } from 'react'
import { useMutation } from '@tanstack/react-query'
import { deleteWorkflowAction } from '../actions'
import { toast } from 'sonner'
import { useNavigate, useRouter } from '@tanstack/react-router'
import { nodeRegistry } from '../nodes/node-registry'
import type {
  NodeField,
  NodeType,
  StepNodeKind,
  StepNodeType,
} from '../nodes/node-registry'
import { useReactFlow, useStore } from '@xyflow/react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'

function NodeIcon({ type, className }: { type: NodeType; className?: string }) {
  const def = nodeRegistry[type]
  const Icon = def.icon

  return (
    <span
      className={cn(
        'flex items-center justify-center shrink-0 size-6 rounded-md',
        def.accent,
        className,
      )}
    >
      <Icon className="size-4" />
    </span>
  )
}

function Section({
  title,
  icon,
  children,
}: {
  title: string
  icon?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-2 border-y border-border bg-card px-3 py-1.5 text-sm font-semibold">
        {icon}
        {title}
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto">{children}</div>
    </div>
  )
}

const sections: {
  kind: StepNodeKind
  label: string
}[] = [
  {
    kind: 'trigger',
    label: 'Triggers',
  },
  {
    kind: 'action',
    label: 'Actions',
  },
]

const definitions = Object.values(nodeRegistry)

function Palette() {
  const { getNodes, addNodes, getViewport } = useReactFlow<StepNodeType>()
  const width = useStore((s) => s.width)
  const height = useStore((s) => s.height)

  const add = (type: NodeType) => {
    const def = nodeRegistry[type]
    const nodes = getNodes()
    if (
      def.kind === 'trigger' &&
      nodes.some((n) => n.data.kind === 'trigger')
    ) {
      toast.error('Workflow can only has one trigger')
      return
    }

    const count = nodes.filter((n) => n.data.type === type).length
    const title = `${def.label} ${count + 1}`

    const { x, y, zoom } = getViewport()
    const position = {
      x: (width / 2 - x) / zoom,
      y: (height / 2 - y) / zoom,
    }

    addNodes({
      id: crypto.randomUUID(),
      type: 'step',
      position,
      data: {
        kind: def.kind,
        type,
        title,
        values: {},
      },
    })
  }

  return (
    <Section title="Toolbar">
      <Accordion
        type="multiple"
        className="px-2 py-2"
        defaultValue={sections.map((s) => s.kind)}
      >
        {sections.map((section) => (
          <AccordionItem
            key={section.kind}
            value={section.kind}
            className="not-last:border-b-0"
          >
            <AccordionTrigger className="py-2 text-xs text-muted-foreground font-medium hover:no-underline">
              {section.label}
            </AccordionTrigger>
            <AccordionContent className="flex flex-col gap-0.5">
              {definitions
                .filter((def) => def.kind === section.kind)
                .map((def) => (
                  <Button
                    key={def.type}
                    variant="ghost"
                    onClick={() => add(def.type)}
                    className="justify-start gap-2.5 px-1.5 text-xs"
                  >
                    <NodeIcon type={def.type} />
                    {def.label}
                  </Button>
                ))}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </Section>
  )
}

function Field({
  field,
  value,
  onChange,
}: {
  field: NodeField
  value: string
  onChange: (value: string) => void
}) {
  if (field.multiline) {
    return (
      <Textarea
        id={field.key}
        value={value}
        placeholder={field.placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    )
  }
  return (
    <Input
      id={field.key}
      value={value}
      placeholder={field.placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}

function Inspector({ node }: { node: StepNodeType | undefined }) {
  const { updateNodeData } = useReactFlow<StepNodeType>()

  if (!node) {
    return (
      <Section title="Editor">
        <p className="p-2 text-sm text-muted-foreground">no node selected</p>
      </Section>
    )
  }
  const { type, title, kind, values } = node.data
  const def = nodeRegistry[type]

  return (
    <Section title={title} icon={<NodeIcon type={type} />}>
      <div className="flex flex-col gap-3 p-3">
        {def.fields.length === 0 ? (
          <p className="text-xs text-muted-foreground">No Properties</p>
        ) : (
          <>
            {def.fields.map((field) => (
              <div key={field.key} className="flex flex-col gap-1.5">
                <Label htmlFor={field.key} className="text-xs">
                  {field.label}
                </Label>
                <Field
                  field={field}
                  value={values[field.key] ?? ''}
                  onChange={(value) => {
                    updateNodeData(node.id, {
                      values: { ...values, [field.key]: value },
                    })
                  }}
                />
              </div>
            ))}
          </>
        )}
      </div>
    </Section>
  )
}

function ActionsMenu({ workflowId }: { workflowId: Workflow['id'] }) {
  const router = useRouter()
  const navigate = useNavigate()
  const deleteWorkflow = useMutation({
    mutationFn: async (variables: { id: Workflow['id'] }) =>
      await deleteWorkflowAction({
        data: {
          id: variables.id,
        },
      }),
    onSuccess: (workflow_id) => {
      toast.success(`Workflow ${workflowId} has been removed`)
      navigate({ to: '/' })
      router.invalidate()
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : 'something went wrong',
      )
    },
  })

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="ghost">
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="min-w-48 border-(--sea-ink)"
      >
        <DropdownMenuItem
          className="gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-destructive focus:bg-destructive/10 focus:text-destructive hover:bg-destructive/10 data-[variant=destructive]:bg-destructive/10 cursor-pointer [$_svg]:size-4 [$_svg]:shrink-0 [&_svg]:text-destructive/80 focus:[&_svg]:text-destructive"
          disabled={deleteWorkflow.isPending}
          onSelect={(e) => {
            e.preventDefault()
            deleteWorkflow.mutateAsync({
              id: workflowId,
            })
          }}
        >
          <Trash2Icon />
          Delete Workflow
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function RunButton({ workflowId }: { workflowId: Workflow['id'] }) {
  return (
    <Button variant="ghost" size="sm">
      <Play className="size-3 text-muted-foreground" />
      <span className="text-sm text-muted-foreground">Run</span>
    </Button>
  )
}

export function RightSidebar({ workflowId }: { workflowId: Workflow['id'] }) {
  const [tab, setTab] = useState('toolbar')

  const selected = useStore((s) => s.nodes.find((n) => n.selected)) as
    StepNodeType | undefined
  const [prevSelectedId, setPrevSelectedId] = useState(selected?.id)
  if (selected && selected.id !== prevSelectedId) {
    setPrevSelectedId(selected.id)
    setTab('editor')
  }
  return (
    <div className="flex size-full items-center justify-center">
      <Tabs value={tab} onValueChange={setTab} className="size-full gap-0">
        <div className="flex w-full items-center justify-between border-b border-border p-2">
          <ActionsMenu workflowId={workflowId} />
          <RunButton workflowId={workflowId} />
        </div>
        <TabsList className="m-2 w-full bg-background">
          <TabsTrigger
            value="toolbar"
            className="flex-1 rounded-sm data-active:bg-accent! data-active:text-accent-foreground! data-active:shadow-none! data-active:border-transparent!"
          >
            Toolbar
          </TabsTrigger>
          <TabsTrigger
            value="editor"
            className="flex-1 rounded-sm data-active:bg-accent! data-active:text-accent-foreground! data-active:shadow-none! data-active:border-transparent!"
          >
            Editor
          </TabsTrigger>
        </TabsList>
        <TabsContent value="toolbar">
          <Palette />
        </TabsContent>
        <TabsContent value="editor">
          <Inspector node={selected} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
