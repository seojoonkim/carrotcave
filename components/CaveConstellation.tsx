import Link from 'next/link';
import type { OntologyEdge, OntologySubgraph, SubgraphNode } from '@/lib/ontology/types';

export type CaveConstellationNode = SubgraphNode;
export type CaveConstellationRelationship = OntologyEdge;

const RELATIONSHIP_COPY: Record<OntologyEdge['type'], { label: string; bridge: string }> = {
  DEEPENS: { label: '같은 주제를 더 깊게', bridge: '이 문제를 더 깊이 따라가면,' },
  CHALLENGES: { label: '다른 관점에서', bridge: '반대편에서 보면,' },
  APPLIES: { label: '생각을 실제로', bridge: '이 생각을 실제 장면으로 옮기면,' },
  REFRAMES: { label: '새로운 시선으로', bridge: '시선을 다른 곳으로 돌리면,' },
  RESONATES: { label: '핵심 생각이 비슷한', bridge: '서로 다른 장면이지만,' },
};

const UNSAFE_EVIDENCE = /https?:\/\/|www\.|\[[^\]]+\]\(|\*\*|__|<\/?[a-z][^>]*>|(?:Website|GitHub):/iu;

function cleanEvidence(value?: string): string | null {
  const cleaned = (value ?? '')
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code: string) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&quot;/g, '”')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned || cleaned.length > 240 || UNSAFE_EVIDENCE.test(cleaned)) return null;
  return cleaned;
}

function connectionPoints(relationship: OntologyEdge, source: SubgraphNode, target: SubgraphNode) {
  return {
    source: cleanEvidence(relationship.sourceEvidence) ?? source.summary ?? source.title,
    target: cleanEvidence(relationship.targetEvidence) ?? target.title,
  };
}

function connectionSentence(points: { source: string; target: string }, bridge: string) {
  const source = points.source.replace(/[.!?。！？]+$/u, '');
  return `${source}. ${bridge} ${points.target}`;
}

export interface CaveConstellationProps {
  subgraph: OntologySubgraph;
  hrefForSlug?: (slug: string) => string;
  className?: string;
}

export default function CaveConstellation({
  subgraph,
  hrefForSlug = (slug) => `/posts/${slug}`,
  className = '',
}: CaveConstellationProps) {
  const byId = new Map(subgraph.nodes.map((node) => [node.slug, node]));
  const recommendations = subgraph.edges
    .filter((edge) => edge.from === subgraph.center.slug && byId.has(edge.to))
    .slice(0, 3);

  return (
    <section
      className={`cave-constellation cave-constellation--reduced-motion-ready ${className}`.trim()}
      aria-label="이어 읽을 글 추천"
    >
      <ol className="cave-constellation__recommendations">
        {recommendations.map((relationship, index) => {
          const target = byId.get(relationship.to)!;
          const copy = RELATIONSHIP_COPY[relationship.type];
          const points = connectionPoints(relationship, subgraph.center, target);
          return (
            <li
              key={`${relationship.from}:${relationship.to}:${relationship.type}`}
              className="cave-constellation__recommendation"
              data-relationship-type={relationship.type}
            >
              <article>
                <header className="cave-constellation__recommendation-header">
                  <span className="cave-constellation__rank">
                    <span>{index + 1}순위</span>
                  </span>
                  <strong className="cave-constellation__relationship-type">{copy.label}</strong>
                </header>

                <h3>{target.title}</h3>
                <div className="cave-constellation__why">
                  <ul>
                    <li><strong>이 글의 내용</strong><span>{target.summary ?? relationship.targetEvidence}</span></li>
                    <li>
                      <strong>이어지는 지점</strong>
                      <span>{connectionSentence(points, copy.bridge)}</span>
                    </li>
                  </ul>
                </div>

                <Link className="cave-constellation__navigate" href={hrefForSlug(target.slug)}>
                  이 글 읽기 <span aria-hidden="true">→</span>
                </Link>
              </article>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
