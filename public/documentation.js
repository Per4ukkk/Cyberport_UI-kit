import {createButton} from '/ui-kit/button.js';

for(const original of document.querySelectorAll('button[data-copy-target]')){
 const prominent=original.classList.contains('action-link');
 const button=createButton({use:prominent?'Primary':'Secondary',size:prominent?'Md':'Sm',label:original.textContent,leftIcon:false,rightIcon:false,ariaLabel:original.getAttribute('aria-label')||original.textContent});
 for(const attr of original.attributes)if(!['class','type'].includes(attr.name))button.setAttribute(attr.name,attr.value);
 button.classList.add(...original.classList);original.replaceWith(button);
}
const status=document.createElement('span');status.className='sr-only';status.setAttribute('role','status');status.setAttribute('aria-live','polite');document.body.append(status);
async function copy(text){
 try{await navigator.clipboard.writeText(text);return true;}catch{
  const field=document.createElement('textarea');field.value=text;field.setAttribute('aria-label','Текст для копирования');field.style.cssText='position:fixed;left:-9999px;top:0';document.body.append(field);const active=document.activeElement;field.select();let success=false;try{success=document.execCommand('copy');}catch{}field.remove();active?.focus({preventScroll:true});return success;
 }
}
for(const button of document.querySelectorAll('[data-copy-target]'))button.addEventListener('click',async()=>{
 const target=document.getElementById(button.dataset.copyTarget);if(!target)return;
 const label=button.querySelector('.cp-button-label')||button,initial=label.textContent;
 const success=await copy(target.textContent);label.textContent=success?'Скопировано':'Не удалось скопировать';status.textContent=success?'Текст скопирован.':'Не удалось скопировать. Выделите текст вручную.';
 setTimeout(()=>{label.textContent=initial;},2200);
});
function tabKeys(tabs,onSelect){for(const tab of tabs)tab.addEventListener('keydown',event=>{const index=tabs.indexOf(tab);let target;if(event.key==='ArrowRight')target=tabs[(index+1)%tabs.length];if(event.key==='ArrowLeft')target=tabs[(index+tabs.length-1)%tabs.length];if(event.key==='Home')target=tabs[0];if(event.key==='End')target=tabs.at(-1);if(target){event.preventDefault();onSelect(target);target.focus();}});}
const componentTabs=[...document.querySelectorAll('[data-component-tab]')];
function selectComponentTab(tab,updateURL=true){const mode=tab.dataset.componentTab;for(const button of componentTabs){const active=button===tab;button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1;document.getElementById(button.getAttribute('aria-controls')).hidden=!active;}if(updateURL){const url=new URL(location.href);url.hash=mode==='code'?'code':'';history.replaceState({},'',url);}}
for(const tab of componentTabs)tab.addEventListener('click',()=>selectComponentTab(tab));
tabKeys(componentTabs,selectComponentTab);
function syncComponentHash(){if(componentTabs.length)selectComponentTab(componentTabs.find(t=>t.dataset.componentTab===(location.hash==='#code'?'code':'description')),false);}
syncComponentHash();window.addEventListener('hashchange',syncComponentHash);
const escape=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function highlight(code){const pattern=/("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\/\/[^\n]*|\b(?:import|from|const|let|true|false|undefined|return|new)\b|\b\d+\b)/g;let html='',pos=0;for(const m of code.matchAll(pattern)){html+=escape(code.slice(pos,m.index));const cls=/^['"]/.test(m[0])?'string':m[0].startsWith('//')?'comment':/^\d/.test(m[0])?'number':'keyword';html+=`<span class="code-${cls}">${escape(m[0])}</span>`;pos=m.index+m[0].length;}return html+escape(code.slice(pos));}
for(const code of document.querySelectorAll('[data-example-code]'))code.innerHTML=highlight(code.textContent);
document.addEventListener('code-updated',event=>{const code=event.target;if(code.matches('[data-example-code]'))code.innerHTML=highlight(code.textContent);});
const templates=document.querySelector('#prompt-templates');
if(templates){
 const prompts=JSON.parse(templates.textContent),tabs=[...document.querySelectorAll('[data-prompt-mode]')],panel=document.querySelector('#prompt-panel'),text=document.querySelector('#ai-prompt');
 function selectPrompt(tab){for(const button of tabs){const active=button===tab;button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1;}panel.setAttribute('aria-labelledby',tab.id);text.textContent=prompts[tab.dataset.promptMode];}
 for(const tab of tabs)tab.addEventListener('click',()=>selectPrompt(tab));tabKeys(tabs,selectPrompt);selectPrompt(tabs[0]);
}
