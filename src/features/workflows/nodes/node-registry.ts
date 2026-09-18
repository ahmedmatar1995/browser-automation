import type { Node } from '@xyflow/react'
import { Bot, Globe, MousePointerClick, Pointer, ScanText } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type StepNodeKind = 'trigger' | 'action'

export type NodeField = {
  key: string
  label: string
  placeholder?: string
  multiline: boolean
  required: boolean
}

export type NodeOutputs = {
  path: string
  label: string
}

export type NodeDefinition = {
  kind: StepNodeKind
  type: string
  label: string
  accent?: string
  icon: LucideIcon
  fields: NodeField[]
  outputs: NodeOutputs[]
}

export const nodeRegistry: Record<string, NodeDefinition> = {
  start: {
    type: 'start',
    kind: 'trigger',
    label: 'Start',
    icon: MousePointerClick,
    accent: 'bg-blue-500 text-white',
    fields: [],
    outputs: [],
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
    outputs: [
      {
        path: 'url',
        label: 'URL',
      },
      {
        path: 'title',
        label: 'Title',
      },
    ],
  },
  act: {
    type: 'act',
    kind: 'action',
    label: 'Act',
    icon: Pointer,
    accent: 'bg-violet-500 text-white',
    fields: [
      {
        key: 'instructions',
        label: 'Instructions',
        placeholder: 'instructions',
        multiline: true,
        required: true,
      },
    ],
    outputs: [
      {
        path: 'success',
        label: 'Success',
      },
      {
        path: 'message',
        label: 'Message',
      },
      {
        path: 'url',
        label: 'URL',
      },
    ],
  },
  extract: {
    type: 'extract',
    kind: 'action',
    label: 'Extract',
    accent: 'bg-amber-500 text-white',
    icon: ScanText,
    fields: [
      {
        key: 'instructions',
        label: 'Instructions',
        placeholder: 'Extract the product price',
        multiline: true,
        required: true,
      },
    ],
    outputs: [
      {
        path: 'extraction',
        label: 'Extraction',
      },
    ],
  },
  observe: {
    type: 'observe',
    kind: 'action',
    label: 'Observe',
    accent: 'bg-sky-500 text-white',
    icon: ScanText,
    fields: [
      {
        key: 'instructions',
        label: 'Instructions',
        placeholder: 'Find the signin button',
        multiline: true,
        required: true,
      },
    ],
    outputs: [
      {
        path: 'matches',
        label: 'Matches',
      },
      { path: 'matches[0].selector', label: 'Selector' },
      { path: 'matches[0].description', label: 'Description' },
    ],
  },
  agent: {
    type: 'agent',
    kind: 'action',
    label: 'Agent',
    icon: Bot,
    accent: 'bg-fuchsia-600 text-white',
    fields: [
      {
        key: 'instructions',
        label: 'Instructions',
        placeholder: 'Book the cheapest flight to LA',
        multiline: true,
        required: true,
      },
    ],
    outputs: [
      {
        path: 'success',
        label: 'Success',
      },
      {
        path: 'message',
        label: 'Message',
      },
      {
        path: 'url',
        label: 'URL',
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

export type ActionNodeType = {
  [K in NodeType]: (typeof nodeRegistry)[K]['kind'] extends 'action' ? K : never
}[NodeType]
