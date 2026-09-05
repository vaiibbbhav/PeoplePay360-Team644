import React, { useState, useMemo, useCallback } from 'react';
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
};

const nodeTypes: NodeTypes = {
  orgNode: OrgNode,
};

const FlowInner: React.FC<OrgFlowChartProps> = ({
  employees,
  onSelectEmployee,
  selectedEmployeeId = null,
}) => {
  const { fitView } = useReactFlow();
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());

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
      onSelectEmployee
    );
  }, [employees, collapsedIds, selectedEmployeeId, handleToggleCollapse, onSelectEmployee]);

  const [nodes, setNodes, onNodesChange] = useNodesState<OrgCustomNode>(layoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);

  // Re-sync with layout updates
  React.useEffect(() => {
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [layoutedNodes, layoutedEdges, setNodes, setEdges]);

  // Initial fit view on mount or layout change
  React.useEffect(() => {
    const timer = setTimeout(() => {
      fitView({ padding: 0.15, duration: 400 });
    }, 50);
    return () => clearTimeout(timer);
  }, [collapsedIds, fitView]);

  const handleExpandAll = () => {
    setCollapsedIds(new Set());
  };

  const handleCollapseAll = () => {
    const managerIds = new Set<string>();
    employees.forEach((e) => {
      if (e.manager_id) managerIds.add(e.manager_id);
    });
    setCollapsedIds(managerIds);
  };

  return (
    <div className="relative w-full h-[650px] bg-bg-sunken/30 border border-line rounded-2xl overflow-hidden shadow-xs">
      {/* Top Floating Utility Controls */}
      <div className="absolute top-2 sm:top-4 right-2 sm:right-4 z-10 flex items-center gap-1 sm:gap-2 bg-bg-raised/90 backdrop-blur-xs p-1 sm:p-1.5 rounded-xl border border-line shadow-sm text-[11px] sm:text-xs">
        <button
          onClick={() => fitView({ padding: 0.2, duration: 400 })}
          title="Fit view to all nodes"
          className="px-2 sm:px-2.5 py-1 font-medium text-ink hover:text-accent rounded-lg hover:bg-bg transition-colors cursor-pointer flex items-center gap-1 sm:gap-1.5"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
            />
          </svg>
          <span className="hidden sm:inline">Fit View</span>
        </button>

        <div className="w-px h-4 bg-line" />

        <button
          onClick={handleExpandAll}
          title="Expand all branches"
          className="px-1.5 sm:px-2 py-1 text-ink-soft hover:text-ink rounded-lg hover:bg-bg transition-colors cursor-pointer whitespace-nowrap"
        >
          Expand
        </button>
        <button
          onClick={handleCollapseAll}
          title="Collapse all sub-teams"
          className="px-1.5 sm:px-2 py-1 text-ink-soft hover:text-ink rounded-lg hover:bg-bg transition-colors cursor-pointer whitespace-nowrap"
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
        fitView
        minZoom={0.2}
        maxZoom={1.8}
        defaultViewport={{ x: 0, y: 0, zoom: 0.85 }}
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
    </div>
  );
};

export const OrgFlowChart: React.FC<OrgFlowChartProps> = (props) => {
  return (
    <ReactFlowProvider>
      <FlowInner {...props} />
    </ReactFlowProvider>
  );
};
