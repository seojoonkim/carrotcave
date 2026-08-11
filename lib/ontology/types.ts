export const RELATION_TYPES = ['DEEPENS', 'CHALLENGES', 'APPLIES', 'REFRAMES', 'RESONATES'] as const;
export type RelationType = typeof RELATION_TYPES[number];
export type ReviewStatus = 'suggested' | 'approved' | 'deprecated';
export interface OntologyEdge { from:string; to:string; type:RelationType; strength:number; sourceClaimId:string; sourceEvidence:string; targetEvidence:string; label:string; source:string; signals:string[]; signalDetails?:{titleOverlap?:string[]}; status:ReviewStatus }
export interface OntologyNode { slug:string; title:string; category:string; primaryTopics:string[]; reviewStatus:ReviewStatus }
export interface OntologyIndex { version:number; generatedFrom:string; nodes:Record<string,OntologyNode>; edges:OntologyEdge[]; outgoing:Record<string,number[]>; overrides?:{pin?:Record<string,string[]>;block?:string[];deprecate?:string[]} }
export interface SubgraphNode extends OntologyNode { hop:0|1|2; via?:string; summary?:string }
export interface OntologySubgraph { center:SubgraphNode; nodes:SubgraphNode[]; edges:OntologyEdge[] }
