import type { OntologyEdge, OntologyIndex, OntologySubgraph, SubgraphNode } from './types';

const limits = { mobile: { first: 6, second: 6 }, desktop: { first: 8, second: 12 } } as const;
const edgeKey = (edge: OntologyEdge) => `${edge.from}>${edge.to}`;

/** Selects a stable bounded directed slice. Input order is normalized before ranking. */
export function buildSubgraph(slug: string, index: OntologyIndex, options: {viewport?:'mobile'|'desktop'} = {}): OntologySubgraph | null {
  const centerNode = index.nodes[slug];
  if (!centerNode || centerNode.reviewStatus !== 'approved') return null;
  const cap = limits[options.viewport ?? 'desktop'];
  const blocked = new Set(index.overrides?.block ?? []);
  const deprecated = new Set(index.overrides?.deprecate ?? []);
  const pins = new Set(index.overrides?.pin?.[slug] ?? []);
  const approved = index.edges.filter((edge) => edge.status === 'approved' && !blocked.has(edgeKey(edge)) && !deprecated.has(edgeKey(edge)) && index.nodes[edge.from] && index.nodes[edge.to]);
  const rank = (a:OntologyEdge,b:OntologyEdge) => Number(pins.has(b.to))-Number(pins.has(a.to)) || b.strength-a.strength || a.type.localeCompare(b.type) || a.to.localeCompare(b.to);
  const direct = approved.filter((edge) => edge.from === slug && edge.to !== slug).sort(rank);
  const firstEdges:OntologyEdge[]=[]; const destinations=new Set<string>(); const typeCounts=new Map<string,number>();
  for (const edge of direct) {
    if (firstEdges.length >= cap.first || destinations.has(edge.to)) continue;
    // Prefer type diversity without excluding strong fallback edges.
    if ((typeCounts.get(edge.type) ?? 0) >= 2 && direct.some((candidate) => !destinations.has(candidate.to) && !typeCounts.has(candidate.type))) continue;
    firstEdges.push(edge); destinations.add(edge.to); typeCounts.set(edge.type,(typeCounts.get(edge.type)??0)+1);
  }
  const secondEdges:OntologyEdge[]=[]; const perParent=new Map<string,number>(); const parentLimit=options.viewport === 'mobile' ? 1 : 2;
  for (const parent of firstEdges) {
    const candidates=approved.filter((edge) => edge.from===parent.to && edge.to!==slug && !destinations.has(edge.to)).sort((a,b)=>b.strength-a.strength||a.to.localeCompare(b.to));
    for (const edge of candidates) {
      if (secondEdges.length>=cap.second || (perParent.get(parent.to)??0)>=parentLimit || destinations.has(edge.to)) continue;
      secondEdges.push(edge); destinations.add(edge.to); perParent.set(parent.to,(perParent.get(parent.to)??0)+1);
    }
  }
  const center:SubgraphNode={...centerNode,hop:0};
  const nodes:SubgraphNode[]=[center,...firstEdges.map((edge)=>({...index.nodes[edge.to],hop:1 as const})),...secondEdges.map((edge)=>({...index.nodes[edge.to],hop:2 as const,via:edge.from}))];
  return {center,nodes,edges:[...firstEdges,...secondEdges]};
}

/** Direct, approved recommendations ranked only by editorial recommendation strength. */
export function buildTopRecommendations(slug: string, index: OntologyIndex, limit = 3): OntologySubgraph | null {
  const centerNode = index.nodes[slug];
  if (!centerNode || centerNode.reviewStatus !== 'approved') return null;
  const blocked = new Set(index.overrides?.block ?? []);
  const deprecated = new Set(index.overrides?.deprecate ?? []);
  const edges = (index.outgoing[slug] ?? [])
    .map((edgeIndex) => index.edges[edgeIndex])
    .filter((edge): edge is OntologyEdge => Boolean(edge))
    .filter((edge) => edge.status === 'approved' && !blocked.has(edgeKey(edge)) && !deprecated.has(edgeKey(edge)) && index.nodes[edge.to]?.reviewStatus === 'approved')
    .sort((a, b) => b.strength - a.strength || a.type.localeCompare(b.type) || a.to.localeCompare(b.to))
    .slice(0, limit);
  const center: SubgraphNode = { ...centerNode, hop: 0 };
  const nodes: SubgraphNode[] = [center, ...edges.map((edge) => ({ ...index.nodes[edge.to], hop: 1 as const }))];
  return { center, nodes, edges };
}
