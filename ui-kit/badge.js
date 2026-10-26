import {CONTROL_DATA} from './control-data.js';
import {cpElement,cpStyle,cpVariant,cpIcon,cpTextNodes} from './control-core.js';
export function createBadge({size='Md',color='Gray',border=true,icon=true,label='Value',iconName='24 Linear / Heart'}={}){
  const v=cpVariant('Badge',{Size:size,Color:color,Border:border?'Yes':'No'}),m=CONTROL_DATA.BadgeMarkup.find(x=>x.p.Size===size&&x.p.Icon===(icon?'Yes':'No')&&x.p.Border===(border?'Yes':'No')).node;
  const element=cpElement('span','cp-badge');element.dataset.component='Badge';element.dataset.sourceId=v.id;element.dataset.markupId=m.id;
  cpStyle(element,{...v.markup.style,...v.label,padding:m.style.padding,height:m.box.height+'px',gap:m.layout.itemSpacing+'px'});
  if(icon){const slot=m.children.find(n=>n.type!=='TEXT');element.append(cpIcon(iconName,slot.box.width));}element.append(cpElement('span','',label));return element;
}
