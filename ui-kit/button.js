/** Native button factory. CSS and variant data are generated from Button.json. */
import {BUTTON_VARIANTS, BUTTON_LAYOUTS, TEXT_STYLES} from './data.js';
export function createButton({use = 'Primary', type = 'Normal', size = 'Md', state = 'Normal', label = 'Button', leftIcon = true, rightIcon = true, ariaLabel, onClick} = {}) {
  const variants = BUTTON_VARIANTS.filter(v => v.use === use && v.type === type && v.size === size);
  const variant = variants.find(v => v.state === state);
  if (!variant) throw new RangeError(`Unknown button variant: ${use}, ${type}, ${size}, ${state}`);
  const button = document.createElement('button');
  button.type = 'button';
  const hasText = type !== 'Icon';
  const layout = BUTTON_LAYOUTS.find(l => l.size === size && l.text === hasText &&
    l.border === !['Link', 'Blue Link', 'Red Link'].includes(type) &&
    l.leftIcon === (hasText && !!leftIcon) && l.rightIcon === (hasText && !!rightIcon));
  if (!layout) throw new RangeError('Unknown button markup configuration');
  button.className = `cp-button cp-${variant.key} cp-${layout.key}`;
  button.dataset.layoutId = layout.sourceId;
  button.dataset.use = use;
  button.dataset.type = type;
  button.dataset.size = size;
  button.dataset.previewState = state;
  button.dataset.sourceId = variant.sourceId;
  button.disabled = state === 'Disabled';
  const icon = () => {
    const element = document.createElement('span');
    element.className = 'cp-button-icon';
    element.setAttribute('aria-hidden', 'true');
    return element;
  };
  if (type === 'Icon') {
    button.append(icon());
    button.setAttribute('aria-label', ariaLabel || label);
  } else {
    if (leftIcon) button.append(icon());
    const text = document.createElement('span');
    text.className = 'cp-button-label';
    text.textContent = label;
    button.append(text);
    if (rightIcon) button.append(icon());
    if (ariaLabel) button.setAttribute('aria-label', ariaLabel);
  }
  if (onClick) button.addEventListener('click', onClick);
  return button;
}

export function applyTextStyle(element, key) {
  if (!TEXT_STYLES.some(s => s.key === key)) throw new RangeError(`Unknown text style: ${key}`);
  element.classList.add('cp-text', `cp-text-${key}`);
  return element;
}
