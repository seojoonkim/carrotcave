import Link from 'next/link';
import type { OntologyEdge, OntologySubgraph, SubgraphNode } from '@/lib/ontology/types';

export type CaveConstellationNode = SubgraphNode;
export type CaveConstellationRelationship = OntologyEdge;

const RELATIONSHIP_COPY: Record<OntologyEdge['type'], { label: string }> = {
  DEEPENS: { label: '같은 주제를 더 깊게' },
  CHALLENGES: { label: '다른 관점에서' },
  APPLIES: { label: '생각을 실제로' },
  REFRAMES: { label: '새로운 시선으로' },
  RESONATES: { label: '핵심 생각이 비슷한' },
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
                      <span className="cave-constellation__connection-points">
                        <span><b>지금 글</b>{points.source}</span>
                        <span><b>추천 글</b>{points.target}</span>
                      </span>
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
