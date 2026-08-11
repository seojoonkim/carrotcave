import { readFileSync, writeFileSync } from 'node:fs';
import { posts } from '../data/posts.ts';
const root=new URL('../data/ontology/',import.meta.url);
const json=(name)=>JSON.parse(readFileSync(new URL(name,root),'utf8'));
const annotations=json('posts.json'), edges=json('edges.json'), overrides=json('overrides.json');
const sortedEdges=[...edges].sort((a,b)=>a.from.localeCompare(b.from)||b.strength-a.strength||a.to.localeCompare(b.to));
const outgoing=Object.fromEntries(posts.map((post)=>[post.slug,[]]));
sortedEdges.forEach((edge,index)=>{ if(edge.status==='approved'&&outgoing[edge.from]) outgoing[edge.from].push(index); });
const index={version:1,generatedFrom:'posts.json+edges.json+overrides.json',nodes:Object.fromEntries([...posts].sort((a,b)=>a.slug.localeCompare(b.slug)).map((post)=>[post.slug,{slug:post.slug,title:post.title,category:post.category,primaryTopics:annotations[post.slug]?.primaryTopics??[],reviewStatus:annotations[post.slug]?.reviewStatus??'suggested'}])),edges:sortedEdges,outgoing,overrides:{pin:overrides.pin??{},block:overrides.block??[],deprecate:overrides.deprecate??[]}};
const output=`${JSON.stringify(index,null,2)}\n`; const path=new URL('index.json',root);
if(process.argv.includes('--check')) { let actual=''; try{actual=readFileSync(path,'utf8')}catch{} if(actual!==output){console.error('ontology index is stale');process.exit(1)} console.log(`ontology index current: nodes=${Object.keys(index.nodes).length} edges=${index.edges.length}`); }
else { writeFileSync(path,output); console.log(`built ontology index: nodes=${Object.keys(index.nodes).length} edges=${index.edges.length}`); }
