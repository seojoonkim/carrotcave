import Image from 'next/image';
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

                <div
                  className="cave-constellation__thumbnail"
                  data-has-image={target.imageUrl ? 'true' : 'false'}
                >
                  {target.imageUrl && (
                    <Image
                      src={target.imageUrl}
                      alt=""
                      width={900}
                      height={560}
                      sizes="(max-width: 760px) calc(100vw - 76px), 660px"
                    />
                  )}
                  <div className="cave-constellation__thumbnail-copy">
                    <span className="cave-constellation__thumbnail-category">{target.category}</span>
                    <h3>{target.title}</h3>
                    <p>{target.summary ?? target.title}</p>
                  </div>
                </div>

                <Link className="cave-constellation__navigate" href={hrefForSlug(target.slug)}>
                  이 글 읽기 <span className="cave-constellation__carrot" aria-hidden="true" />
                </Link>
              </article>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
