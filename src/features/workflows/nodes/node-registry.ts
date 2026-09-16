import type { Node } from '@xyflow/react'
import { Globe, MousePointerClick } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type StepNodeKind = 'trigger' | 'action'

export type NodeField = {
  key: string
  label: string
  placeholder?: string
  multiline: boolean
  required: boolean
}

export type NodeDefinition = {
  kind: StepNodeKind
  type: string
  label: string
  accent?: string
  icon: LucideIcon
  fields: NodeField[]
}

export const nodeRegistry: Record<string, NodeDefinition> = {
  start: {
    type: 'start',
    kind: 'trigger',
    label: 'Start',
    icon: MousePointerClick,
    accent: 'bg-blue-500 text-white',
    fields: [],
  },
  'open-url': {
    type: 'open-url',
    kind: 'action',
    label: 'Open URL',
    icon: Globe,
    accent: 'bg-emerald-500 text-white',
    fields: [
      {
        key: 'url',
        label: 'URL',
        placeholder: 'https://youtube.com',
        multiline: false,
        required: true,
      },
    ],
  },
} satisfies Record<string, NodeDefinition>

export type NodeType = keyof typeof nodeRegistry

export type StepNodeData = {
  kind: StepNodeKind
  type: NodeType
  title: string
  values: Record<string, string>
}

export type StepNodeType = Node<StepNodeData, 'step'>
