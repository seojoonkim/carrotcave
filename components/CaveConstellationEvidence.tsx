'use client';

import type { CaveConstellationNode, CaveConstellationRelationship } from './CaveConstellation';

export const CAVE_RELATIONSHIP_LABELS: Record<CaveConstellationRelationship['type'], string> = {
  DEEPENS: '심화',
  CHALLENGES: '도전',
  APPLIES: '적용',
  REFRAMES: '재구성',
  RESONATES: '공명',
};

interface CaveConstellationEvidenceProps {
  node: CaveConstellationNode;
  relationship: CaveConstellationRelationship;
  source: CaveConstellationNode;
  target: CaveConstellationNode;
  onNavigate: () => void;
}

export default function CaveConstellationEvidence({
  node,
  relationship,
  source,
  target,
  onNavigate,
}: CaveConstellationEvidenceProps) {
  return (
    <aside
      className="cave-constellation__evidence"
      aria-live="polite"
      aria-label={`${node.title} 관계 근거`}
    >
      <p className="cave-constellation__relationship-type">
        <span>관계 유형</span>{' '}
        <strong>{CAVE_RELATIONSHIP_LABELS[relationship.type]}</strong>
      </p>
      {relationship.label ? <p className="cave-constellation__relationship-label">{relationship.label}</p> : null}
      <dl className="cave-constellation__evidence-pair">
        <div>
          <dt>출처 · {source.title}</dt>
          <dd>{relationship.sourceEvidence}</dd>
        </div>
        <div>
          <dt>대상 · {target.title}</dt>
          <dd>{relationship.targetEvidence}</dd>
        </div>
      </dl>
      <button type="button" className="cave-constellation__navigate" onClick={onNavigate}>
        “{node.title}” 글로 이동
      </button>
    </aside>
  );
}
