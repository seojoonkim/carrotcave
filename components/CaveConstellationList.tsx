'use client';

import type { CaveConstellationNode, CaveConstellationRelationship } from './CaveConstellation';
import { CAVE_RELATIONSHIP_LABELS } from './CaveConstellationEvidence';

interface CaveConstellationListProps {
  id: string;
  hidden: boolean;
  currentId: string;
  nodes: CaveConstellationNode[];
  relationships: CaveConstellationRelationship[];
  selectedNodeId: string | null;
  onSelect: (nodeId: string) => void;
}

export default function CaveConstellationList({
  id,
  hidden,
  currentId,
  nodes,
  relationships,
  selectedNodeId,
  onSelect,
}: CaveConstellationListProps) {
  const byId = new Map(nodes.map((node) => [node.slug, node]));

  return (
    <section id={id} className="cave-constellation__linear-list" hidden={hidden} aria-label="온톨로지 관계 목록">
      <h3>관계 목록</h3>
      <ol>
        {relationships.map((relationship) => {
          const source = byId.get(relationship.from);
          const target = byId.get(relationship.to);
          if (!source || !target) return null;
          const related = relationship.to === currentId ? source : target;
          return (
            <li key={`${relationship.from}:${relationship.to}:${relationship.type}`} data-relationship-type={relationship.type}>
              <button
                type="button"
                className="cave-constellation__list-control"
                aria-pressed={selectedNodeId === related.slug}
                onClick={() => onSelect(related.slug)}
              >
                <strong>{related.title}</strong>
                <span>{CAVE_RELATIONSHIP_LABELS[relationship.type]}</span>
                <span>{source.title} → {target.title}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
