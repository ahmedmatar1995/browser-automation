---
name: xyflow-react
description: 'Use when building workflow canvases, node palettes, or graph editors with @xyflow/react 12+ and @liveblocks/react-flow. Covers viewport math, Zustand store (useStore/useReactFlow), ReactFlowProvider scoping, nodeRegistry patterns, Handles, and collaborative sync. Triggers on: xyflow, @xyflow/react, React Flow, reactflow, nodeRegistry, StepNode, Palette, canvas, viewport, Liveblocks flow.'
license: MIT
compatibility: opencode
metadata:
  author: project-local
  version: 1.0.0
  domain: frontend
  triggers: xyflow, @xyflow/react, React Flow, reactflow, nodeRegistry, StepNode, Palette, canvas, viewport, useReactFlow, useStore, Liveblocks, react-flow
  role: specialist
  scope: implementation
  output-format: code
  related-skills: react-expert, typescript-pro
---

# xyflow-react

Expert skill for `@xyflow/react@12` workflow editors as used in this repo (`src/features/workflows/`). Encodes the Palette/Canvas/registry pattern so you don't re-derive viewport math or provider scoping.

## When To Use

- Adding/editing `Canvas` (`src/features/workflows/components/canvas.tsx`), `Palette`/`RightSidebar` (`src/features/workflows/components/right-sidebar.tsx`), `StepNode` (`src/features/workflows/components/step-node.tsx`)
- Extending `nodeRegistry` (`src/features/workflows/nodes/node-registry.ts`) with new `StepNodeKind`/`NodeType`
- Implementing `addNodes`, `getViewport`, `useStore(s=>s.width/height)`, `screenToFlowPosition`, viewport centering, or Liveblocks `useLiveblocksFlow`
- Debugging "no provider", wrong drop position, zoom/pan offset bugs, or trigger invariant races

## Repo Ground Truth (this project)

- **Version:** `@xyflow/react@^12.11.6` (`package.json:37`) + `@liveblocks/react-flow@^3.24.1`
- **Registry:** `nodeRegistry: Record<string, NodeDefinition>` (`node-registry.ts:24`) with `StepNodeKind='trigger'|'action':5`, `NodeDefinition{kind,type,label,icon,accent,fields}:15`, `NodeType=keyof typeof nodeRegistry:51`, `StepNodeType=Node<StepNodeData,'step'>:60`
- **Canvas:** `initialNodes:20` seeded with `start:22` (trigger) + `open-url:35` (action), `nodeTypes:{step:StepNode}:59`, `ReactFlow` props `maxZoom=1 fitView colorMode connectionLineType=SmoothStep:94-118`, Liveblocks `useLiveblocksFlow({nodes,edges}):75`
- **Palette:** `sections:69` groups by `kind`, `definitions=Object.values(nodeRegistry):83`, `useReactFlow<StepNodeType>:86` + `useStore(s=>s.width/height):87-88`, `add(type):90` enforces single trigger `:93-99`, title dedup `:101-102`, viewport center `:104-108`, `addNodes({id:crypto.randomUUID(), type:'step', position, data}):110`

## Core Workflow

1. **Check registry** — add `NodeDefinition` to `nodeRegistry` first; `Palette` auto-groups via `definitions.filter(def=>def.kind===section.kind):140`
2. **Verify provider** — `WorkflowShell:10` must wrap both `Canvas` and `RightSidebar` in `<ReactFlowProvider>`; otherwise `useReactFlow:86`/`useStore:87` throws
3. **Implement viewport math via helper** — prefer `screenToFlowPosition` over manual `(width/2 - x)/zoom`; fallback formula documented below
4. **Enforce invariants before `addNodes`** — single-trigger check `nodes.some(n=>n.data.kind==='trigger'):95` + `toast.error`; also disable button UI
5. **Validate** — `tsc --noEmit`; check `nodeTypes` key matches `type:'step'`; verify `crypto.randomUUID` availability; test pan/zoom center

## Reference Guide

| Topic | When to Load |
|-------|--------------|
| Viewport math + `screenToFlowPosition` | Node drops at wrong position, pan/zoom offset bugs |
| Zustand store / `useReactFlow` vs `useStore` | Dimension/subscription, stale viewport, extra re-renders |
| `nodeRegistry` + `StepNode` Handles | New node kinds, conditional `Handle` rendering |
| Liveblocks `useLiveblocksFlow` sync | Collaboration races, duplicate triggers, optimistic updates |
| Provider scoping | "no provider" errors, lifting provider to `WorkflowShell` |

## Key Patterns

### 1. Viewport centering (canonical)

```ts
// src/features/workflows/components/right-sidebar.tsx:104-108
// Preferred: built-in helper (handles zoom + translate internally)
import { useReactFlow } from '@xyflow/react'
const { screenToFlowPosition } = useReactFlow()
const position = screenToFlowPosition({ x: width/2, y: height/2 })

// Manual fallback (what Palette currently does):
const { x, y, zoom } = getViewport() // Viewport{x,y,zoom}: ReactFlow screen = flow*zoom + {x,y}
const position = { x: (width/2 - x) / zoom, y: (height/2 - y) / zoom }
// width/height from useStore(s=>s.width/height):87-88 — measured pane size in px
// Guard: if (!width || !height) return {x:0,y:0} // before ResizeObserver fires
```

### 2. Provider lifting (fixes useReactFlow outside Canvas)

```tsx
// src/features/workflows/components/workflow-shell.tsx:10
import { ReactFlowProvider } from '@xyflow/react'
import { Canvas } from './canvas'
import { RightSidebar } from './right-sidebar'

export function WorkflowShell({ workflowId }) {
  return (
    <ReactFlowProvider>
      <Canvas />
      <RightSidebar workflowId={workflowId} />
    </ReactFlowProvider>
  )
}
// Canvas.tsx:94 <ReactFlow> must be inside provider; Palette:86 useReactFlow then works.
// Alternative for Liveblocks: Liveblocks provider must also wrap — check liveblocks.config.ts
```

### 3. Registry extension (new node type)

```ts
// src/features/workflows/nodes/node-registry.ts:24
import { Clock } from 'lucide-react'
export const nodeRegistry = {
  start: { type:'start', kind:'trigger', label:'Start', icon: MousePointerClick, fields:[] },
  'open-url': { type:'open-url', kind:'action', label:'Open URL', icon: Globe, accent:'bg-emerald-500 text-white',
    fields:[{key:'url', label:'URL', placeholder:'https://youtube.com', multiline:false, required:true}] },
  'wait': { // new
    type:'wait', kind:'action', label:'Wait', icon: Clock, accent:'bg-amber-500 text-white',
    fields:[{key:'ms', label:'Delay (ms)', placeholder:'1000', multiline:false, required:true}]
  },
} satisfies Record<string, NodeDefinition>
// Palette sections auto-group by kind; add new kind to sections:69 if needed
```

### 4. Conditional Handles (trigger has no target)

```tsx
// src/features/workflows/components/step-node.tsx:17-32
const hasTarget = kind !== 'trigger'
{hasTarget && <Handle type="target" position={Position.Left} />}
<Handle type="source" position={Position.Right} />
// Custom node: memo(StepNodeComponent):55 to avoid re-render on unrelated node changes
```

### 5. Invariant + title dedup (hardened)

```ts
// src/features/workflows/components/right-sidebar.tsx:90-102
const hasTrigger = nodes.some(n => n.data.kind === 'trigger')
if (def.kind === 'trigger' && hasTrigger) {
  toast.error('Workflow can only have one trigger'); return
}
// Disable UI too: <Button disabled={def.kind==='trigger' && hasTrigger}>
const count = nodes.filter(n => n.data.type === type).length
const title = `${def.label} ${count + 1}` // consider max suffix for delete+re-add stability
addNodes({ id: crypto.randomUUID(), type:'step', position, data:{kind:def.kind, type, title, values:{}} })
// values init: Object.fromEntries(def.fields.map(f=>[f.key, ''])) for defaults
```

## Constraints

### MUST DO
- Wrap `Canvas` + `Palette` in `ReactFlowProvider` (or Liveblocks equivalent) before calling `useReactFlow`/`useStore`
- Use `screenToFlowPosition` when available; otherwise use `(screenCenter - translate)/zoom` with `width/height` guards
- Extend `nodeRegistry` as source of truth — never hardcode node types in `Palette` or `Canvas`
- Match `StepNodeType` generic: `useReactFlow<StepNodeType>` and `Node<StepNodeData,'step'>` with `nodeTypes:{step:StepNode}`
- Handle `width/height === 0` on mount; handle `zoom` bounds (`maxZoom:1` in canvas.tsx:101)
- Validate Liveblocks `useLiveblocksFlow` nodes/edges are the sync source — don't duplicate local state

### MUST NOT DO
- Call `useReactFlow`/`useStore` outside provider (throws)
- Use manual viewport math without `(width/2 - x)/zoom` correction — drops at wrong pan/zoom
- Hardcode `position:{x:0,y:0}` — causes stacking at origin
- Bypass trigger invariant only with toast — also disable button, add Liveblocks validator for multi-client race
- Use `Object.values(nodeRegistry)` order as semantic — rely on `sections` for display order
- Use `crypto.randomUUID` in non-secure contexts without fallback (`nanoid`)

## Output Templates

When implementing xyflow features, provide:
1. Registry entry (`node-registry.ts`) if new node type
2. Palette/Canvas patch with provider + viewport math
3. StepNode Handle update if new kind
4. Note on Liveblocks sync implication

## Common Pitfalls

| Symptom | Cause | Fix |
|---------|-------|-----|
| `useReactFlow must be used within ReactFlowProvider` | `Palette` outside provider | Lift `ReactFlowProvider` to `WorkflowShell` |
| Node drops at top-left when panned | Missing viewport math | Use `screenToFlowPosition` or `(width/2 - x)/zoom` |
| Duplicate triggers with 2 users | Client-side check race | Add Liveblocks storage validator + disable button |
| `width/height` is 0 on first click | `ResizeObserver` not fired | Guard `if(!width||!height) return` |
| Node not rendering | `type:'step'` mismatch | Ensure `nodeTypes:{step:StepNode}` matches |
| Icon missing | `def.icon` undefined | Fallback `HelpCircle` as in `step-node.tsx:14` |

## Docs

- [@xyflow/react docs](https://reactflow.dev/) — `Viewport`, `NodeTypes`, `useReactFlow`, `useStore`, `screenToFlowPosition`
- Liveblocks React Flow: `@liveblocks/react-flow` `useLiveblocksFlow`
- Local refs: `canvas.tsx:94` `ReactFlow`, `right-sidebar.tsx:85` `Palette`, `step-node.tsx:9` `StepNodeComponent`
