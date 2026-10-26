import {createButton} from './button.js';
import {MENU_DATA} from './button-menu-data.js';

const openButtonMenus = new Set();
let menuId = 0;
document.addEventListener('pointerdown', event => {
  for (const menu of openButtonMenus) if (!menu.element.contains(event.target)) menu.close(false);
});

export function createMenuItem({label = 'Value', value, type = 'No Icon', description, previewHover = false, width, ariaLabel, onSelect} = {}) {
  const data = MENU_DATA.items.find(i => i.type === type && i.description === !!description && i.hover === previewHover);
  if (!data) throw new RangeError('Unknown menu item variant');
  const item = document.createElement('button');
  item.type = 'button';
  item.className = `cp-menu-item cp-${data.key}`;
  item.style.width = (width ?? data.width) + 'px';
  item.dataset.menuItemSourceId = data.sourceId;
  if (ariaLabel) item.setAttribute('aria-label', ariaLabel);
  if (type === 'Icon') {
    const glyph = document.createElement('span');
    glyph.className = 'cp-menu-glyph cp-menu-check';
    glyph.setAttribute('aria-hidden', 'true');
    item.append(glyph);
  }
  const copy = document.createElement('span');
  copy.className = 'cp-menu-item-copy';
  const title = document.createElement('span');
  title.textContent = label;
  copy.append(title);
  if (description) {
    const text = document.createElement('span');
    text.className = 'cp-menu-item-description';
    text.textContent = description;
    copy.append(text);
  }
  item.append(copy);
  if (onSelect) item.addEventListener('click', () => onSelect({value, label}));
  return item;
}

export function createMenuList({title, items = [{label:'Value',value:1},{label:'Value',value:2},{label:'Value',value:3}], onSelect} = {}) {
  const list = document.createElement('div');
  list.className = 'cp-menu-list';
  list.style.width = MENU_DATA.dropdown.columnWidth + 'px';
  list.dataset.menuListSourceId = MENU_DATA.lists.find(l => l.title === !!title).sourceId;
  if (title) {
    const heading = document.createElement('div');
    heading.className = 'cp-menu-list-title';
    heading.textContent = title;
    list.append(heading);
  }
  items.forEach((item, index) => list.append(createMenuItem({...item, width:MENU_DATA.dropdown.columnWidth,
    ariaLabel: item.ariaLabel || `${item.label || 'Value'}, пункт ${index + 1}`, onSelect})));
  return list;
}

export function createMenuDropdown({columns = [[{}]], onSelect} = {}) {
  const dropdown = document.createElement('div');
  dropdown.className = 'cp-menu-dropdown';
  dropdown.dataset.menuDropdownSourceId = MENU_DATA.dropdown.sourceId;
  for (const groups of columns) {
    const column = document.createElement('div');
    column.className = 'cp-menu-column';
    groups.forEach((group, index) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'cp-menu-group';
      if (index) {
        const divider = document.createElement('div');
        divider.className = 'cp-menu-divider';
        divider.setAttribute('role','separator');
        wrapper.append(divider);
      }
      wrapper.append(createMenuList({...group,onSelect}));
      column.append(wrapper);
    });
    dropdown.append(column);
  }
  return dropdown;
}

export function createButtonMenu({size = 'Md', state = 'Normal', label = 'Button', ariaLabel, columns, onSelect} = {}) {
  const source = MENU_DATA.triggers.find(t => t.size === size && t.state === state);
  if (!source) throw new RangeError(`Unknown ButtonMenu variant: ${state}, ${size}`);
  const element = document.createElement('div');
  element.className = 'cp-menu-control';
  element.dataset.size = size;
  element.dataset.buttonMenuSourceId = source.sourceId;
  const trigger = createButton({use:'Secondary',size,state:state === 'Disabled' ? 'Disabled' : 'Normal',label,ariaLabel});
  trigger.classList.add('cp-menu-trigger');
  const glyphs = trigger.querySelectorAll('.cp-button-icon');
  glyphs[0].classList.add('cp-menu-plus');
  glyphs[1].classList.add('cp-menu-down');
  const popup = createMenuDropdown({columns,onSelect: item => {
    api.close(true);
    if (onSelect) onSelect(item);
  }});
  popup.classList.add('cp-menu-popup');
  popup.id = `cp-button-menu-${++menuId}`;
  popup.setAttribute('role','menu');
  popup.setAttribute('aria-label',ariaLabel || label);
  const items = [...popup.querySelectorAll('.cp-menu-item')];
  items.forEach(item => { item.setAttribute('role','menuitem'); item.tabIndex = -1; });
  trigger.setAttribute('aria-haspopup','menu');
  trigger.setAttribute('aria-controls',popup.id);
  trigger.setAttribute('aria-expanded','false');
  element.append(trigger,popup);
  let expanded = false;
  function focusItem(index) {
    if (!items.length) return;
    items.forEach(item => item.tabIndex = -1);
    const target = items[(index + items.length) % items.length];
    target.tabIndex = 0;
    target.focus();
  }
  const api = {element,trigger,popup,
    open(focus = false, last = false) {
      if (trigger.disabled) return;
      expanded = true;
      popup.hidden = false;
      trigger.setAttribute('aria-expanded','true');
      trigger.dataset.previewState = 'Hover';
      glyphs[1].classList.replace('cp-menu-down','cp-menu-up');
      openButtonMenus.add(api);
      if (focus) focusItem(last ? items.length - 1 : 0);
    },
    close(restoreFocus = false) {
      expanded = false;
      popup.hidden = true;
      trigger.setAttribute('aria-expanded','false');
      trigger.dataset.previewState = state === 'Disabled' ? 'Disabled' : 'Normal';
      glyphs[1].classList.replace('cp-menu-up','cp-menu-down');
      openButtonMenus.delete(api);
      if (restoreFocus) trigger.focus();
    },
    destroy() { api.close(); element.remove(); },
  };
  trigger.addEventListener('click', event => expanded ? api.close() : api.open(event.detail === 0));
  trigger.addEventListener('keydown', event => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault(); api.open(true,event.key === 'ArrowUp');
    } else if (event.key === 'Escape') { event.preventDefault(); api.close(); }
  });
  popup.addEventListener('keydown', event => {
    const index = items.indexOf(document.activeElement);
    if (event.key === 'Escape') { event.preventDefault(); api.close(true); }
    else if (['ArrowDown','ArrowUp','Home','End'].includes(event.key)) {
      event.preventDefault();
      focusItem(event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : index + (event.key === 'ArrowDown' ? 1 : -1));
    }
  });
  element.addEventListener('focusout', event => {
    if (event.relatedTarget && !element.contains(event.relatedTarget)) api.close();
  });
  api.close();
  if (state === 'Click') api.open();
  return api;
}
