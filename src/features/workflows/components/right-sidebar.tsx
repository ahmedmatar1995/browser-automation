import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Workflow, WorkflowGraph } from '@/lib/db/schema'
import {
  MoreHorizontal,
  Play,
  Plus,
  Trash2Icon,
  Unplug,
  Variable,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { useMutation } from '@tanstack/react-query'
import { deleteWorkflowAction, runWorkflowAction } from '../actions'
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

import { useUpStreamConnections } from '../hooks/use-upstream-connections'

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

  const connections = useUpStreamConnections()
  const [activeFieldKey, setActiveFieldKey] = useState<string | null>(null)

  const nodeId = node?.id
  useEffect(() => {
    setActiveFieldKey(null)
  }, [nodeId])

  if (!node) {
    return (
      <Section title="Editor">
        <p className="p-2 text-sm text-muted-foreground">no node selected</p>
      </Section>
    )
  }

  const { type, title, values } = node.data
  const def = nodeRegistry[type]

  if (!def) {
    return (
      <Section title={title}>
        <p className="p-3 text-xs text-muted-foreground">
          Unknown node type “{type}”. Remove it and add a new step.
        </p>
      </Section>
    )
  }

  const targetKey = activeFieldKey ?? def.fields[0]?.key
  const targetField = def.fields.find((f) => f.key === targetKey)
  const insertToken = (token: string) => {
    if (!targetKey) return
    const current = values[targetKey] ?? ''
    const sep = current === '' || /\s$/.test(current) ? '' : ' '
    updateNodeData(node.id, {
      values: { ...values, [targetKey]: current + sep + token },
    })
  }

  return (
    <Section title={title} icon={<NodeIcon type={type} />}>
      <div className="flex flex-col gap-3 p-3">
        {def.fields.length === 0 ? (
          <p className="text-xs text-muted-foreground">No Properties</p>
        ) : (
          <>
            {def.fields.map((field) => (
              <div
                key={field.key}
                className="flex flex-col gap-1.5"
                onFocus={() => setActiveFieldKey(field.key)}
              >
                <Label htmlFor={field.key} className="text-xs">
                  {field.label}
                  {field.required && (
                    <span className="text-destructive"> *</span>
                  )}
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

      <div className="border-t border-border">
        <div className="flex items-center gap-1.5 px-3 pt-2.5 pb-1">
          <Variable className="size-3.5 text-muted-foreground" />
          <span className="text-xs font-semibold">Variables</span>
          <span className="rounded-full bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
            {connections.length}
          </span>
        </div>

        {def.fields.length > 1 && connections.length > 0 && (
          <div className="flex flex-wrap items-center gap-1 px-3 pb-1.5">
            <span className="text-[11px] text-muted-foreground">
              Insert into:
            </span>
            {def.fields.map((field) => (
              <Button
                key={field.key}
                size="xs"
                variant={field.key === targetKey ? 'secondary' : 'ghost'}
                onClick={() => setActiveFieldKey(field.key)}
                className="h-6 text-[11px]"
              >
                {field.label}
              </Button>
            ))}
          </div>
        )}

        {targetField && connections.length > 0 && (
          <p className="px-3 pb-1.5 text-[11px] text-muted-foreground">
            Click a variable to insert it into {targetField.label}.
          </p>
        )}

        <div className="flex flex-col gap-0.5 px-1.5 pb-3">
          {connections.length === 0 ? (
            <div className="mx-1.5 flex flex-col items-center gap-1 rounded-lg border border-dashed border-border px-3 py-4 text-center">
              <Unplug className="size-4 text-muted-foreground" />
              <p className="text-xs font-medium">No upstream outputs</p>
              <p className="text-[11px] leading-snug text-muted-foreground">
                Connect a step before this one, then pick its outputs here.
              </p>
            </div>
          ) : (
            connections.map((conn) => (
              <Button
                key={conn.token}
                variant="ghost"
                onClick={() => insertToken(conn.token)}
                disabled={!targetKey}
                title={conn.token}
                className="h-auto justify-start gap-2 px-1.5 py-1.5 text-left"
              >
                <NodeIcon type={conn.nodeType} className="size-5" />
                <span className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
                  <span className="w-full truncate text-xs font-medium">
                    {conn.label}
                  </span>
                  <code className="w-full truncate rounded bg-muted px-1 py-px font-mono text-[11px] font-normal text-muted-foreground">
                    {conn.token}
                  </code>
                </span>
                <Plus className="size-3.5 shrink-0 text-muted-foreground" />
              </Button>
            ))
          )}
        </div>
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
  const { getNodes, getEdges } = useReactFlow<StepNodeType>()

  const runWorkflow = useMutation({
    mutationFn: async (variables: {
      id: Workflow['id']
      graph: WorkflowGraph
    }) =>
      await runWorkflowAction({
        data: {
          id: variables.id,
          graph: variables.graph,
        },
      }),
    onSuccess: (handle) => {
      toast.success(`Workflow running, Handle:${handle.id}`)
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : 'something went wrong',
      )
    },
  })
  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={runWorkflow.isPending}
      onClick={() =>
        runWorkflow.mutate({
          id: workflowId,
          graph: {
            nodes: getNodes(),
            edges: getEdges(),
          },
        })
      }
    >
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
        <TabsContent value="toolbar" className="flex min-h-0 flex-col">
          <Palette />
        </TabsContent>
        <TabsContent value="editor" className="flex min-h-0 flex-col">
          <Inspector node={selected} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
