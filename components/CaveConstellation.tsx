'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import CaveConstellationEvidence from './CaveConstellationEvidence';
import CaveConstellationGraph from './CaveConstellationGraph';
import CaveConstellationList from './CaveConstellationList';
import type { OntologyEdge, OntologySubgraph, SubgraphNode } from '@/lib/ontology/types';

/** View aliases keep the component API directly aligned with the ontology domain. */
export type CaveConstellationNode = SubgraphNode;
export type CaveConstellationRelationship = OntologyEdge;

export interface CaveConstellationProps {
  subgraph: OntologySubgraph;
  desktopSubgraph?: OntologySubgraph;
  hrefForSlug?: (slug: string) => string;
  className?: string;
}

export default function CaveConstellation({
  subgraph,
  desktopSubgraph,
  hrefForSlug = (slug) => `/posts/${slug}`,
  className = '',
}: CaveConstellationProps) {
  const router = useRouter();
  const [desktop, setDesktop] = useState(false);
  useEffect(() => {
    const query = window.matchMedia('(min-width: 601px)');
    const update = () => setDesktop(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  const activeSubgraph = desktop && desktopSubgraph ? desktopSubgraph : subgraph;
  const currentId = activeSubgraph.center.slug;
  const nodes = activeSubgraph.nodes;
  const relationships = activeSubgraph.edges;
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showList, setShowList] = useState(false);
  const byId = useMemo(() => new Map(nodes.map((node) => [node.slug, node])), [nodes]);
  const selectedNode = selectedNodeId ? byId.get(selectedNodeId) ?? null : null;
  const touchingSelected = selectedNode
    ? relationships.filter((relationship) => relationship.from === selectedNode.slug || relationship.to === selectedNode.slug)
    : [];
  // A second-hop mineral's evidence belongs to its first-hop bridge, not an
  // incidental direct/peer edge. Stable sorting makes malformed ties predictable.
  const selectedRelationship = selectedNode
    ? [...touchingSelected].sort((a, b) => {
        const otherNodeFor = (relationship: CaveConstellationRelationship) => byId.get(
          relationship.from === selectedNode.slug ? relationship.to : relationship.from,
        );
        const score = (relationship: CaveConstellationRelationship) => {
          const otherNode = otherNodeFor(relationship);
          if (selectedNode.hop === 2 && otherNode?.hop === 1) return 0;
          if (selectedNode.hop === 1 && otherNode?.slug === currentId) return 0;
          return 1;
        };
        return score(a) - score(b)
          || `${a.from}:${a.to}:${a.type}`.localeCompare(`${b.from}:${b.to}:${b.type}`);
      })[0]
    : undefined;

  useEffect(() => {
    const clearSelection = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedNodeId(null);
    };
    window.addEventListener('keydown', clearSelection);
    return () => window.removeEventListener('keydown', clearSelection);
  }, []);

  const source = selectedRelationship ? byId.get(selectedRelationship.from) : undefined;
  const target = selectedRelationship ? byId.get(selectedRelationship.to) : undefined;

  return (
    <section
      className={`cave-constellation cave-constellation--reduced-motion-ready ${className}`.trim()}
      aria-label="동굴 별자리"
      onKeyDown={(event) => {
        if (event.key === 'Escape') setSelectedNodeId(null);
      }}
    >
      <div className="cave-constellation__toolbar">
        <button
          type="button"
          className="cave-constellation__view-toggle"
          aria-expanded={showList}
          aria-controls="cave-constellation-linear-list"
          onClick={() => setShowList((visible) => !visible)}
        >
          {showList ? '관계도로 보기' : '관계 목록으로 보기'}
        </button>
      </div>

      <div className="cave-constellation__graph-view" hidden={showList}>
        <CaveConstellationGraph
          nodes={nodes}
          relationships={relationships}
          selectedNodeId={selectedNodeId}
          selectedRelationship={selectedRelationship}
          onSelect={(nodeId) => setSelectedNodeId(nodeId === selectedNodeId || nodeId === currentId ? null : nodeId)}
        />
      </div>

      <CaveConstellationList
        id="cave-constellation-linear-list"
        hidden={!showList}
        currentId={currentId}
        nodes={nodes}
        relationships={relationships}
        selectedNodeId={selectedNodeId}
        onSelect={(nodeId) => setSelectedNodeId(nodeId === currentId ? null : nodeId)}
      />

      {selectedNode && selectedRelationship && source && target ? (
        <CaveConstellationEvidence
          node={selectedNode}
          relationship={selectedRelationship}
          source={source}
          target={target}
          onNavigate={() => router.push(hrefForSlug(selectedNode.slug))}
        />
      ) : (
        <p className="cave-constellation__selection-help" aria-live="polite">
          광물을 선택하면 관계 근거를 볼 수 있습니다. 선택 후 이동 버튼을 눌러 글을 여세요.
        </p>
      )}
    </section>
  );
}
