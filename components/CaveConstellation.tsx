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

function connectionReason(relationship: OntologyEdge, sourceTitle: string, targetTitle: string): string {
  const type = relationship.type;
  switch (type) {
    case 'DEEPENS':
      return `“${sourceTitle}”에서 던진 질문을 “${targetTitle}”에서 더 깊이 파고듭니다.`;
    case 'CHALLENGES':
      return `“${sourceTitle}”의 관점에 “${targetTitle}”에서 다른 시선을 보탭니다.`;
    case 'APPLIES':
      return `“${sourceTitle}”의 생각이 “${targetTitle}”에서 구체적인 장면으로 이어집니다.`;
    case 'REFRAMES':
      return `“${sourceTitle}”에서 던진 질문을 “${targetTitle}”의 다른 장면으로 옮겨 다시 봅니다.`;
    case 'RESONATES':
      return `“${sourceTitle}”, “${targetTitle}” 두 글은 서로 다른 장면에서 같은 질문을 던집니다.`;
    default: {
      const exhaustive: never = type;
      return exhaustive;
    }
  }
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
                    <li><strong>이어지는 지점</strong><span>{connectionReason(relationship, subgraph.center.title, target.title)}</span></li>
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
