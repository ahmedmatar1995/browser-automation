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
import type { Node, Edge, Connection, ColorMode } from '@xyflow/react'
import '@xyflow/react/dist/style.css'

const initialNodes: Node[] = [
  {
    id: 'start',
    position: {
      x: 0,
      y: 0,
    },
    data: {
      label: 'Start',
    },
  },
  {
    id: 'open-url',
    position: {
      x: 100,
      y: 100,
    },
    data: {
      label: 'Open URL',
    },
  },
]

const emptySubscribe = () => () => {}

function useMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  )
}

const initialEdges: Edge[] = [
  {
    id: 'e1-2',
    source: 'start',
    target: 'open-url',
  },
]

export function Canvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
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
        className="!bg-card !dark:bg-(--sea-ink)"
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
