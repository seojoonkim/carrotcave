import Link from 'next/link';
import type { OntologyEdge, OntologySubgraph, SubgraphNode } from '@/lib/ontology/types';

export type CaveConstellationNode = SubgraphNode;
export type CaveConstellationRelationship = OntologyEdge;

const RELATIONSHIP_COPY: Record<OntologyEdge['type'], { label: string; connection: string }> = {
  DEEPENS: { label: '같은 주제를 더 깊게', connection: '추천 글이 이 주제를 더 깊게 이어갑니다.' },
  CHALLENGES: { label: '다른 관점에서', connection: '추천 글이 이 주제를 다른 관점에서 다시 살펴봅니다.' },
  APPLIES: { label: '생각을 실제로', connection: '추천 글이 이 주제의 실제 적용을 보여줍니다.' },
  REFRAMES: { label: '새로운 시선으로', connection: '추천 글이 이 주제를 새로운 맥락에서 해석합니다.' },
  RESONATES: { label: '핵심 생각이 비슷한', connection: '두 글의 핵심 생각이 서로 맞닿아 있습니다.' },
};

const topicLabel = (value: string) => value
  .replace(/^(?:v?\d+(?:\.\d+)*|까지)$/i, '')
  .replace(/(?:은|는|이|가)$/u, '')
  .trim();

function connectionReason(relationship: OntologyEdge, connection: string) {
  const topics = [...new Set((relationship.signalDetails?.titleOverlap ?? []).map(topicLabel).filter((value) => value.length > 1))].slice(0, 3);
  if (topics.length > 0) {
    return `두 글은 ${topics.map((topic) => `‘${topic}’`).join(', ')}라는 주제를 함께 다룹니다. ${connection}`;
  }
  return `지금 글의 “${relationship.sourceEvidence}”라는 생각이 추천 글의 “${relationship.targetEvidence}”라는 내용과 이어집니다.`;
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
                    <li><strong>이어지는 지점</strong><span>{connectionReason(relationship, copy.connection)}</span></li>
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
