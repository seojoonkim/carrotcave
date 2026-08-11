'use client';

import { useEffect, useState, type KeyboardEvent } from 'react';
import type { CaveConstellationNode, CaveConstellationRelationship } from './CaveConstellation';
import { CAVE_RELATIONSHIP_LABELS } from './CaveConstellationEvidence';

const WIDTH = 800;
const HEIGHT = 480;
const CENTER = { x: WIDTH / 2, y: HEIGHT / 2 };
const MOBILE_WIDTH = 390;
const MOBILE_HEIGHT = 620;
const MOBILE_CENTER = { x: MOBILE_WIDTH / 2, y: 300 };

/** The archive's four actual categories form stable cardinal cave passages. */
export const AXIS_ANGLES: Record<string, number> = {
  '🐇 탐험': -90,
  '🛠️ 빌딩': 0,
  '✍️ 낙서': 90,
  '📖 소설': 180,
};
export const HOP_RADII = { 0: 0, 1: 116, 2: 198 } as const;
const FAN_STEP = 32;

const TYPE_DASH: Record<CaveConstellationRelationship['type'], string> = {
  DEEPENS: 'none',
  CHALLENGES: '12 5',
  APPLIES: '3 5',
  REFRAMES: '16 4 3 4',
  RESONATES: '2 3',
};

export interface PositionedNode extends CaveConstellationNode {
  x: number;
  y: number;
  axisSlot: number;
  axisCount: number;
  hopRadius: number;
}

export function positionNode(
  node: CaveConstellationNode,
  axisSlot = 0,
  axisCount = 1,
): PositionedNode {
  if (node.hop === 0) {
    return { ...node, ...CENTER, axisSlot: 0, axisCount: 1, hopRadius: 0 };
  }
  const axisIndex = Object.keys(AXIS_ANGLES).indexOf(node.category);
  const fallbackAngle = axisIndex >= 0 ? axisIndex * 90 - 90 : -90;
  const centeredSlot = axisSlot - (axisCount - 1) / 2;
  const angle = ((AXIS_ANGLES[node.category] ?? fallbackAngle) + centeredSlot * FAN_STEP) * (Math.PI / 180);
  const radius = HOP_RADII[node.hop === 2 ? 2 : 1];
  return {
    ...node,
    axisSlot,
    axisCount,
    hopRadius: radius,
    x: Math.round(CENTER.x + Math.cos(angle) * radius),
    y: Math.round(CENTER.y + Math.sin(angle) * radius),
  };
}

interface CaveConstellationGraphProps {
  nodes: CaveConstellationNode[];
  relationships: CaveConstellationRelationship[];
  selectedNodeId: string | null;
  selectedRelationship?: CaveConstellationRelationship;
  onSelect: (nodeId: string) => void;
}

function edgeKey(relationship: CaveConstellationRelationship) {
  return `${relationship.from}:${relationship.to}:${relationship.type}`;
}

export default function CaveConstellationGraph({
  nodes,
  relationships,
  selectedNodeId,
  selectedRelationship,
  onSelect,
}: CaveConstellationGraphProps) {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const query = window.matchMedia('(max-width: 600px)');
    const update = () => setMobile(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  const slots = new Map<string, { slot: number; count: number }>();
  for (const category of Object.keys(AXIS_ANGLES)) {
    for (const hop of [1, 2] as const) {
      const axisNodes = nodes
        .filter((node) => node.hop === hop && node.category === category)
        .sort((a, b) => a.slug.localeCompare(b.slug));
      axisNodes.forEach((node, slot) => slots.set(node.slug, { slot, count: axisNodes.length }));
    }
  }
  // Unknown legacy categories still get deterministic local slots rather than a global-index fan.
  const unknownCategories = [...new Set(nodes.filter((node) => node.hop !== 0 && !(node.category in AXIS_ANGLES)).map((node) => node.category))];
  unknownCategories.forEach((category) => {
    const axisNodes = nodes.filter((node) => node.category === category).sort((a, b) => a.slug.localeCompare(b.slug));
    axisNodes.forEach((node, slot) => slots.set(node.slug, { slot, count: axisNodes.length }));
  });
  const positioned = nodes.map((node) => {
    const axis = slots.get(node.slug);
    const desktop = positionNode(node, axis?.slot, axis?.count);
    if (!mobile) return desktop;
    if (node.hop === 0) return { ...desktop, ...MOBILE_CENTER };
    const ring = nodes
      .filter((candidate) => candidate.hop === node.hop)
      .sort((a, b) => a.slug.localeCompare(b.slug));
    const ringIndex = ring.findIndex((candidate) => candidate.slug === node.slug);
    const angle = ((ringIndex / ring.length) * 360 + (node.hop === 2 ? 30 : 0) - 90) * (Math.PI / 180);
    const radiusX = node.hop === 1 ? 100 : 155;
    const radiusY = node.hop === 1 ? 135 : 235;
    return {
      ...desktop,
      x: Math.round(MOBILE_CENTER.x + Math.cos(angle) * radiusX),
      y: Math.round(MOBILE_CENTER.y + Math.sin(angle) * radiusY),
    };
  });
  const byId = new Map(positioned.map((node) => [node.slug, node]));
  const selectedEdgeKey = selectedRelationship ? edgeKey(selectedRelationship) : null;
  const connectedIds = new Set(selectedRelationship ? [selectedRelationship.from, selectedRelationship.to] : []);

  const activate = (event: KeyboardEvent<HTMLButtonElement>, nodeId: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect(nodeId);
    }
  };

  return (
    <svg
      className="cave-constellation__svg cave-constellation__motion"
      viewBox={mobile ? `0 0 ${MOBILE_WIDTH} ${MOBILE_HEIGHT}` : `0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-labelledby="cave-constellation-title cave-constellation-description"
      data-has-selection={selectedNodeId ? 'true' : 'false'}
    >
      <title id="cave-constellation-title">현재 글을 중심으로 한 온톨로지 관계도</title>
      <desc id="cave-constellation-description">
        동심원은 첫 번째와 두 번째 관계 거리를, 빛나는 광맥은 글 사이의 관계를 나타냅니다.
      </desc>

      <g className="cave-constellation__limestone-rings" aria-hidden="true">
        <ellipse className="cave-constellation__limestone-ring" cx={mobile ? MOBILE_CENTER.x : CENTER.x} cy={mobile ? MOBILE_CENTER.y : CENTER.y} rx={mobile ? 91 : 116} ry={mobile ? 142 : 116} fill="none" strokeDasharray="7 11 2 8" />
        <ellipse className="cave-constellation__limestone-ring cave-constellation__limestone-ring--deep" cx={mobile ? MOBILE_CENTER.x : CENTER.x} cy={mobile ? MOBILE_CENTER.y : CENTER.y} rx={mobile ? 154 : 198} ry={mobile ? 242 : 198} fill="none" strokeDasharray="18 9 3 12" />
      </g>

      <g className="cave-constellation__veins" aria-hidden="true">
        {relationships.map((relationship) => {
          const source = byId.get(relationship.from);
          const target = byId.get(relationship.to);
          if (!source || !target) return null;
          const selected = edgeKey(relationship) === selectedEdgeKey;
          const unrelated = Boolean(selectedNodeId && !selected);
          return (
            <line
              key={edgeKey(relationship)}
              className={`cave-constellation__vein cave-constellation__vein--${relationship.type} cave-constellation__motion${selected ? ' is-selected-edge' : ''}${unrelated ? ' is-unrelated' : ''}`}
              data-relationship-type={relationship.type}
              data-selected-edge={selected ? 'true' : 'false'}
              x1={source.x}
              y1={source.y}
              x2={target.x}
              y2={target.y}
              strokeDasharray={TYPE_DASH[relationship.type]}
            />
          );
        })}
      </g>

      <g className="cave-constellation__nodes">
        {positioned.map((node, nodeIndex) => {
          const current = node.hop === 0;
          const selected = selectedNodeId === node.slug;
          const connected = connectedIds.has(node.slug);
          const unrelated = Boolean(selectedNodeId && !connected);
          return (
            <g
              key={node.slug}
              className={`cave-constellation__node cave-constellation__node--${current ? 'current' : 'mineral'}${selected ? ' is-selected' : ''}${connected ? ' is-connected' : ''}${unrelated ? ' is-unrelated' : ''}`}
              data-node-id={node.slug}
              data-axis={node.category}
              data-hop={node.hop}
              data-axis-slot={node.axisSlot}
              data-axis-count={node.axisCount}
              data-hop-radius={node.hopRadius}
              data-connected={connected ? 'true' : 'false'}
              data-x={node.x}
              data-y={node.y}
              transform={`translate(${node.x} ${node.y})`}
            >
              {!current ? (
                <path className="cave-constellation__mineral" d="M 0 -22 L 18 -7 L 13 17 L -11 21 L -20 -3 Z" />
              ) : (
                <circle className="cave-constellation__stone" r="29" />
              )}
              <foreignObject className="cave-constellation__node-label" x="-34" y="-34" width="68" height="68">
                <button
                  type="button"
                  className="cave-constellation__node-control"
                  aria-label={current ? `${node.title}, 현재 글` : `${node.title} 선택`}
                  aria-pressed={selected}
                  onClick={() => onSelect(node.slug)}
                  onKeyDown={(event) => activate(event, node.slug)}
                  disabled={current}
                >
                  <span aria-hidden="true">{current ? '현재' : String(nodeIndex).padStart(2, '0')}</span>
                </button>
              </foreignObject>
            </g>
          );
        })}
      </g>

      <g className="cave-constellation__legend" aria-label="관계 범례">
        {Object.entries(CAVE_RELATIONSHIP_LABELS).map(([type, label], index) => (
          <text key={type} x={(mobile ? 16 : 18) + index * 72} y={mobile ? 602 : 462} data-relationship-type={type}>{label}</text>
        ))}
      </g>
    </svg>
  );
}
