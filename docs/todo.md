# TODO

План того, что ещё можно сделать по проекту, сгруппированный по
приоритетам. Составлен на основе анализа кода и
[docs/claude_plan.md](claude_plan.md).

## P0 - разное

- [ ] Нужно понять как участвуют бонусы в общей формуле.
  Похоже они важнее, и     надо сместить акцент в визуализации с tc на бонусы.
- [ ] **Chaining** (1.5/8) - manoeuvres must be as chained as
  possible, least amount of time wasted between tricks
  нужно собрать инфу какие трюки чейнятся и построить граф.
  далее можно например давать подсказу. или сделать кнопку add chain.

## P1 - функциональные пробелы

- [ ] **Поиск в палитре триков**. В плане упомянут (`phase 1 / trick
  palette: sort + search`), но в [Builder.tsx](../src/components/Builder.tsx)
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

- [ ] **Подсветка затронутых ячеек из ViolationsPanel**: клик по
  нарушению должен скроллить/подсвечивать соответствующие
  `affectedCells`.
- [ ] **Экспорт в PDF** (печать результата на бумаге для тренера)
  дополнительно к JSON и markdown. Достаточно window.print() +
  нормальный print-CSS.
- [ ] **Share-by-URL**: сериализовать программу в hash-фрагмент
  (base64(JSON)) - удобно делиться программой без файла.
- [ ] **Валидация импорта JSON**: [program-json.ts](../src/io/program-json.ts)
  принимает произвольные JSON - проверить, что при несовпадении
  схемы выдаётся понятное сообщение, а не молчаливый сбой.
- [ ] **i18n-инфраструктура**. Сейчас UI English-only (по CLAUDE.md
  это намеренно), но русская/французская локализация была бы
  востребована пилотами. Хотя бы завести `t()` wrapper, чтобы потом
  было проще.

## P3 - техдолг и чистка

- [ ] **Проверить размер Builder.tsx (722 строки)**. Логику
  DnD-сенсоров, sensors config и layout стоит вынести в хуки
  (`useProgramDnd`, `useTrickPalette`). Частично начато:
  `useViolationHighlights` и `useChoreoPenaltyPerRun` вынесены в
  [useScoringDerived.ts](../src/hooks/useScoringDerived.ts).
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

## Refactoring

Follow-up рефакторинги, которые намеренно не вошли в PR по code
hygiene. Требуют отдельной визуальной/поведенческой верификации и
либо слишком большую поверхность изменений для одного PR, либо
меняют re-render / pixel-diff.

- [ ] **Декомпозиция Builder.tsx**. Пять inline-субкомпонентов
  (`PaletteCard`, `RunColumn`, `DropZone`, `BonusSlot`, `EmptyDropZone`)
  на ~260 строк. Риск: dnd-kit context coupling и мемоизация. Вынести
  в `src/components/builder/` отдельным PR с визуальной проверкой
  drag-and-drop.
- [ ] **RunMobile.tsx: сократить количество пропсов** (сейчас 13).
  `distribution`, `quality`, `awtMode` можно читать селекторами
  Zustand напрямую в `FinalScorePanel` и `TrickCellMobile`. Меняет
  re-render surface - нужна проверка отсутствия лишних перерисовок.
- [ ] **Типизация dnd-kit drag-data**. Сейчас в
  [Builder.tsx](../src/components/Builder.tsx) четыре каста
  `as { type: 'palette' | 'cell'; ... }`. Завести union type
  `DragData` + guard-функции, убрать касты.
- [ ] **Консолидация дублированных иконок**. Inline SVG иконки в
  [MobileFileControls.tsx](../src/components/mobile/MobileFileControls.tsx)
  можно вынести в shared
  [icons.tsx](../src/components/icons.tsx). Нужен pixel-diff,
  потому что геометрия иконок немного отличается.
