// One recipe supplies both the live example and the copyable code.
const commonProps=[
 ['size','Lg | Md | Sm','Md','Размер из исходной разметки.'],
 ['state','Normal | Disabled | Error | Warning','Normal','Hover, фокус и заполненность поле определяет при взаимодействии.'],
 ['label','string','Value','Подпись поля. Пустая строка скрывает подпись.'],
 ['ariaLabel','string','label','Доступное название, в том числе для поля без подписи.'],
 ['placeholder','string','Value','Подсказка для пустого значения.'],
 ['value','string',"''",'Начальное значение; специальные форматы указаны ниже.'],
 ['width','number | CSS string','250','Ширина в px или CSS-значение.'],
 ['name','string','—','Имя нативного поля.'],
 ['required','boolean','false','Нативная обязательность. Проверку отправки формы выполняет приложение.'],
 ['help','string',"''",'Текст дополнительной подсказки.'],
 ['onInput','(value) => void','—','Вызывается при редактировании.'],
 ['onChange','(value) => void','—','Сообщает об изменении значения.'],
 ['validate','(value) => message','—','Проверка непустого поля при blur.'],
 ['validationDisplay',"'tooltip' | undefined",'undefined','По умолчанию сообщение под полем; tooltip показывает его при наведении или фокусе.'],
];
const fieldMethods=['element — корневой DOM-элемент; input — нативное поле.','value — текущее значение; setValue(value) меняет его без пользовательского callback.','setState(state) — состояние; setValidation(message, kind) — сообщение Error или Warning. Пустой вызов очищает сообщение.'];
const choices=[['size','Md | Sm','Md','Размер Checkbox и Radio; Switch имеет один исходный размер.'],['state','Normal | Disabled | Warning | Error','Normal','Warning и Error доступны Checkbox и Radio; Disabled выключает input и hover.'],['label / description','string','Value / пусто','Подпись и описание входят в область нажатия.'],['checked','boolean','false','Начальная отметка.'],['name / value','string','— / on','Имя группы и значение нативного input.'],['onChange','(checked, value) => void','—','Получает boolean и строковое значение.']];
export const componentDocs={
 button:{factory:'createButton',file:'button.js',result:'DOM-элемент button',props:[['use','Use','Primary','Primary, Secondary, Negative, Alt. secondary, Alt. negative, Alt. additional, Transparent, Additional, Danger.'],['type','Type','Normal','Normal, Link, Blue Link, Red Link, Icon. Сочетания зависят от Use.'],['size','Lg | Md | Sm | Xs','Md','Геометрия учитывает наличие каждой иконки.'],['state','Normal | Hover | Disabled','Normal','Hover задают явно только в проверочных примерах.'],['label','string','Button','Подпись кнопки.'],['leftIcon / rightIcon','boolean','true / true','Отключите оба флага для кнопки без иконок.'],['ariaLabel','string','—','Доступное название иконочной кнопки.'],['onClick','(event) => void','—','Действие задаёт приложение.']],methods:['Фабрика возвращает button напрямую: container.append(button).','Точные допустимые сочетания доступны в BUTTON_VARIANTS из data.js. Неизвестный вариант вызывает RangeError.'],note:'Иконка по умолчанию — оригинальный Heart. Цвета и состояния из Button.json; размеры из всех 36 схем _markupbutton.json.'},
 'menu-button':{factory:'createButtonMenu',file:'button-menu.js',result:'Объект с element, trigger и popup',props:[['size','Lg | Md | Sm | Xs','Md','Размер триггера.'],['state','Normal | Click | Disabled','Normal','Click открывает меню при создании.'],['label / ariaLabel','string','Button / —','Видимая подпись и доступное название.'],['columns','Array<Array<Group>>','одна колонка','Группа: {title?, items}. Пункт: {label, value, description?, type?}.'],['onSelect','(item) => void','—','Выбранное действие; подпись кнопки не заменяется.']],methods:['open(focus, last), close(restoreFocus), destroy().','createMenuItem, createMenuList и createMenuDropdown из того же модуля возвращают DOM-элементы отдельных частей меню.'],note:'Это меню действий. Для выбора значения используйте Select. Клавиатура: Enter/Space, стрелки, Home/End, Escape.'},
 checkbox:{factory:'createCheckbox',file:'choice.js',result:'Объект с element и input',props:choices,methods:['value — boolean checked; setValue(boolean) отправляет change и вызывает onChange.','setState(state) меняет состояние.']},
 radio:{factory:'createRadio',file:'choice.js',result:'Объект с element и input',props:choices,methods:['value — boolean checked; строковое значение доступно в input.value.','setValue(boolean), setState(state).'],note:'У радио одной группы должен быть одинаковый name и разные value.'},
 switch:{factory:'createSwitch',file:'choice.js',result:'Объект с element и input',props:choices.filter(p=>p[0]!=='size').map(p=>p[0]==='state'?['state','Normal | Disabled','Normal','Состояния переключателя.']:p),methods:['value — boolean checked; setValue(boolean) вызывает onChange.','setState(state) меняет состояние.']},
 input:{factory:'createField',file:'field.js',result:'Объект поля',props:[...commonProps,['clearable / clearOnHover','boolean','false / false','Кнопка очистки и её видимость.'],['leftIcon','string','—',"Оригинальная иконка слева, например '24 Linear / Search'."],['icon','string | () => string','—','Оригинальная иконка справа. При очистке её заменяет крестик.'],['disabled / readOnly','boolean','false / false','Нативная недоступность или режим чтения.']],methods:fieldMethods},
 mask:{factory:'createMaskField',file:'mask.js',result:'Объект поля с rawValue',props:[...commonProps,['pattern','string','## ## ######','Символ # — цифра, остальные символы — разделители.'],['prefix','string',"''",'Фиксированный префикс.'],['variableLength','boolean','false','Переменная длина без фиксированных пустых слотов.'],['maxLength','number','число слотов','Количество цифр.'],['normalize','(value) => string','—','Нормализация значения перед обработкой.']],methods:[...fieldMethods,'rawValue — введённые цифры; value — форматированное значение без пустых слотов.'],note:'Поддерживаются цифровые маски. Буквенные и регулярные маски в текущей версии не реализованы.'},
 phone:{factory:'createPhoneField',file:'mask.js',result:'Объект поля с rawValue',props:commonProps,methods:[...fieldMethods,'rawValue — цифры без префикса; value — форматированный телефон.'],note:'Фиксированный +7 и маска ### ###-##-##. При вставке номера из 11 цифр с 7 или 8 код страны нормализуется.'},
 time:{factory:'createTimeField',file:'segmented.js',result:'Объект сегментированного поля',props:[...commonProps,['seconds','boolean','false','Добавляет сегмент секунд.']],methods:fieldMethods,note:"При width: 'auto' ширина подбирается по маске и иконке. Незавершённое значение может содержать пустые слоты."},
 date:{factory:'createDateField',file:'date.js',result:'Объект поля с picker и popup',props:[...commonProps.filter(p=>p[0]!=='value'),['value / min / max','Date | ДД.ММ.ГГГГ | ISO','—','Значение и доступный диапазон.']],methods:[...fieldMethods,'open(), close(), destroy(); picker — отдельный календарь.','createDatePicker({value, min, max, onChange}) возвращает {element, value: Date|null, setValue(date)}.'],note:'DateField возвращает строку, отдельный DatePicker — Date. Выбор одной даты; диапазон из двух дат не реализован.'},
 select:{factory:'createSelect',file:'dropdown.js',result:'Объект поля с popup',props:[...commonProps,['options','Array<string | Option>','[]','Option: {value, label, description?, disabled?, separatorBefore?}.'],['favorites','Array<value>','[]','Избранные значения.']],methods:[...fieldMethods,'open(), close(), setOptions(list), setLoadState(state), destroy().','onChange(value, option) получает выбранное значение и вариант.'],note:'Начальное value должно присутствовать в options. Placeholder не включается в список.'},
 combobox:{factory:'createCombobox',file:'dropdown.js',result:'Объект поля с popup',props:[...commonProps,['options / favorites','Array','[]','Варианты как у Select; favorites содержит value.'],['autocomplete / allowCustom','boolean','false / false','Автодополнение и работа со своим значением.'],['loadOptions','(query) => Promise<Option[]>','—','Загрузчик справочника. Устаревшие ответы игнорируются.'],['onAdd','(label) => void','—','Вызывается после подтверждения нового значения.'],['onRetry','() => void','—','Повтор загрузки.']],methods:[...fieldMethods,'open(), close(), setOptions(list), setLoadState(ready | loading | error), destroy().','onChange(value, option) получает выбранный вариант.'],note:'В текущей реализации Enter выбирает вариант и сохраняет фокус. В старом PDF есть противоречие между основным описанием и таблицей клавиатуры.'},
 'token-input':{factory:'createTokenField',file:'token-field.js',result:'Объект поля с popup',props:[...commonProps.filter(p=>p[0]!=='value'),['options','Array<string | Option>','[]','Справочник вариантов.'],['value','Array<value>','[]','Начальные выбранные значения.'],['allowCustom','boolean','false','Добавление своего значения через поле подтверждения.'],['onAdd / onChange','function','—','onAdd(option); onChange(values).']],methods:[...fieldMethods,'value — массив; setValue(array), open(), close(), destroy(). Метода setOptions у этой фабрики нет.'],note:'Выбранные варианты идут первыми, не поместившиеся токены сворачиваются в +N. Disabled выключает вложенные действия и hover.'},
 textarea:{factory:'createTextArea',file:'textarea.js',result:'Объект поля с editor',props:[...commonProps,['rows / maxRows','number','3 / 12','Начальная и максимальная высота в строках.'],['maxLength','number','—','Включает счётчик, но не запрещает превышение.'],['counterHint','string',"''",'Подсказка счётчика.'],['richText','boolean','false','Форматирование через contenteditable.']],methods:[...fieldMethods,'editor — textarea или contenteditable; html — форматирование richText.','resize() после показа скрытого компонента; destroy() освобождает наблюдателей.'],note:'Rich Text использует contenteditable/execCommand. Перед промышленным использованием редактора нужны отдельные проверки сложных вставок и истории правок.'},
 badge:{factory:'createBadge',file:'badge.js',result:'DOM-элемент',props:[['size','Lg | Md | Sm','Md','Размер баджа из исходного экспорта.'],['color','Color','Gray','Gray, Blue, Green, Red, Orange, White, Light Blue.'],['border / icon','boolean','true / true','Обводка и оригинальная иконка.'],['label','string','Value','Текст.'],['iconName','string','24 Linear / Heart','Имя оригинальной иконки.']],methods:['Фабрика возвращает DOM-элемент напрямую.'],note:'Цвета с обводкой и без неё отличаются. White и Light Blue доступны только с border: true. Неизвестное сочетание вызывает RangeError.'},
};
export function exampleSpec(kind,settings={}){
 const {size='Md',state='Normal',use='Primary',type='Normal',color='Gray'}=settings;
 const base={size,state,width:250};let options;
 if(kind==='button')options={size,state,use,type,label:'Кнопка',ariaLabel:'Кнопка примера',leftIcon:false,rightIcon:false};
 else if(kind==='menu-button')options={size,state,label:'Действия',columns:[[{items:[{label:'Открыть',value:'open'},{label:'Дублировать',value:'copy'},{label:'Переместить',value:'move'}]}]]};
 else if(kind==='badge')options={size,color,label:'Статус',icon:false};
 else if(['checkbox','radio','switch'].includes(kind))options={size,state,label:kind==='checkbox'?'Показывать описание':kind==='switch'?'Уведомления':'Первый вариант',name:kind==='radio'?'example-radio':undefined,checked:kind==='radio'};
 else{
  options={...base};
  if(kind==='input')Object.assign(options,{label:'Название требования',placeholder:'Введите название',clearable:true});
  if(kind==='mask')Object.assign(options,{label:'Номер документа',pattern:'## ## ######',placeholder:'__ __ ______'});
  if(kind==='phone')Object.assign(options,{label:'Телефон',placeholder:'+7 ___ ___-__-__'});
  if(kind==='time')Object.assign(options,{label:'Время',placeholder:'__:__',width:'auto'});
  if(kind==='date')Object.assign(options,{label:'Дата',placeholder:'__.__.____',width:'auto'});
  if(kind==='textarea')Object.assign(options,{label:'Описание',placeholder:'Введите описание',rows:3,maxLength:200});
  if(['select','combobox'].includes(kind))Object.assign(options,{label:'Тип требования',placeholder:'Выберите тип',options:['Требование','Рекомендация','Ограничение']});
  if(kind==='token-input')Object.assign(options,{label:'Категории',placeholder:'Выберите категории',options:['Требование','Рекомендация','Ограничение'],value:['Требование']});
 }
 return {factory:componentDocs[kind].factory,options};
}
export function exampleCode(kind,settings={}){
 return usageCode(kind,exampleSpec(kind,settings).options);
}
export function usageCode(kind,options){
 const spec={factory:componentDocs[kind].factory,options};
 const literal=JSON.stringify(spec.options,null,2).replace(/"([A-Za-z]\w*)":/g,'$1:');
 let code=`import {${spec.factory}} from './ui-kit/index.js';\n\nconst container = document.querySelector('#example');\nconst component = ${spec.factory}(${literal});\n`;
 if(kind==='radio')code+=`const second = createRadio({\n  size: ${JSON.stringify(spec.options.size)},\n  state: ${JSON.stringify(spec.options.state)},\n  label: 'Второй вариант',\n  name: ${JSON.stringify(spec.options.name||'example-radio')},\n});\ncontainer.append(component.element, second.element);`;
 else code+=`container.append(component${['button','badge'].includes(kind)?'':'.element'});`;
 if(['Warning','Error'].includes(spec.options.state)&&!['button','menu-button','checkbox','radio','switch'].includes(kind))code+=`\ncomponent.setValidation(${JSON.stringify(spec.options.state==='Warning'?'Пример предупреждения':'Пример сообщения об ошибке')}, ${JSON.stringify(spec.options.state)});`;
 return code;
}

// Optional markup elements are API capabilities, not a restriction imposed by the demo.
export const componentFeatures={
 button:[{title:'Независимые иконки слева и справа',description:'leftIcon и rightIcon включаются независимо. Все четыре сочетания используют собственную геометрию из markup.',code:`import {createButton} from './ui-kit/index.js';

const container = document.querySelector('#example');
for (const [leftIcon, rightIcon] of [
  [false, false], // Без иконок
  [true, false],  // Только слева
  [false, true],  // Только справа
  [true, true],   // С обеих сторон
]) {
  container.append(createButton({
    label: 'Кнопка', size: 'Md', leftIcon, rightIcon,
  }));
}`}],
 'menu-button':[{title:'Колонки, группы и описания пунктов',description:'Скрытые в исходном экземпляре группы и вторая колонка доступны через columns. type задаёт иконку или отступ под неё.',options:{label:'Действия',columns:[[{title:'Документ',items:[{label:'Открыть',value:'open',type:'Icon',description:'Открыть карточку'},{label:'Скопировать',value:'copy',type:'Icon List'}]},{title:'Дополнительно',items:[{label:'История',value:'history'}]}],[{title:'Связи',items:[{label:'Связанные требования',value:'links'}]}]]}}],
 input:[{title:'Обе иконки и подсказка',description:'leftIcon и icon — отдельные параметры. required добавляет отметку обязательности, help — подсказку у подписи.',options:{label:'Название',leftIcon:'24 Linear / Search',icon:'24 Linear / Heart',help:'Введите название требования',required:true}},
 {title:'Очистка только при наведении и фокусе',description:'Крестик необязателен; его видимость настраивается отдельно.',options:{label:'Название',value:'Требование',clearable:true,clearOnHover:true}}],
 checkbox:[{title:'Описание и выбранное состояние',description:'Дополнительная строка и отметка включаются параметрами description и checked.',options:{label:'Получать уведомления',description:'О новых требованиях',checked:true,required:true}}],
 radio:[{title:'Описание варианта',description:'description включает дополнительный текст. Радиокнопки одной группы используют одинаковый name.',options:{label:'Первый вариант',description:'С дополнительным описанием',name:'review-mode',checked:true}}],
 switch:[{title:'Описание и включённое состояние',description:'Переключатель поддерживает подпись, описание и начальное checked.',options:{label:'Уведомления',description:'Сообщать об изменениях',checked:true}}],
 mask:[{title:'Переменная длина',description:'variableLength отключает фиксированные пустые слоты; maxLength ограничивает число цифр.',options:{label:'ИНН',pattern:'############',variableLength:true,maxLength:12}}],
 phone:[{title:'Начальное значение и нормализация',description:'Принимает полный номер; префикс +7 остаётся фиксированным.',options:{label:'Телефон',value:'89161234567'}}],
 time:[{title:'Секунды',description:'seconds включает третий сегмент, который может быть скрыт в исходном экземпляре.',options:{label:'Время',seconds:true,width:'auto',value:'12:30:45'}}],
 date:[{title:'Границы доступных дат',description:'min и max ограничивают выбор и ввод. Это диапазон доступности, а не выбор двух дат.',options:{label:'Дата',min:'2026-01-01',max:'2026-12-31',value:'2026-10-30',width:'auto'}}],
 select:[{title:'Избранные, описания и недоступные пункты',description:'favorites, description, disabled и separatorBefore задаются данными списка.',options:{label:'Тип',favorites:['requirement'],options:[{value:'requirement',label:'Требование',description:'Обязательное условие'},{value:'recommendation',label:'Рекомендация',separatorBefore:true},{value:'restriction',label:'Ограничение',disabled:true}]}}],
 combobox:[{title:'Автодополнение и своё значение',description:'autocomplete и allowCustom не ограничены вариантом, показанным в верхнем примере.',options:{label:'Тип',autocomplete:true,allowCustom:true,options:['Требование','Рекомендация','Ограничение']}}],
 'token-input':[{title:'Несколько выбранных значений и +N',description:'Передайте массив value. Не поместившиеся токены сворачиваются автоматически, в зависимости от ширины.',options:{label:'Категории',width:250,allowCustom:true,options:['Требование','Рекомендация','Ограничение'],value:['Требование','Рекомендация','Ограничение']}}],
 textarea:[{title:'Счётчик с пояснением',description:'maxLength включает счётчик, counterHint — пояснение к нему.',options:{label:'Комментарий',maxLength:200,counterHint:'Рекомендуемая длина комментария',value:'Пример комментария'}},
 {title:'Форматирование',description:'richText включает редактор и панель при выделении текста. Ограничения этого режима указаны в API.',options:{label:'Комментарий',richText:true,value:'Выделите этот текст для форматирования'}}],
 badge:[{title:'Размер, обводка и иконка',description:'Lg, Md и Sm доступны в библиотеке. border и icon управляются независимо в допустимой цветовой комбинации.',options:{label:'Статус',size:'Lg',color:'Green',border:false,icon:true}}],
};
export function featureCode(kind,feature){return feature.code||usageCode(kind,feature.options);}
