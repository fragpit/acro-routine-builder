# TODO

План того, что ещё можно сделать по проекту, сгруппированный по
приоритетам. Составлен на основе анализа кода и
[docs/claude_plan.md](claude_plan.md).

## P0 - незакрытые пункты из плана

- [ ] **Mobile-first адаптация конструктора** (фаза 3, пункт 5 плана
  - единственный незакрытый). В [Constructor.tsx](../src/components/Constructor.tsx)
  нет ни одного tailwind breakpoint-префикса. Нужно:
  - Палитра триков -> bottom-sheet/drawer в портретной ориентации.
  - Таблица ранов - горизонтальный скролл, каждый ран во всю ширину.
  - [TrickInfoCard.tsx](../src/components/TrickInfoCard.tsx) - в виде
    bottom-sheet на мобильном, боковой панели на десктопе.
  - Проверить, что drag-and-drop работает пальцем (@dnd-kit
    TouchSensor уже должен быть подключён - проверить в Constructor).
  - Settings (runs/repeat-gap/AWT) сжать в выпадающее меню.

## P1 - функциональные пробелы

- [ ] **Поиск в палитре триков**. В плане упомянут (`phase 1 / trick
  palette: sort + search`), но в [Constructor.tsx](../src/components/Constructor.tsx)
  поиска не видно.
- [ ] **Переключатель направления сортировки** палитры (`sort by
  coefficient with direction toggle` из плана).
- [ ] **Технисити в UI**: посмотреть, что реально показывается внизу
  столбца рана. В плане - TC с формулой из `scoring/technicity.ts`
  и `scoring/bonus.ts`. Если показывается только среднее - заменить
  на полноценную формулу AWT/AWQ.
- [ ] **Search по документации правил** - в плане помечено как "not
  implemented" ([RulesDocs.tsx](../src/components/RulesDocs.tsx)).
  Полезно: правила длинные, навигации по оглавлению мало.
- [ ] **Предупреждения как warning, а не error** для правил из
  раздела 5 (big ear announcement) и 4.2 (13% штраф). Сейчас эти
  секции явно обозначены как scoring-phase warnings, но ни одного
  validator-а с severity `warning` не видно в
  [engine.ts](../src/rules/engine.ts).

## P2 - UX и качество

- [ ] **Undo/redo** в Zustand store - сейчас любое случайное
  удаление трика из ячейки необратимо.
- [ ] **Drag-to-remove / корзина** или ясная кнопка удаления трика
  из ячейки (проверить, есть ли сейчас и насколько очевидна).
- [ ] **Копирование / перенос трика между ранами** через drag
  (не только из палитры).
- [ ] **Подсветка затронутых ячеек из ViolationsPanel**: клик по
  нарушению должен скроллить/подсвечивать соответствующие
  `affectedCells`.
- [ ] **Экспорт в PDF** (печать результата на бумаге для тренера)
  дополнительно к JSON и markdown. Достаточно window.print() +
  нормальный print-CSS.
- [ ] **Share-by-URL**: сериализовать программу в hash-фрагмент
  (base64(JSON)) - удобно делиться программой без файла.
- [ ] **Default side (L/R)** при перетаскивании трика. Сейчас нужно
  после drop отдельно выбирать сторону.
- [ ] **Валидация импорта JSON**: [program-json.ts](../src/io/program-json.ts)
  принимает произвольные JSON - проверить, что при несовпадении
  схемы выдаётся понятное сообщение, а не молчаливый сбой.
- [ ] **i18n-инфраструктура**. Сейчас UI English-only (по CLAUDE.md
  это намеренно), но русская/французская локализация была бы
  востребована пилотами. Хотя бы завести `t()` wrapper, чтобы потом
  было проще.

## P3 - техдолг и чистка

- [ ] **Проверить размер Constructor.tsx (442 строки)**. Логику
  DnD-сенсоров, sensors config и layout стоит вынести в хуки
  (`useProgramDnd`, `useTrickPalette`).
- [ ] **Общий helper для selectors Zustand** - сейчас в каждом
  компоненте свой селектор.
- [ ] **E2E-тесты** (Playwright) на ключевой флоу: drag trick -> see
  violation -> fix -> export. Unit-тесты валидаторов уже есть, но
  интеграции нет.
- [ ] **Accessibility-аудит**: клавиатурная навигация по палитре,
  ARIA для drag-and-drop (dnd-kit даёт hooks, но по коду не видно,
  что они используются).
- [ ] **Lighthouse / bundle-size** пройтись по production-сборке:
  react-markdown + remark-gfm тяжёлые, можно lazy-load документацию
  через React.lazy, чтобы не тащить в initial bundle конструктора.

## Потенциально лишние файлы

Проверил [git ls-files](../) - прямо мусорных файлов нет, всё
tracked. `.DS_Store`, `dist/`, `*.tsbuildinfo` корректно в
[.gitignore](../.gitignore). Однако есть кандидаты на удаление:

- [ ] `docs/sporting_code_aerobatics_2025.pdf`
  (266 KB) - исходный PDF, который уже сконвертирован в
  `sporting_code_aerobatics_2025.md`. Markdown-версия канонична
  (CLAUDE.md запрещает её менять), PDF в репозитории избыточен и
  раздувает клоны.
- [ ] `docs/sporting_code_aerobatics_2025_synchro.md` - synchro out
  of scope по CLAUDE.md. Если синхро не планируется даже в
  обозримом будущем - удалить (или вынести в отдельный `docs/out-of-scope/`).
- [ ] `docs/trick_list.md` - таблица с сайта Acro World Tour,
  пересекается с [trick_rules.md](trick_rules.md) и со страницей
  `/docs/tricks`, генерируемой из [manoeuvres.ts](../src/data/manoeuvres.ts).
  Если не используется как independent reference - удалить.
