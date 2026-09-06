import dagre from '@dagrejs/dagre';
import type { Edge } from '@xyflow/react';
import type { EmployeeListItem } from '@/features/employees/queries/useEmployees';
import type { OrgCustomNode } from './OrgNode';

const NODE_WIDTH = 244;
const NODE_HEIGHT = 120;

export function getLayoutedElements(
  employees: EmployeeListItem[],
  collapsedIds: Set<string>,
  selectedEmployeeId: string | null,
  onToggleCollapse: (id: string) => void,
  onSelectEmployee: (emp: EmployeeListItem) => void,
): { nodes: OrgCustomNode[]; edges: Edge[] } {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({
    rankdir: 'TB',
    nodesep: 50,
    ranksep: 80,
  });

  // Calculate direct reports counts
  const reportsCountMap = new Map<string, number>();
  employees.forEach((emp) => {
    if (emp.manager_id) {
      reportsCountMap.set(emp.manager_id, (reportsCountMap.get(emp.manager_id) || 0) + 1);
    }
  });

  // Determine hidden employees (descendants of collapsed nodes)
  const hiddenIds = new Set<string>();
  function markDescendantsHidden(managerId: string) {
    employees.forEach((emp) => {
      if (emp.manager_id === managerId) {
        hiddenIds.add(emp.id);
        markDescendantsHidden(emp.id);
      }
    });
  }

  collapsedIds.forEach((collapsedId) => {
    markDescendantsHidden(collapsedId);
  });

  const visibleEmployees = employees.filter((emp) => !hiddenIds.has(emp.id));

  // Add nodes to dagre
  visibleEmployees.forEach((emp) => {
    dagreGraph.setNode(emp.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  // Add edges to dagre
  const edges: Edge[] = [];
  visibleEmployees.forEach((emp) => {
    if (emp.manager_id && !hiddenIds.has(emp.manager_id)) {
      dagreGraph.setEdge(emp.manager_id, emp.id);
      edges.push({
        id: `edge-${emp.manager_id}-${emp.id}`,
        source: emp.manager_id,
        target: emp.id,
        type: 'smoothstep',
        animated: selectedEmployeeId === emp.id || selectedEmployeeId === emp.manager_id,
        style: {
          stroke:
            selectedEmployeeId === emp.id || selectedEmployeeId === emp.manager_id
              ? '#6A3FA0'
              : '#CBD5E1',
          strokeWidth: 2,
        },
      });
    }
  });

  dagre.layout(dagreGraph);

  const nodes: OrgCustomNode[] = visibleEmployees.map((emp) => {
    const nodeWithPosition = dagreGraph.node(emp.id);
    return {
      id: emp.id,
      type: 'orgNode',
      position: {
        x: nodeWithPosition.x - NODE_WIDTH / 2,
        y: nodeWithPosition.y - NODE_HEIGHT / 2,
      },
      data: {
        employee: emp,
        reportsCount: reportsCountMap.get(emp.id) || 0,
        isCollapsed: collapsedIds.has(emp.id),
        onToggleCollapse,
        onSelectEmployee,
        isSelected: selectedEmployeeId === emp.id,
      },
    };
  });

  return { nodes, edges };
}
