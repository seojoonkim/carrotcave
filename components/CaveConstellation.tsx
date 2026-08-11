import Link from 'next/link';
import type { OntologyEdge, OntologySubgraph, SubgraphNode } from '@/lib/ontology/types';

export type CaveConstellationNode = SubgraphNode;
export type CaveConstellationRelationship = OntologyEdge;

const RELATIONSHIP_COPY: Record<OntologyEdge['type'], { label: string; reason: string; conclusion: string }> = {
  DEEPENS: { label: '같은 주제를 더 깊게', reason: '지금 읽은 글과 같은 질문을 한 단계 더 깊이 다룹니다.', conclusion: '이 생각을 더 구체적으로 이어갑니다.' },
  CHALLENGES: { label: '다른 관점에서', reason: '지금 읽은 글의 주장에 다른 관점을 더합니다.', conclusion: '이 생각을 다른 관점에서 다시 살펴봅니다.' },
  APPLIES: { label: '생각을 실제로', reason: '지금 읽은 글의 생각이 현실에서 어떻게 작동하는지 보여줍니다.', conclusion: '이 생각이 실제로 작동하는 모습을 보여줍니다.' },
  REFRAMES: { label: '새로운 시선으로', reason: '같은 문제를 전혀 다른 시선에서 다시 바라봅니다.', conclusion: '이 생각을 새로운 시선으로 다시 해석합니다.' },
  RESONATES: { label: '핵심 생각이 비슷한', reason: '주제는 달라도 두 글을 관통하는 핵심 생각이 이어집니다.', conclusion: '다른 주제 안에서 비슷한 생각을 발견하게 합니다.' },
};


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
                  <strong>추천하는 이유</strong>
                  <ol>
                    <li>{copy.reason}</li>
                    <li>지금 읽은 글의 “{relationship.sourceEvidence}”라는 생각에서 이어집니다.</li>
                    <li>추천 글의 “{relationship.targetEvidence}”라는 대목은 {copy.conclusion}</li>
                  </ol>
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
