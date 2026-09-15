import { useCallback, useSyncExternalStore } from 'react'
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  Controls,
  addEdge,
  ConnectionLineType,
  MiniMap,
} from '@xyflow/react'
import { useTheme } from 'tanstack-theme-kit'
import type { Edge, Connection, ColorMode, NodeTypes } from '@xyflow/react'
import { StepNode } from './step-node'
import type { StepNodeType } from '../nodes/node-registry'
import '@xyflow/react/dist/style.css'

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
  const [nodes, , onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  const mounted = useMounted()
  const { theme } = useTheme()

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges],
  )

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
        <MiniMap />
      </ReactFlow>
    </div>
  )
}
