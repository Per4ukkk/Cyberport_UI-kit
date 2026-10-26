import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {SITE_ICONS} from './site-icons.mjs';
import {CONTROL_DATA} from '../ui-kit/control-data.js';
const root=path.resolve(import.meta.dirname,'..');
const dist=path.join(root,'dist');
async function walk(dir){const entries=await fs.readdir(dir,{withFileTypes:true});return(await Promise.all(entries.map(e=>e.isDirectory()?walk(path.join(dir,e.name)):path.join(dir,e.name)))).flat();}
const files=await walk(dist),htmlFiles=files.filter(f=>f.endsWith('.html'));
const catalog=JSON.parse(await fs.readFile(path.join(root,'content/catalog.json'),'utf8'));
const provenance=JSON.parse(await fs.readFile(path.join(root,'content/figures.json'),'utf8'));
const expected=catalog.categories.flatMap(c=>c.articles);
assert.equal(new Set(expected).size,20,'20 unique articles');
const pdfs=(await walk(path.join(root,'Описание UI-kit'))).filter(p=>p.endsWith('.pdf'));
assert.deepEqual(new Set(provenance.map(s=>path.join(root,s.source))),new Set(pdfs),'Every source PDF is mapped');
assert.deepEqual(new Set((await fs.readdir(path.join(root,'content/articles'))).map(f=>f.replace(/\.md$/,''))),new Set(expected),'No lost articles');
let links=0,images=0;
for(const file of htmlFiles){const text=await fs.readFile(file,'utf8');const ids=[...text.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size,`Duplicate ids: ${file}`);assert.equal((text.match(/<h1\b/g)||[]).length,1,`One h1: ${file}`);assert(!/\(cid:\d+\)|Cool.Score|напишу правее|Авторская заметка/i.test(text),`Export artifacts: ${file}`);
 for(const m of text.matchAll(/<(a|img)\b[^>]*\b(href|src)="([^"]+)"[^>]*>/g)){
  const url=m[3].replace(/&amp;/g,'&');if(/^(https?:|mailto:)/.test(url))continue;
  const [pathname,fragment]=url.split('#');let target=pathname?path.join(dist,decodeURIComponent(pathname)):file;
  if(pathname?.endsWith('/'))target=path.join(target,'index.html');
  await fs.access(target).catch(()=>{throw Error(`Broken ${url} in ${path.relative(dist,file)}`);});
  if(fragment&&target.endsWith('.html')){const body=await fs.readFile(target,'utf8');assert(body.includes(`id="${decodeURIComponent(fragment)}"`),`Missing anchor ${url} in ${file}`);}
  if(m[1]==='img'){images++;assert(/\balt="[^"]*"/.test(m[0]),`Missing image alt: ${file}`);}else links++;
 }
}
const search=JSON.parse(await fs.readFile(path.join(dist,'search-index.json'),'utf8'));assert.equal(search.length,21);for(const a of search){assert(a.sections.some(s=>s.text.trim()),`Search content: ${a.slug}`);await fs.access(path.join(dist,a.url?`${a.url}/index.html`:`docs/${a.slug}/index.html`));}
// The interactive examples also need their local module, icon and font dependencies.
let assets=0;
for(const file of files.filter(f=>/\.(css|js|html)$/.test(f))){
 const body=await fs.readFile(file,'utf8');
 const expressions=file.endsWith('.css')?[/url\(["']?([^)'"\n]+)["']?\)/g,/@import\s+["']([^"']+)["']/g]:file.endsWith('.js')?[/\bfrom\s+["']([^"']+)["']/g]:[/<(?:script|link)\b[^>]*\b(?:src|href)="([^"]+)"/g];
 for(const regex of expressions)for(const m of body.matchAll(regex)){
  if(/^(data:|https?:|#)/.test(m[1]))continue;
  const target=m[1].startsWith('/')?path.join(dist,decodeURIComponent(m[1])):path.resolve(path.dirname(file),decodeURIComponent(m[1]));
  await fs.access(target).catch(()=>{throw Error(`Missing runtime asset ${m[1]} in ${path.relative(dist,file)}`);});assets++;
 }
}
for(const [name,original] of Object.entries(SITE_ICONS))assert.deepEqual(await fs.readFile(path.join(dist,`assets/icons/${name}.svg`)),await fs.readFile(path.join(root,`Icons/Icons24/24 Linear / ${original}.svg`)),`Original site icon: ${name}`);
const iconCSS=await fs.readFile(path.join(dist,'ui-kit/control-icons.css'),'utf8');
const embedded=new Map([...iconCSS.matchAll(/\.(cp-original-\d+)\{mask-image:url\("data:image\/svg\+xml;base64,([^\"]+)"\)/g)].map(m=>[m[1],Buffer.from(m[2],'base64')]));
for(const [original,key] of Object.entries(CONTROL_DATA.icons))assert.deepEqual(embedded.get(key),await fs.readFile(path.join(root,`Icons/Icons24/${original}.svg`)),`Original component icon: ${original}`);
for(const file of files.filter(f=>f.startsWith(path.join(dist,'ui-kit')+path.sep)&&/\.(js|css)$/.test(f)&&path.basename(f)!=='fonts.css'))assert.deepEqual(await fs.readFile(file),await fs.readFile(path.join(root,'ui-kit',path.basename(file))),`Unmodified library runtime: ${file}`);
assert.deepEqual(await fs.readFile(path.join(dist,'favicon.svg')),await fs.readFile(path.join(root,'Icons/Icons24/24 Linear / Cell.svg')),'Original favicon');
assert.deepEqual(await fs.readFile(path.join(dist,'assets/brand/chat.svg')),await fs.readFile(path.join(root,'Icons/Icons24/24 Linear / Chat.svg')),'Original chat icon');
console.log(`PASS: ${expected.length} articles / ${pdfs.length} PDFs; ${htmlFiles.length} HTML pages; ${links} internal links, ${images} image references and ${assets} runtime references; anchors, alt text, IDs, search index, original icons and unmodified ui-kit runtime.`);
