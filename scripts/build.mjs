import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {siteIcon} from './site-icons.mjs';

export const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dist=path.join(root,'dist');
const catalog=JSON.parse(await fs.readFile(path.join(root,'content/catalog.json'),'utf8'));
const sources=JSON.parse(await fs.readFile(path.join(root,'content/figures.json'),'utf8'));
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const slugify=s=>s.toLowerCase().replace(/ё/g,'е').replace(/[^\p{L}\p{N}]+/gu,'-').replace(/^-|-$/g,'');
const inline=s=>esc(s).replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/\[([^\]]+)\]\(([^)]+)\)/g,(_,t,u)=>`<a href="${u}">${t}</a>`);
const articleData=[];
const sourceText=JSON.parse(await fs.readFile(path.join(root,'content/pdf-text-lock.json'),'utf8'));


for(const category of catalog.categories){
 for(const slug of category.articles){
  const md=await fs.readFile(path.join(root,`content/articles/${slug}.md`),'utf8');
  const lock=sourceText.articles.find(a=>a.slug===slug);
  if(!lock||createHash('sha256').update(md).digest('hex')!==lock.markdownSha256)throw Error(`PDF text changed: ${slug}. Restore the approved PDF transcription or update it only with the user's permission.`);
  const title=md.match(/^# (.+)/m)?.[1];
  if(!title)throw Error(`No title: ${slug}`);
  const source=sources.find(s=>s.slug===slug);
  let html='',list=null,paragraph=[],toc=[],sections=[],usedIds=new Set();
  const flush=()=>{if(paragraph.length){html+=`<p>${inline(paragraph.join(' '))}</p>`;paragraph=[];}};
  const closeList=()=>{if(list){html+=`</${list}>`;list=null;}};
  let current={id:'',heading:title,text:[]};sections.push(current);
  for(const line of md.split('\n').slice(1)){
   if(!line.trim()){flush();closeList();continue;}
   const h=line.match(/^(#{2,3}) (.+)$/);
   const fig=line.match(/^!\[(.*)\]\((.+)\)$/);
   const li=line.match(/^(?:- |\d+\. )(.+)$/);
   if(h){flush();closeList();let id=slugify(h[2]);let n=2;while(usedIds.has(id))id=`${slugify(h[2])}-${n++}`;usedIds.add(id);const level=h[1].length;toc.push({id,title:h[2],level});html+=`<h${level} id="${id}" tabindex="-1">${inline(h[2])}<a class="anchor" href="#${id}" aria-label="Ссылка на раздел «${esc(h[2])}»">${siteIcon('link')}</a></h${level}>`;current={id,heading:h[2],text:[]};sections.push(current);}
   else if(fig){flush();closeList();const f=source.figures.find(x=>x.id===fig[2]);if(!f)throw Error(`Unknown figure ${slug}/${fig[2]}`);const url=`/assets/${slug}/${fig[2]}.webp`;html+=`<figure><img src="${url}" width="${f.width}" height="${f.height}" loading="lazy" decoding="async" alt="${esc(fig[1])}"></figure>`;}
   else if(li){flush();const type=/^\d/.test(line)?'ol':'ul';if(list!==type){closeList();list=type;const start=type==='ol'?Number(line.match(/^\d+/)[0]):1;html+=type==='ol'&&start!==1?`<ol start="${start}">`:`<${type}>`;}html+=`<li>${inline(li[1])}</li>`;current.text.push(li[1]);}
   else{closeList();paragraph.push(line.trim());current.text.push(line.trim());}
  }
  flush();closeList();
  const description=md.split('\n').slice(2).find(l=>l.trim()&&!l.startsWith('#')).replace(/\[([^\]]+)\]\([^)]+\)/g,'$1').replace(/\*\*(.+?)\*\*/g,'$1');
  articleData.push({slug,title,description,category,source:source.source,html,toc,sections:sections.map(s=>({...s,text:s.text.join(' ').replace(/\*\*/g,'').replace(/\[([^\]]+)\]\([^)]+\)/g,'$1')})),alias:catalog.aliases[slug]});
 }
}
await import('./render-site.mjs').then(({renderSite})=>renderSite({root,dist,catalog,articleData}));
