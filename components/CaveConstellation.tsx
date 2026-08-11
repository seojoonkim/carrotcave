import Link from 'next/link';
import type { OntologyEdge, OntologySubgraph, SubgraphNode } from '@/lib/ontology/types';

export type CaveConstellationNode = SubgraphNode;
export type CaveConstellationRelationship = OntologyEdge;

const RELATIONSHIP_LABELS: Record<OntologyEdge['type'], string> = {
  DEEPENS: '더 깊어짐',
  CHALLENGES: '균열을 냄',
  APPLIES: '현실이 됨',
  REFRAMES: '다른 세계로 옮김',
  RESONATES: '멀리 공명함',
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
          return (
            <li
              key={`${relationship.from}:${relationship.to}:${relationship.type}`}
              className="cave-constellation__recommendation"
              data-relationship-type={relationship.type}
            >
              <article>
                <header className="cave-constellation__recommendation-header">
                  <span className="cave-constellation__rank">
                    <span>추천</span> {String(index + 1).padStart(2, '0')}
                  </span>
                  <p className="cave-constellation__relationship-type">
                    <span>관계</span>
                    <strong>{RELATIONSHIP_LABELS[relationship.type]}</strong>
                  </p>
                </header>

                <h3>{target.title}</h3>
                <p className="cave-constellation__relationship-label">{relationship.label}</p>

                <div className="cave-constellation__evidence-pair" role="group" aria-label="추천 근거">
                  <blockquote>
                    <span>이 글에서</span>
                    <p>{relationship.sourceEvidence}</p>
                  </blockquote>
                  <span className="cave-constellation__evidence-arrow" aria-hidden="true">→</span>
                  <blockquote>
                    <span>추천 글에서</span>
                    <p>{relationship.targetEvidence}</p>
                  </blockquote>
                </div>

                <Link className="cave-constellation__navigate" href={hrefForSlug(target.slug)}>
                  이어서 읽기 <span aria-hidden="true">↗</span>
                </Link>
              </article>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
