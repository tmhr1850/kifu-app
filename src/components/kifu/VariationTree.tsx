'use client';

import React, { useEffect, useRef, useState } from 'react';
import { VariationNode, VariationPath } from '@/types/kifu';

interface VariationTreeProps {
  variationTree: VariationNode;
  currentPath: VariationPath;
  onNodeClick: (nodeId: string) => void;
  onDeleteVariation?: (nodeId: string) => void;
  onManageVariation?: (node: VariationNode) => void;
  className?: string;
}

interface TreeNode {
  id: string;
  x: number;
  y: number;
  node: VariationNode;
  parent: TreeNode | null;
  children: TreeNode[];
}

export default function VariationTree({
  variationTree,
  currentPath,
  onNodeClick,
  onDeleteVariation,
  onManageVariation,
  className = ''
}: VariationTreeProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const nodeRadius = 20;
  const horizontalSpacing = 100;
  const verticalSpacing = 60;

  // Convert variation tree to positioned nodes
  const buildTreeLayout = (root: VariationNode): TreeNode => {
    const treeNode: TreeNode = {
      id: root.id,
      x: 0,
      y: 0,
      node: root,
      parent: null,
      children: []
    };

    const positionNodes = (node: TreeNode, x: number, y: number): number => {
      node.x = x;
      node.y = y;

      if (node.node.children.length === 0) {
        return y;
      }

      let currentY = y;
      node.node.children.forEach((childVariation, index) => {
        const childNode: TreeNode = {
          id: childVariation.id,
          x: x + horizontalSpacing,
          y: currentY,
          node: childVariation,
          parent: node,
          children: []
        };
        node.children.push(childNode);

        if (index > 0) {
          currentY += verticalSpacing;
        }

        const lastY = positionNodes(childNode, childNode.x, currentY);
        currentY = lastY;
      });

      // Center parent node vertically between children
      if (node.children.length > 1) {
        const firstChildY = node.children[0].y;
        const lastChildY = node.children[node.children.length - 1].y;
        node.y = (firstChildY + lastChildY) / 2;
      }

      return currentY;
    };

    positionNodes(treeNode, nodeRadius + 10, dimensions.height / 2);
    return treeNode;
  };

  const treeLayout = buildTreeLayout(variationTree);

  // Calculate required dimensions
  useEffect(() => {
    const calculateDimensions = (node: TreeNode, minX = 0, maxX = 0, minY = 0, maxY = 0): { minX: number, maxX: number, minY: number, maxY: number } => {
      minX = Math.min(minX, node.x - nodeRadius);
      maxX = Math.max(maxX, node.x + nodeRadius);
      minY = Math.min(minY, node.y - nodeRadius);
      maxY = Math.max(maxY, node.y + nodeRadius);

      for (const child of node.children) {
        const childBounds = calculateDimensions(child, minX, maxX, minY, maxY);
        minX = childBounds.minX;
        maxX = childBounds.maxX;
        minY = childBounds.minY;
        maxY = childBounds.maxY;
      }

      return { minX, maxX, minY, maxY };
    };

    const bounds = calculateDimensions(treeLayout);
    const padding = 40;
    setDimensions({
      width: Math.max(800, bounds.maxX - bounds.minX + padding * 2),
      height: Math.max(400, bounds.maxY - bounds.minY + padding * 2)
    });
  }, [treeLayout]);

  const renderNode = (node: TreeNode) => {
    const isInCurrentPath = currentPath.includes(node.id);
    const isCurrentNode = currentPath[currentPath.length - 1] === node.id;
    const canDelete = !isInCurrentPath && node.node.moveNumber > 0;

    return (
      <g key={node.id}>
        {/* Draw lines to children */}
        {node.children.map(child => (
          <line
            key={`${node.id}-${child.id}`}
            x1={node.x}
            y1={node.y}
            x2={child.x}
            y2={child.y}
            stroke={child.node.isMainLine ? '#4b5563' : '#9ca3af'}
            strokeWidth={child.node.isMainLine ? 2 : 1}
            strokeDasharray={child.node.isMainLine ? '0' : '5,5'}
          />
        ))}

        {/* Draw node */}
        <g
          onMouseEnter={() => setHoveredNode(node.id)}
          onMouseLeave={() => setHoveredNode(null)}
          onClick={() => onNodeClick(node.id)}
          onContextMenu={(e) => {
            if (onManageVariation && node.node.moveNumber > 0) {
              e.preventDefault();
              onManageVariation(node.node);
            }
          }}
          style={{ cursor: 'pointer' }}
        >
          <circle
            cx={node.x}
            cy={node.y}
            r={nodeRadius}
            fill={isCurrentNode ? '#3b82f6' : isInCurrentPath ? '#60a5fa' : '#e5e7eb'}
            stroke={isInCurrentPath ? '#2563eb' : '#9ca3af'}
            strokeWidth={2}
          />
          
          <text
            x={node.x}
            y={node.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="14"
            fill={isInCurrentPath ? 'white' : '#374151'}
            fontWeight={isCurrentNode ? 'bold' : 'normal'}
          >
            {node.node.moveNumber}
          </text>
        </g>

        {/* Show move info on hover */}
        {hoveredNode === node.id && node.node.move && (
          <g pointerEvents="none">
            <rect
              x={node.x + nodeRadius + 5}
              y={node.y - 15}
              width={100}
              height={30}
              fill="white"
              stroke="#d1d5db"
              strokeWidth={1}
              rx={4}
            />
            <text
              x={node.x + nodeRadius + 10}
              y={node.y}
              fontSize="12"
              fill="#374151"
            >
              {node.node.move.piece}
              {node.node.move.to.col}{node.node.move.to.row + 1}
              {node.node.move.promote ? '成' : ''}
            </text>
          </g>
        )}

        {/* Delete button */}
        {hoveredNode === node.id && canDelete && onDeleteVariation && (
          showDeleteConfirm === node.id ? (
            <g>
              <rect
                x={node.x - 40}
                y={node.y - nodeRadius - 35}
                width={80}
                height={25}
                fill="white"
                stroke="#ef4444"
                strokeWidth={1}
                rx={4}
              />
              <text
                x={node.x}
                y={node.y - nodeRadius - 20}
                textAnchor="middle"
                fontSize="12"
                fill="#ef4444"
              >
                削除しますか？
              </text>
              <text
                x={node.x - 15}
                y={node.y - nodeRadius - 10}
                fontSize="10"
                fill="#059669"
                style={{ cursor: 'pointer' }}
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteVariation(node.id);
                  setShowDeleteConfirm(null);
                }}
              >
                はい
              </text>
              <text
                x={node.x + 10}
                y={node.y - nodeRadius - 10}
                fontSize="10"
                fill="#6b7280"
                style={{ cursor: 'pointer' }}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteConfirm(null);
                }}
              >
                いいえ
              </text>
            </g>
          ) : (
            <g
              onClick={(e) => {
                e.stopPropagation();
                setShowDeleteConfirm(node.id);
              }}
              style={{ cursor: 'pointer' }}
            >
              <circle
                cx={node.x + nodeRadius - 5}
                cy={node.y - nodeRadius + 5}
                r={8}
                fill="#ef4444"
              />
              <text
                x={node.x + nodeRadius - 5}
                y={node.y - nodeRadius + 5}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="12"
                fill="white"
                fontWeight="bold"
              >
                ×
              </text>
            </g>
          )
        )}

        {/* Render children */}
        {node.children.map(child => renderNode(child))}
      </g>
    );
  };

  return (
    <div className={`bg-white border rounded-lg shadow-sm overflow-auto ${className}`}>
      <div className="p-2 border-b bg-gray-50">
        <h3 className="text-sm font-semibold text-gray-700">変化手順</h3>
        <p className="text-xs text-gray-500 mt-1">
          ノードをクリックして手順を切り替え • 太線: 本譜 • 点線: 変化
          {onManageVariation && ' • 右クリックで管理'}
        </p>
      </div>
      <div className="p-2">
        <svg
          ref={svgRef}
          width={dimensions.width}
          height={dimensions.height}
          viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
          style={{ maxWidth: '100%', height: 'auto' }}
        >
          {renderNode(treeLayout)}
        </svg>
      </div>
    </div>
  );
}