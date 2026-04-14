# Plan: Acro Program Constructor

## Context

Нужен веб-сервис для пилотов параглайдинг-акро, чтобы составлять
программу (набор трюков) для соревнований AWT/AWQ. Пилот выбирает
тип соревнований, видит таблицу ранов, перетаскивает трюки из
каталога в раны, а система в реальном времени проверяет программу
на соответствие правилам FAI Sporting Code 2025.

Сервис должен быть максимально простым - без бэкенда, без БД,
только статический фронтенд на GitHub Pages. Должен хорошо
работать на мобильных устройствах в вертикальной ориентации.

Синхро пока не учитываем (CLAUDE.md).

## Страницы приложения

Приложение состоит из нескольких страниц (роутинг через
HashRouter - работает на GitHub Pages без доп настроек):

1. **Главная** (`/`) - краткое описание + кнопка "Open builder" +
   ссылки на документацию:
   - Правила соревнований (FAI Sporting Code)
   - Справочник трюков с ограничениями
2. **Конструктор** (`/builder`) - основной экран. Тип AWT/AWQ
   переключается чекбоксом "AWT mode" прямо в хедере билдера
   (по умолчанию off = AWQ). Структурная разница между AWT и AWQ
   минимальна: только запрет Misty to Misty в AWT (секция 4.4).
   Формула бонуса отличается в скоринге (фаза 3), но структуру
   программы это не меняет
3. **Документация правил** (`/docs/rules`) - онлайн-версия
   [sporting_code_aerobatics_2025.md](sporting_code_aerobatics_2025.md)
   с навигацией
4. **Справочник трюков** (`/docs/tricks`) - страница с трюками,
   их коэффициентами, модификаторами и ограничениями (синтез
   [trick_rules.md](trick_rules.md) + данные из `manoeuvres.ts`)

Это учитывается с первой фазы на уровне роутинга, но наполнение
страниц документации делается в финальной фазе.

**UI на английском** - русские строки в интерфейсе не используем.

## Структура экрана конструктора

3 основные секции:

1. **Список трюков** - отсортирован по коэффициенту, drag-source
2. **Динамические настройки**:
   - Количество ранов (дефолт из типа соревнований)
   - Через сколько ранов можно повторять трюки (по умолчанию
     повторять нельзя вообще)
3. **Поле ограничений** - список сработавших бизнес-правил с
   подсветкой связанных ячеек

## Операции с трюками и модификаторами

- Перетащить трюк из палитры в ячейку рана
- Клик по ячейке с трюком открывает popover со списком доступных
  для этого трюка модификаторов (checkboxes). Список зависит от
  конкретного трюка и учитывает mutual exclusion (например
  Twisted/Devil Twist/Full Twisted взаимоисключающие)
- Модификаторы визуально отображаются на ячейке (мелкие badges)
- Удаление трюка из ячейки убирает все его модификаторы
- Модификатор влияет на расчёт стоимости трюка

## Ответы на открытые вопросы из plan.md

### Кто будет рассчитывать применение правил? JS?

Да, вся бизнес-логика на TypeScript в браузере. Данные
статические (~38 трюков, ~15 правил), вычисления мгновенные.
Бэкенд не нужен.

### Получится ли хостить на GitHub Pages?

Да. Vite билдит в статику, деплоим через GitHub Actions.
Используем `HashRouter` - он работает на Pages из коробки без
доп настроек на сервере.

### Где разместить бизнес-логику?

Отдельный модуль `src/rules/` - чистые TypeScript функции без
React-импортов. Каждое правило - отдельный файл-валидатор.
Тестируемо unit-тестами независимо от UI.

## Стек технологий

| Что              | Выбор                | Почему                                          |
|------------------|----------------------|-------------------------------------------------|
| Framework        | React 18 + TS        | Экосистема DnD, широкая поддержка               |
| Build            | Vite                 | Быстрый, нативный TS, простой деплой на Pages   |
| Стили            | Tailwind CSS v4      | Быстрая разработка, современный вид             |
| Drag & Drop      | @dnd-kit             | Актуальная либа, тач-поддержка, accessible      |
| State            | Zustand              | Легковесный, селективные подписки               |
| Тесты            | Vitest               | Нативная интеграция с Vite                      |
| Dev env          | mise (.mise.toml)    | Изоляция Node.js без глобальной установки       |
| Deploy           | GitHub Actions+Pages | Статика, бесплатно                              |

## Dev-окружение (mise)

Файл `.mise.toml` в корне проекта:

```toml
[tools]
node = "22"
```

При входе в директорию mise автоматически активирует нужную
версию Node. `node_modules/` остаётся локально в проекте
(аналог `.venv` в Python). Добавляем `node_modules/` в
`.gitignore`.

## Структура проекта

```text
src/
├── data/                      # статические справочники
│   ├── manoeuvres.ts          # 38 solo трюков с метаданными
│   ├── bonuses.ts             # типы бонусов
│   └── competition-types.ts   # AWT/AWQ конфигурация
│
├── rules/                     # бизнес-логика (чистый TS, без React)
│   ├── types.ts               # доменные типы
│   ├── engine.ts              # validateProgram() - точка входа
│   └── validators/            # по файлу на каждое правило
│       ├── high-coeff.ts
│       ├── forbidden-connections.ts
│       ├── last-two.ts
│       ├── must-be-first.ts
│       ├── one-per-run.ts
│       ├── incompatible.ts
│       ├── bonus-limits.ts
│       ├── repetition.ts
│       └── awt-specific.ts
│
├── scoring/                   # расчёт очков (фаза 3)
│   ├── technicity.ts
│   └── bonus-calc.ts
│
├── store/
│   └── program-store.ts       # Zustand
│
├── components/
│   ├── App.tsx
│   ├── pages/
│   │   ├── HomePage.tsx       # выбор типа соревнований + ссылки на доки
│   │   ├── BuilderPage.tsx    # конструктор
│   │   ├── RulesDocsPage.tsx  # онлайн правила
│   │   └── TricksDocsPage.tsx # справочник трюков
│   ├── ProgramBoard/
│   │   ├── ProgramBoard.tsx
│   │   ├── RunColumn.tsx
│   │   ├── TrickCell.tsx
│   │   └── RunStats.tsx
│   ├── TrickPalette/
│   │   ├── TrickPalette.tsx
│   │   └── TrickCard.tsx
│   ├── TrickInfoCard.tsx      # детальная инфа о трюке
│   ├── BonusSelector.tsx      # popover с модификаторами
│   └── ViolationsPanel.tsx
│
├── hooks/
│   └── useValidation.ts
│
├── main.tsx
└── index.css
```

## Бизнес-правила для валидации

**Источник истины**: [trick_rules.md](trick_rules.md).
При реализации каждого валидатора обязательно сверяться с этим
файлом. Если FAI обновит правила - меняется только этот файл
и соответствующие валидаторы.

Маппинг валидаторов на секции trick_rules.md:

| Валидатор                  | Секция trick_rules.md                  |
|----------------------------|----------------------------------------|
| `must-be-first`            | 1.1 Must be first                      |
| `last-two`                 | 1.2 Cannot be last two (+flipped)      |
| `forbidden-connections`    | 2. Forbidden connections               |
| `high-coeff`               | 3.1 High coefficient limit (max 2)     |
| `one-per-run-stall-inf`    | 3.2 Stall-to-infinite family           |
| `tumbling-inf-rhythmic`    | 3.3 Max 2 tumbling/inf/rhythmic        |
| `incompatible`             | 3.4 X-Chopper/Misty vs stall-to-inf    |
| `bonus-limits`             | 3.5 Bonus limits (5/3/2)               |
| `no-side-once`             | 3.6 MacFly/MistyFly/HeliFly/SatFly     |
| `repetition`               | 4.1-4.3 Per-competition repetition     |
| `awt-misty-to-misty`       | 4.4 AWT-specific                       |

Секции 4.2 (13% penalty), 5 (big ear announcement) - для фазы
скоринга / warnings, не для валидаторов структуры программы.

## Информация о трюке для пользователя

При клике на трюк в палитре (или на ячейку с трюком в ране)
пользователь должен видеть детальную информацию в том же
формате, что и в [sporting_code_aerobatics_2025.md](sporting_code_aerobatics_2025.md):

```markdown
#### 1.1.1 Tail Slide - coeff: 1.15

- Stabilised backward flying with open glider
- Minimum: 5 seconds
- Criteria: maintenance of the shape, stability, perceptible
  backwards flight, control of direction, duration,
  exit or connection
- Twisted Tail Slide: twisted all the way from entry to exit
- Free connection
- Repetition allowed (see 3.3.4)
- Bonuses: Twisted 6%, Twisted Exit 4.5%
```

**Последствия для модели данных**: в `manoeuvres.ts` помимо
структурированных полей (coefficient, groups, forbiddenConnectionTo
и т.д.) хранится `description` - массив строк (bullet points)
из оригинальной документации. Таким образом один источник данных
и для валидаторов, и для отображения пользователю, и для
генерации страницы справочника трюков.

UI: всплывающая карточка при hover или отдельная панель с
деталями при клике. На мобильном - bottom sheet.

## Ключевые доменные типы

```typescript
interface Manoeuvre {
  id: string;
  name: string;
  coefficient: number;
  sectionNumber: string;       // "1.1.1" для ссылки на FAI code
  description: string[];       // bullet points из sporting_code
  forbiddenConnectionTo: string[];
  cannotBeLastTwo: boolean;
  mustBeFirst: boolean;
  repetitionAllowed: boolean;
  noSide: boolean;
  availableBonuses: BonusDefinition[];
  mutualExclusions: string[][];
  groups: string[];            // 'stall_to_infinite', 'tumbling_related'
  awtExcluded?: boolean;       // запрещён когда включён AWT mode
}

interface PlacedTrick {
  id: string;
  manoeuvreId: string;
  side: 'L' | 'R' | null;
  selectedBonuses: string[];
}

interface Run {
  id: string;
  tricks: PlacedTrick[];
}

interface Program {
  awtMode: boolean;            // вместо competitionType - булевый флаг
  runs: Run[];
  repeatAfterRuns: number;
}

interface Violation {
  ruleId: string;
  description: string;
  severity: 'error' | 'warning';
  affectedCells: { runIndex: number; trickIndex: number; }[];
}
```

## Rules engine

Чистая функция: `validateProgram(program) => Violation[]`.
Каждый валидатор - отдельная чистая функция. Engine
вызывает все валидаторы и объединяет результаты.

```typescript
const validators: Validator[] = [
  validateHighCoeff, validateForbiddenConnections,
  validateLastTwo, validateMustBeFirst, ...
];

function validateProgram(program: Program): Violation[] {
  return validators.flatMap(v => v(program, manoeuvreMap));
}
```

Валидация запускается синхронно при каждом изменении стейта
(данных мало - мгновенно).

## Адаптивность (mobile-first)

UI должен корректно работать в вертикальной ориентации на
телефонах. План:

- На десктопе - 2 колонки (палитра трюков / таблица ранов) +
  панель настроек сверху + панель нарушений снизу
- На мобильном (вертикаль) - палитра трюков сворачивается в
  drawer/bottom-sheet, таблица ранов - основной вид с
  горизонтальным скроллом по ранам, настройки в выпадающем меню
- Drag-and-drop должен работать через touch (@dnd-kit поддерживает
  из коробки через PointerSensor/TouchSensor)
- Tailwind responsive префиксы (sm:, md:, lg:) для переключения
  layout

## UI макет

VIOLATIONS - под таблицей ранов (не на всю ширину экрана).
TRICK PALETTE - боковая колонка на всю высоту экрана.

```text
┌──────────────────────────────────────────────────┐
│  Acro Program Constructor     Rules Tricks  ☀/🌙  │
├───────────┬──────────────────────────────────────┤
│           │ Runs: [3]  [x] AWT mode              │
├───────────┼──────────────────────────────────────┤
│ TRICK     │  RUN 1      │  RUN 2     │  RUN 3   │
│ PALETTE   │ ┌─────────┐ │ ┌────────┐ │          │
│           │ │Cowboy   │ │ │SAT     │ │  Drop    │
│ ┌───────┐ │ │1.90 L ⚡│ │ │1.25 R  │ │  here    │
│ │Stall  │ │ ├─────────┤ │ ├────────┤ │          │
│ │1.60   │ │ │Infinity │ │ │Misty   │ │          │
│ ├───────┤ │ │1.85 R   │ │ │1.65 L  │ │          │
│ │Misty  │ │ ├─────────┤ │ └────────┘ │          │
│ │1.65   │ │ │Tumbling │ │            │          │
│ ├───────┤ │ │1.80 L ⚠ │ │            │          │
│ │...    │ │ └─────────┘ │            │          │
│ │       │ │ TC: 1.85    │ TC: 1.45   │          │
│ │       │ ├─────────────┴────────────┴──────────┤
│ │       │ │ VIOLATIONS                          │
│ │       │ │ ⚠ Run 1: Tumbling не в последних 2  │
│ │       │ │ ⚠ Run 1: >2 трюков с коэфф >= 1.95  │
│ │       │ └─────────────────────────────────────┤
│ search  │                                       │
└─────────┴───────────────────────────────────────┘
```

## Фазы реализации

### Фаза 1 - MVP (локальный запуск)

1. Dev-окружение: `.mise.toml` (node 22), `.gitignore`
2. Scaffolding: Vite + React + TS + Tailwind + dnd-kit + Zustand + Vitest
3. Роутинг (HashRouter): главная, конструктор (`/builder` без параметра)
4. Данные: все 38 solo трюков в `manoeuvres.ts` включая
   `description` (bullet points из sporting_code) и `sectionNumber`
5. Чекбокс "AWT mode" в хедере билдера (по умолчанию off = AWQ)
6. Палитра трюков (сортировка по коэфф с переключением направления, поиск)
7. Карточка детальной информации о трюке (клик/hover на трюк
   в палитре или на ячейке в ране) в формате sporting_code
8. Таблица ранов с drag-and-drop
9. Выбор стороны (L/R) для трюка
10. Основные валидаторы (high-coeff, forbidden-connections,
    last-two, must-be-first, one-per-run, incompatible, awt-misty-to-misty)
11. **Unit-тесты на каждый валидатор** (Vitest)
12. Панель нарушений + подсветка ячеек
13. ESLint flat config
14. Light/dark theme с переключателем в хедере, persist в localStorage

**Статус: фаза 1 завершена.**

В конце фазы: `npm run dev` запускается локально, `npm test`
проходит, приложение работает в браузере. Деплой пока не делаем.

### Фаза 2 - полные правила + модификаторы

1. UI выбора модификаторов (twisted/reverse/flip + mutual
   exclusions). Вместо popover - боковая панель `TrickInfoCard`
   справа от ранов: открывается по клику на ячейку, показывает
   описание + чекбоксы бонусов, дизейблит взаимоисключающие
2. Валидатор `bonus-limits` - лимиты бонусов за ран (5 twisted
   / 3 reversed / 2 flipped)
3. Валидатор `repetition` - per-competition повторения.
   Identity = (manoeuvreId, side, isReverse). Twisted/flipped -
   тот же трюк, reverse - другой. Учитывает `repeatAfterRuns`
   как минимальный зазор между runA и runB (дефолт 999 = never)
4. AWT-specific правила (фаза 1)
5. No-side fly-tricks (MacFly/MistyFly/HeliFly/SatFly) покрыты
   `repetition`: identity по noSide без учёта side + `repetitionAllowed=false`
6. Расчёт technicity per run - базовое среднее коэффициентов,
   отображается внизу колонки рана. Полная формула с учётом
   лимитов - в фазу 3
7. UI: контрол "Repeat gap" в хедере билдера
8. localStorage persistence (фаза 1)
9. Unit-тесты на bonus-limits, repetition, technicity

**Статус: фаза 2 завершена.**

### Фаза 3 - скоринг + мобильная адаптация

1. Расчёт score estimation
2. AWT vs AWQ формулы бонусов
3. Mobile-first адаптивная вёрстка (drawer для палитры,
   touch DnD)
4. UI анимации, полировка
5. Экспорт программы

### Фаза 4 - онлайн документация

1. Страница `/docs/rules` - онлайн версия
   `sporting_code_aerobatics_2025.md`. Рендер markdown в React
   через `react-markdown` + navigation sidebar с оглавлением
2. Страница `/docs/tricks` - справочник трюков. Генерируется
   из `manoeuvres.ts` + `trick_rules.md`. Для каждого трюка
   показывается: имя, коэффициент, доступные модификаторы,
   применимые ограничения (ссылки на правила)
3. Ссылки на документацию на главной странице
4. Поиск по документации (опционально)

### Фаза 5 - деплой

1. GitHub Actions workflow для билда и деплоя на Pages
2. `vite.config.ts` с `base` под имя репозитория
3. HashRouter уже настроен с фазы 1 - Pages поддерживает из коробки
4. Проверка что всё работает по публичному URL

## Тестирование

Unit-тесты на бизнес-правила - обязательная часть каждой фазы.
Каждый валидатор тестируется независимо через Vitest.

```text
src/rules/validators/__tests__/
├── high-coeff.test.ts
├── forbidden-connections.test.ts
├── last-two.test.ts
├── must-be-first.test.ts
├── one-per-run.test.ts
├── incompatible.test.ts
├── bonus-limits.test.ts
├── repetition.test.ts
└── awt-specific.test.ts
```

Подход: создаём Program с заведомым нарушением, проверяем что
валидатор возвращает правильный Violation с правильными
affectedCells. Также проверяем что валидная программа не
вызывает ошибок. Table tests (несколько кейсов в одной функции).

## Верификация

- `npm run dev` - запустить dev-сервер, проверить UI в браузере
- `npm test` - unit-тесты для каждого валидатора
- Ручной тест: составить программу с заведомыми нарушениями,
  убедиться что все подсвечиваются
- `npm run build` - убедиться что билд проходит
- Деплой на Pages, проверить что работает по URL

## Ключевые файлы

- [trick_rules.md](trick_rules.md) - **источник истины для
  валидаторов** (извлечённые ограничения на трюки)
- [sporting_code_aerobatics_2025.md](sporting_code_aerobatics_2025.md) -
  полный FAI код (коэффициенты трюков, формулы скоринга,
  описания манёвров)
- [plan.md](plan.md) - требования пользователя
