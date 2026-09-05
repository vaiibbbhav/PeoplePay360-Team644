import React, { useEffect, useRef, useState } from 'react';
import type { EmployeeListItem } from '@/features/employees/queries/useEmployees';
import { OrgChartNode } from './OrgChartNode';

type OrgTreeProps = {
  employees: EmployeeListItem[];
  onSelectEmployee: (employee: EmployeeListItem) => void;
  selectedEmployeeId?: string | null;
};

type TreeNode = {
  employee: EmployeeListItem;
  children: TreeNode[];
};

// Breadth beyond which a newly expanded branch is considered "too wide"
// and the tree should auto-pan to keep it centered on the node just expanded.
const AUTO_PAN_BREADTH_THRESHOLD = 3;

export const OrgTree: React.FC<OrgTreeProps> = ({
  employees,
  onSelectEmployee,
  selectedEmployeeId,
}) => {
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());
  const [lastExpandedId, setLastExpandedId] = useState<string | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const childrenBreadthRef = useRef<Map<string, number>>(new Map());

  const toggleCollapse = (id: string) => {
    const isCurrentlyCollapsed = collapsedNodes.has(id);
    setCollapsedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
    // Only pan when the node is being expanded, not collapsed.
    setLastExpandedId(isCurrentlyCollapsed ? id : null);
  };

  // Auto-pan the scroll container to center on the node that was just
  // expanded, but only when its branch breadth got wide enough to overflow
  // what's comfortably visible.
  useEffect(() => {
    if (!lastExpandedId) return;

    const container = scrollContainerRef.current;
    const nodeEl = nodeRefs.current.get(lastExpandedId);
    if (!container || !nodeEl) return;

    const breadth = childrenBreadthRef.current.get(lastExpandedId) || 0;
    if (breadth < AUTO_PAN_BREADTH_THRESHOLD) return;

    const containerRect = container.getBoundingClientRect();
    const nodeRect = nodeEl.getBoundingClientRect();

    const nodeCenter = nodeRect.left + nodeRect.width / 2 - containerRect.left + container.scrollLeft;
    const targetScrollLeft = nodeCenter - container.clientWidth / 2;

    container.scrollTo({
      left: Math.max(0, targetScrollLeft),
      behavior: 'smooth',
    });

    setLastExpandedId(null);
  }, [collapsedNodes, lastExpandedId]);

  // Build tree from employees list
  const buildTree = (): TreeNode[] => {
    const employeeMap = new Map<string, TreeNode>();
    employees.forEach((emp) => {
      employeeMap.set(emp.id, { employee: emp, children: [] });
    });

    const roots: TreeNode[] = [];

    employees.forEach((emp) => {
      const node = employeeMap.get(emp.id)!;
      if (emp.manager_id && employeeMap.has(emp.manager_id) && emp.manager_id !== emp.id) {
        employeeMap.get(emp.manager_id)!.children.push(node);
      } else {
        roots.push(node);
      }
    });

    // Fallback: If no clear root (e.g. cycle or all managers external), pick top node
    if (roots.length === 0 && employees.length > 0) {
      const first = employeeMap.get(employees[0].id)!;
      roots.push(first);
    }

    return roots;
  };

  const roots = buildTree();

  // Recursive Tree Branch Renderer
  const renderBranch = (node: TreeNode) => {
    const isExpanded = !collapsedNodes.has(node.employee.id);
    const hasChildren = node.children.length > 0;

    childrenBreadthRef.current.set(node.employee.id, node.children.length);

    return (
      <div key={node.employee.id} className="flex flex-col items-center">
        {/* Node Card */}
        <div
          ref={(el) => {
            if (el) {
              nodeRefs.current.set(node.employee.id, el);
            } else {
              nodeRefs.current.delete(node.employee.id);
            }
          }}
          className="relative z-10 my-4"
        >
          <OrgChartNode
            employee={node.employee}
            reportsCount={node.children.length}
            isExpanded={isExpanded}
            onToggleExpand={() => toggleCollapse(node.employee.id)}
            onSelect={onSelectEmployee}
            isSelected={selectedEmployeeId === node.employee.id}
          />
        </div>

        {/* Children Branches */}
        {hasChildren && isExpanded && (
          <div className="relative pt-6 flex justify-center">
            {/* Vertical stem from parent down to horizontal rail */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-6 bg-line" />

            {/* Render each child branch, with a rail segment spanning
                from this child's center to its shared edge with its
                neighbor(s) so the connector lines up regardless of how
                many children there are or how wide each subtree is. */}
            {node.children.map((child, index) => (
              <div
                key={child.employee.id}
                className="relative flex flex-col items-center px-4 md:px-6"
              >
                {node.children.length > 1 && (
                  <div
                    className="absolute -top-6 h-px bg-line"
                    style={{
                      left: index === 0 ? '50%' : 0,
                      right: index === node.children.length - 1 ? '50%' : 0,
                    }}
                  />
                )}
                {/* Vertical stem from rail down to child card */}
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-px h-6 bg-line" />
                {renderBranch(child)}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      ref={scrollContainerRef}
      className="w-full overflow-x-auto p-6 md:p-12 bg-bg-sunken/40 border border-line rounded-2xl min-h-[500px] flex justify-center items-start scrollbar-thin"
    >
      {roots.length > 0 ? (
        <div className="flex flex-wrap justify-center gap-16 min-w-max">
          {roots.map((root) => renderBranch(root))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 text-center text-ink-soft">
          <p className="text-xs">No employees found to generate hierarchy tree.</p>
        </div>
      )}
    </div>
  );
};
