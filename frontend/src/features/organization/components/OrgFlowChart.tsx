import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  type NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import type { EmployeeListItem } from '@/features/employees/queries/useEmployees';
import { OrgNode, type OrgCustomNode } from './OrgNode';
import { getLayoutedElements } from './useOrgLayout';

type OrgFlowChartProps = {
  employees: EmployeeListItem[];
  onSelectEmployee: (emp: EmployeeListItem) => void;
  selectedEmployeeId?: string | null;
  isFocused?: boolean;
};

const nodeTypes: NodeTypes = {
  orgNode: OrgNode,
};

const FlowInner: React.FC<OrgFlowChartProps> = ({
  employees,
  onSelectEmployee,
  selectedEmployeeId = null,
  isFocused = false,
}) => {
  const { fitView } = useReactFlow();
  const getManagerIds = useCallback(() => {
    const reportsByManager = new Set(
      employees.filter((employee) => employee.manager_id).map((employee) => employee.manager_id!),
    );
    return reportsByManager;
  }, [employees]);
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(() =>
    isFocused ? new Set() : getManagerIds(),
  );

  // A full company is not a useful starting canvas. Show leadership first, but open focused results.
  useEffect(() => {
    setCollapsedIds(isFocused ? new Set() : getManagerIds());
  }, [getManagerIds, isFocused]);

  const handleToggleCollapse = useCallback((id: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Compute layouted nodes and edges via Dagre
  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(() => {
    return getLayoutedElements(
      employees,
      collapsedIds,
      selectedEmployeeId,
      handleToggleCollapse,
      onSelectEmployee,
    );
  }, [employees, collapsedIds, selectedEmployeeId, handleToggleCollapse, onSelectEmployee]);

  const [nodes, setNodes, onNodesChange] = useNodesState<OrgCustomNode>(layoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);

  // Re-sync with layout updates
  useEffect(() => {
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [layoutedNodes, layoutedEdges, setNodes, setEdges]);

  // Initial fit view on mount or layout change
  useEffect(() => {
    const timer = setTimeout(() => {
      fitView({ padding: 0.2, minZoom: 0.45, maxZoom: 0.9, duration: 250 });
    }, 50);
    return () => clearTimeout(timer);
  }, [collapsedIds, fitView, layoutedNodes]);

  const handleExpandAll = () => {
    setCollapsedIds(new Set());
  };

  const handleCollapseAll = () => {
    setCollapsedIds(getManagerIds());
  };

  return (
    <section
      aria-label="Organization hierarchy"
      className="relative h-[520px] w-full overflow-hidden rounded-2xl border border-line bg-bg-sunken/30"
    >
      {/* Top Floating Utility Controls */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-1 bg-bg/90 p-1 rounded-lg border border-line backdrop-blur-xs text-xs">
        <button
          onClick={() => fitView({ padding: 0.2, minZoom: 0.45, maxZoom: 0.9, duration: 250 })}
          title="Center visible people"
          className="px-2.5 py-1 font-medium text-ink hover:text-accent rounded-md hover:bg-bg-raised transition-colors cursor-pointer flex items-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
            />
          </svg>
          <span className="hidden sm:inline">Center</span>
        </button>

        <div className="w-px h-4 bg-line" />

        <button
          onClick={handleExpandAll}
          title="Show every person"
          className="px-2 py-1 text-ink-soft hover:text-ink rounded-md hover:bg-bg-raised transition-colors cursor-pointer whitespace-nowrap"
        >
          Show all
        </button>
        <button
          onClick={handleCollapseAll}
          title="Return to leadership overview"
          className="px-2 py-1 text-ink-soft hover:text-ink rounded-md hover:bg-bg-raised transition-colors cursor-pointer whitespace-nowrap"
        >
          Collapse
        </button>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        nodesDraggable={false}
        minZoom={0.45}
        maxZoom={1.8}
        proOptions={{ hideAttribution: true }}
        className="touch-none"
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#CBD5E1" />
        <Controls
          position="bottom-left"
          showInteractive={false}
          className="!bg-bg-raised !border !border-line !shadow-sm !rounded-xl !overflow-hidden !m-4"
        />
        <MiniMap
          position="bottom-right"
          className="!bg-bg-raised !border !border-line !shadow-sm !rounded-xl !overflow-hidden !m-4 hidden sm:block"
          nodeColor="#6A3FA0"
          maskColor="rgba(0, 0, 0, 0.05)"
          zoomable
          pannable
        />
      </ReactFlow>
    </section>
  );
};

export const OrgFlowChart: React.FC<OrgFlowChartProps> = (props) => {
  return (
    <ReactFlowProvider>
      <FlowInner {...props} />
    </ReactFlowProvider>
  );
};
