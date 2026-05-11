# TODO

План того, что ещё можно сделать по проекту, сгруппированный по
приоритетам. Составлен на основе анализа кода и
[docs/claude_plan.md](claude_plan.md).

## P0 - разное

- [ ] **Chaining** (1.5/8) - manoeuvres must be as chained as
  possible, least amount of time wasted between tricks
  нужно собрать инфу какие трюки чейнятся и построить граф.
  далее можно например давать подсказу. или сделать кнопку add chain.

## P2 - UX и качество

- [ ] **Подсветка затронутых ячеек из ViolationsPanel**: клик по
  нарушению должен скроллить/подсвечивать соответствующие
  `affectedCells`.
- [ ] **i18n-инфраструктура**. Сейчас UI English-only (по AGENTS.md
  это намеренно), но русская/французская локализация была бы
  востребована пилотами. Хотя бы завести `t()` wrapper, чтобы потом
  было проще.

## P3 - техдолг и чистка

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

- [ ] **RunMobile.tsx: сократить количество пропсов** (сейчас 13).
  `distribution`, `quality`, `awtMode` можно читать селекторами
  Zustand напрямую в `FinalScorePanel` и `TrickCellMobile`. Меняет
  re-render surface - нужна проверка отсутствия лишних перерисовок.
- [ ] **Консолидация дублированных иконок**. Inline SVG иконки в
  [MobileFileControls.tsx](../src/components/mobile/MobileFileControls.tsx)
  можно вынести в shared
  [icons.tsx](../src/components/icons.tsx). Нужен pixel-diff,
  потому что геометрия иконок немного отличается.
