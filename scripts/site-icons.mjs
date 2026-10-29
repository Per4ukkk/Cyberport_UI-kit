import fs from 'node:fs/promises';
import path from 'node:path';

// Every interface glyph is copied from the supplied icon library without path changes.
export const SITE_ICONS={
 search:'Search',menu:'Bars',close:'Cross - Large',external:'Extenal Link',
 reset:'Sync',link:'Link - H',left:'Angle - Left',right:'Angle - Right',
 up:'Angle - Up',down:'Angle - Down',wind:'Wind',favicon:'Cell'
};
export function siteIcon(name){
 if(!SITE_ICONS[name])throw Error(`Unknown site icon: ${name}`);
 return `<span class="site-icon" data-icon="${name}" aria-hidden="true"></span>`;
}
export async function writeSiteIcons(root,dist){
 const target=path.join(dist,'assets/icons');await fs.mkdir(target,{recursive:true});
 for(const [name,original] of Object.entries(SITE_ICONS))await fs.copyFile(path.join(root,`Icons/Icons24/24 Linear / ${original}.svg`),path.join(target,`${name}.svg`));
 await fs.writeFile(path.join(dist,'site-icons.css'),Object.keys(SITE_ICONS).map(name=>`.site-icon[data-icon=${name}]{-webkit-mask-image:url('/assets/icons/${name}.svg');mask-image:url('/assets/icons/${name}.svg');}`).join('\n'));
 await fs.writeFile(path.join(dist,'site-icons.js'),`const names=${JSON.stringify(Object.keys(SITE_ICONS))};\nexport function createSiteIcon(name){if(!names.includes(name))throw Error('Unknown site icon: '+name);const icon=document.createElement('span');icon.className='site-icon';icon.dataset.icon=name;icon.setAttribute('aria-hidden','true');return icon;}\n`);
}
