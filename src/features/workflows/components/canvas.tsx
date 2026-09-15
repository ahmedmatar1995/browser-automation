import { useSyncExternalStore } from 'react'
import {
  ReactFlow,
  Controls,
  ConnectionLineType,
  MiniMap,
  Panel,
} from '@xyflow/react'
import { useTheme } from 'tanstack-theme-kit'
import type { Edge, ColorMode, NodeTypes } from '@xyflow/react'
import { AvatarStack } from '@liveblocks/react-ui'
import { useLiveblocksFlow, Cursors } from '@liveblocks/react-flow'
import { StepNode } from './step-node'
import type { StepNodeType } from '../nodes/node-registry'

import '@xyflow/react/dist/style.css'
import '@liveblocks/react-ui/styles.css'
import '@liveblocks/react-flow/styles.css'

const initialNodes: StepNodeType[] = [
  {
    id: 'start',
    type: 'step',
    position: {
      x: 0,
      y: 0,
    },
    data: {
      type: 'start',
      kind: 'trigger',
      title: 'Start',
      values: {},
    },
  },
  {
    id: 'open-url',
    type: 'step',
    position: {
      x: 200,
      y: 120,
    },
    data: {
      type: 'open-url',
      kind: 'action',
      title: 'Open URL',
      values: { url: 'https://youtube.com' },
    },
  },
]

const initialEdges: Edge[] = [
  {
    id: 'e1-2',
    source: 'start',
    target: 'open-url',
  },
]

const nodeTypes: NodeTypes = { step: StepNode }

const emptySubscribe = () => () => {}

function useMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  )
}

export function Canvas() {
  const mounted = useMounted()
  const { theme } = useTheme()

  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onDelete } =
    useLiveblocksFlow({
      suspense: true,
      nodes: {
        initial: initialNodes,
      },
      edges: {
        initial: initialEdges,
      },
    })

  const colorMode: ColorMode = mounted
    ? theme === 'dark'
      ? 'dark'
      : 'light'
    : 'light'

  return (
    <div className="size-full">
      <ReactFlow
        className="bg-card"
        nodeTypes={nodeTypes}
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        maxZoom={1}
        fitView
        onConnect={onConnect}
        onDelete={onDelete}
        colorMode={colorMode}
        connectionLineType={ConnectionLineType.SmoothStep}
        connectionLineStyle={{ stroke: 'var(--border)' }}
        defaultEdgeOptions={{
          type: 'smoothstep',
          style: { stroke: 'var(--border)' },
        }}
        style={
          {
            '--xy-background-color': 'var(--background)',
            '--xy-edge-stroke-width': 2,
            '--xy-connectionline-stroke-width': 2,
          } as React.CSSProperties
        }
      >
        <Controls />
        <Cursors />
        <MiniMap />
        <Panel position="top-right">
          <AvatarStack />
        </Panel>
      </ReactFlow>
    </div>
  )
}
