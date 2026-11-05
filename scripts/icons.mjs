import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';

const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const slug=text=>text.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
async function walk(directory){
 const files=[];
 for(const entry of (await fs.readdir(directory,{withFileTypes:true})).sort((a,b)=>a.name<b.name?-1:a.name>b.name?1:0)){
  const filename=path.join(directory,entry.name);
  if(entry.isDirectory())files.push(...await walk(filename));
  else if(entry.isFile()&&entry.name.toLowerCase().endsWith('.svg'))files.push(filename);
 }
 return files;
}

// Public data only. The human-facing site does not render an icon gallery.
export async function publishIconLibrary({root,dist}){
 const files=[],entries=[];
 for(const source of await walk(path.join(root,'Icons'))){
  const originalPath=path.relative(root,source).split(path.sep).join('/');
  const data=await fs.readFile(source),text=data.toString('utf8'),tag=text.match(/<svg\b[^>]*>/)?.[0];
  if(!tag)throw Error(`Missing SVG root: ${originalPath}`);
  const attribute=name=>tag.match(new RegExp(`\\b${name}=["']([^"']+)["']`))?.[1];
  const viewBox=(attribute('viewBox')||'').trim().split(/[\s,]+/).map(Number);
  if(viewBox.length!==4||!viewBox.every(Number.isFinite)||viewBox[2]<=0||viewBox[3]<=0)throw Error(`Invalid SVG viewBox: ${originalPath}`);
  if(/<script\b|<foreignObject\b|\bon\w+\s*=|(?:href|src)\s*=\s*["'](?!#)|url\(\s*["']?(?!#)[^)]/i.test(text))throw Error(`SVG must be self-contained: ${originalPath}`);
  const width=Number(attribute('width')||viewBox[2]),height=Number(attribute('height')||viewBox[3]);
  if(!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0)throw Error(`Invalid SVG size: ${originalPath}`);
  const name=path.basename(source,'.svg').trim(),style=/\/\d+ Linear \//.test(originalPath)?'linear':/\/\d+ Filled \//.test(originalPath)?'filled':'unclassified';
  const nominalSize=Number(originalPath.match(/Icons(\d+)\//)?.[1])||null;
  // A path suffix keeps repeated names distinct and removes spaces from download paths.
  const id=`${nominalSize||width}-${style}-${slug(name)||'icon'}-${hash(originalPath).slice(0,8)}`;
  const file=`svg/${id}.svg`,url=`/icons/${file}`;
  entries.push({id,name,style,nominalSize,width,height,viewBox:viewBox.join(' '),originalPath,file,url,sha256:hash(data),bytes:data.length});
  files.push([`icons/${file}`,data]);
 }
 if(!entries.length)throw Error('Icon library is empty');
 const version=`1-${hash(entries.map(e=>`${e.id}:${e.sha256}`).join('\n')).slice(0,12)}`;
 const counts=Object.fromEntries(['linear','filled','unclassified'].map(style=>[style,entries.filter(e=>e.style===style).length]));
 const index={schemaVersion:1,name:'Cyberport SVG icons',version,count:entries.length,counts,usage:'Original SVG assets for clickable prototypes. file is relative to this index; url is relative to the site origin.',icons:entries};
 const json=JSON.stringify(index,null,2)+'\n';
 const guide=`# Иконки Cyberport для прототипов\n\nВерсия: ${version}. SVG: ${entries.length}.\n\nПолный набор: /icons/index.json. Текстовый каталог: /icons/index.md. Архив: /downloads/cyberport-icons.zip. Все эти файлы также входят в /downloads/cyberport-ui-kit.zip.\n\n## Выбор\n\nИщи по name, style и nominalSize в JSON или по названию в текстовом каталоге. linear — контурные иконки, filled — залитые. unclassified сохраняет отдельные исходные экспорты без придуманного стиля. width, height и viewBox — фактические размеры SVG; nominalSize — папка исходного набора, эти размеры могут отличаться. originalPath сохраняет исходное имя. Не считай повторяющиеся названия одной иконкой: используй уникальный id.\n\n## Получение и применение\n\nВозьми SVG по url относительно домена витрины или скачай архив. file задаёт путь относительно icons/index.json в обоих архивах. SHA-256 и bytes позволяют проверить целостность. Файлы сохранены без изменения рисунка и содержат все свои ресурсы. Пример декоративной иконки: <img src="./icons/svg/ID.svg" width="24" height="24" alt="">, где ID замени на id выбранной иконки. Для смыслового изображения задай alt, а у иконочной кнопки — доступное название. Не перерисовывай готовый значок и не подменяй его похожим из внешней библиотеки.\n\n## Параметры компонентов\n\nПолный набор SVG шире встроенного набора компонентов. cpIcon и параметры фабрик принимают только имена, поддержанные их исходным кодом; не передавай туда произвольный id каталога. Дополнительные SVG используй напрямую через img или внутри своей обёртки прототипа. Этот комплект не описывает API рабочей React-библиотеки во внутреннем Storybook.\n`;
 const markdown=`# Иконки Cyberport\n\nВерсия: ${version}. Всего: ${entries.length}.\n\nИнструкция: /icons/README.md. JSON: /icons/index.json. Архив: /downloads/cyberport-icons.zip.\n\n${entries.map(e=>`- ${e.name} | ${e.style} | набор ${e.nominalSize}, SVG ${e.width}×${e.height} | id: ${e.id} | ${e.url}`).join('\n')}\n`;
 files.push(['icons/index.json',json],['icons/index.md',markdown],['icons/README.md',guide]);
 for(const [relative,data]of files){const target=path.join(dist,relative);await fs.mkdir(path.dirname(target),{recursive:true});await fs.writeFile(target,data);}
 return {version,count:entries.length,counts,entries,files,indexSha256:hash(json)};
}
