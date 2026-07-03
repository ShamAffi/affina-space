# Done-for-You Rules — Market Research (М2) + Delegate Drafts

> **IDs normalized 2026-07-03:** all lesson ids below now use the LIVE `src/data.ts` numbering (this file was originally authored in pre-restructure numbering; the old ids survive only as `old-mXlY` markers on retired blocks).

> Companion to SPEC_PROGRAM_V2.md (§4, §6.4) и RUBRICS_M0-M4.md.
> Регламент всего, что AI делает ЗА юзера. Промпт-блоки — EN, обвязка — RU.
> Принцип одной строкой: мы готовим черновики и исследования ДЛЯ неё;
> решения — её. В каждом сгенерированном материале это сказано явно.

---

# ЧАСТЬ 1 — Market Research (зелёный блок m2l6)

## 1.1 Размещение и правило готовности (обновлено, решение Шамиля)

- Жёсткого гейтинга НЕТ — блок доступен в М2 сразу.
- Правило готовности:
  - m2l4 + m2l5 заполнены → вход собирается из них; максимум 2 уточняющих вопроса.
  - НЕ заполнены → перед генерацией обязательная мини-анкета: **3–5 уточняющих
    вопросов**, которые AI выбирает из банка (§1.2a) по принципу «чего не хватает в Мозге».
- Заполненные позже m2l4/m2l5 НЕ перегенерируют отчёт автоматически (только по
  явному запросу — бережём токены).

## 1.2 Входной контракт (что собирается в контекст генерации)

1. Startup Snapshot (полностью — ниша, стадия, гео, edge, цель).
2. m2l4 competitive_landscape + m2l5 positioning (её собственная карта — отчёт обязан
   на неё ссылаться: подтверждать, дополнять, спорить).
3. Персона-направление (m0l3 intake; если юзер уже в М3 — m3l5 persona).
4. Импортированные ссылки (m0l4).
5. Гео и язык рынка (из intake; если не указано — спросить, это влияет на всё).

### 1.2a Банк уточняющих вопросов (AI выбирает 3–5 недостающих)

1. Geo & language: "Which country/region and language is your primary market?"
2. Customer: "Describe your ideal customer in one sentence — who exactly?"
3. Known alternatives: "Which competitors or workarounds do you already know your
   customers use? Names — or 'not sure' is fine."
4. Price point: "What do you imagine charging, roughly? It helps size the market."
5. Model: "Is this B2C, B2B, or both? One-off purchase or subscription?"
6. Channels guess: "Where do you think your customers spend time online?"

Правило: вопрос, ответ на который уже есть в Мозге, задавать НЕЛЬЗЯ. Минимум 3,
максимум 5. Ответы сохраняются в Мозг (обогащают intake, не одноразовые).

## 1.3 Структура отчёта (обязательные секции — в ОБОИХ режимах)

Четыре линзы: венчурная → стартаповая → продуктовая → маркетинговая.

| # | Секция | Линза | Что внутри |
|---|---|---|---|
| 0 | **Executive Summary** | — | Вердикт одним абзацем + 3 ключевые цифры + главная возможность. Пишется последней, читается первой |
| 1 | **Market: size & timing** | Венчурная | TAM/SAM/SOM **bottom-up с формулой и допущениями на виду**; динамика роста; «why now» — 3–5 трендов с датами и источниками |
| 2 | **Customer: segments & evidence** | Стартаповая | Сегменты и оценка её beachhead; боли/jobs из публичных свидетельств (отзывы, форумы, комьюнити — с цитатами и ссылками); сигналы willingness-to-pay |
| 3 | **Competition: map & models** | Продуктовая | 5–10 игроков (вкл. status quo): позиционирование, **цены и модели монетизации**, сильное/слабое, как выглядит их продуктовая петля; сводная таблица |
| 4 | **Gaps & white space** | Продуктовая | Недообслуженные сегменты, ценовые дыры, позиционные пустоты; сверка с ЕЁ позиционированием из m2l5 (подтверждаем/спорим) |
| 5 | **Distribution & marketing** | Маркетинговая | Где живёт аудитория (конкретные каналы/комьюнити); как привлекают конкуренты (SEO/платка/контент/партнёрки — наблюдаемые сигналы); ориентиры CAC, если есть публичные данные |
| 6 | **Risks & watchouts** | Венчурная | Регуляторика, платформенные зависимости, инкумбенты; ⚠ **отдельный callout, если ресёч противоречит её гипотезе** — не сглаживать |
| 7 | **Your openings** | Все | 3 конкретных возможности, привязанные к её edge из Snapshot; каждая — с первым шагом и указанием, в какой модуль/задачу программы это ложится |
| 8 | **Sources & method** | — | Список источников с датами; методика; метки уверенности по секциям (high/medium/low) |

## 1.4 Два режима

| | **Test mode (сейчас)** | **Full mode (платный, позже)** |
|---|---|---|
| Объём | ~4 стр. (~2 500–3 500 слов) | ~20 стр. (~12 000–15 000 слов) |
| Секции | ВСЕ 9, сжато: буллеты, top-5 конкурентов таблицей, 1 opening глубоко + 2 кратко | Все 9 в глубину: профиль на каждого конкурента, разбор каналов, 3 openings глубоко, больше цитат-свидетельств |
| Токен-бюджет | жёсткий лимит (тестируем экономику) | расширенный |
| QA | **полный автомат, без human-review** (решение Шамиля) + фидбэк-канал в отчёте | автомат + выборочные проверки |

## 1.5 Стандарт качества (в системный промпт генерации)

```
TRUTH HIERARCHY (strict order):
1. Her own data from the Brain (Snapshot, her competitor map, her interviews).
2. Verifiable external sources — every external claim carries a link and a date.
3. Model knowledge — allowed ONLY as clearly labeled estimates.

NUMBERS POLICY
- Every number is either sourced (link) or labeled "estimate" WITH the calculation
  logic shown ("~8,000 coaches: 40k registered nutritionists × ~20% independent").
- Fake precision is forbidden. "$4.37B market" with no source = delete or re-derive.
- TAM is always bottom-up: count × price × reachable share. Top-down only as a
  sanity-check footnote.

HONESTY POLICY
- If evidence contradicts her hypothesis or positioning — do not soften it.
  Put it in a highlighted warning callout in section 6 AND mention in the summary.
- If the niche is too narrow for real data: say so plainly, then research the
  nearest proxy markets and label them as proxies.
- Every section gets a confidence label: high / medium / low, with one line why.

VOICE
- Address the founder directly ("your market", "your opening").
- End with actionable conclusions, not descriptions. Each section closes with
  "What this means for you:" — one or two lines.
```

## 1.6 Пайплайн генерации (для разработчика)

1. **Assemble context** — входной контракт §1.2 одним пакетом.
2. **Search pass** — веб-поиск по шаблонам запросов: `[niche] market size [geo]`,
   `[competitor] pricing`, `[persona] forum complaints`, `[niche] trends 2025/2026`,
   отзывы конкурентов (G2/Trustpilot/App Store/Reddit). ⚠ **Требуется поисковый API**
   (Exa/Tavily/аналог). Без него отчёт обязан быть помечен «model estimates only,
   no live data» — продавать такой нельзя (открытый вопрос инфраструктуры).
3. **Draft sections** — по структуре §1.3 + стандарту §1.5.
4. **Self-check pass** — отдельный проход: каждая цифра source/estimate? противоречия
   вынесены в callout? секции 7 привязаны к её edge? Провал → перегенерация секции.
5. **Format & deliver** — рендер (§1.7), запись в Documents (`market_research`),
   ключевые факты (размер, топ-конкуренты, главный gap) → Snapshot → Market,
   уведомление юзеру.

## 1.7 Формат подачи (решение Шамиля)

- **Онлайн-документ в стиле PDF**: постраничный вид, минимальный дизайн в токенах
  платформы; листается в браузере, **кнопки «скачать» нет** (v2).
- Оформление: подсветка ключевых цифр (brand-акцент), callout-блоки для выводов
  («What this means for you») и предупреждений (⚠ контр-гипотеза), таблица конкурентов,
  тонкая типографика — никакой «простыни».
- Хедер: название её проекта, дата, режим (Snapshot Report / Full Report), дисклеймер
  внизу первой страницы: *"Directional research to inform your decisions — not a
  substitute for them. Sources and confidence levels inside."*
- **Фидбэк-строка в футере каждой страницы** (полный автомат ⇒ канал обратной связи
  обязателен): *"This report was generated automatically for your project. Something
  looks off or doesn't match your reality? Tell us — we'll gladly review and re-run it."*
  + линк/кнопка «Discuss this report».

## 1.8 Операционные заметки

- Доставка: **полностью автоматическая** (фактически — минуты); в карточке обещаем
  «within 48 hours» — under-promise, over-deliver. Human QA не делаем; вместо него —
  фидбэк-строка в отчёте (§1.7) и ручной re-run по обращению.
- Открытый вопрос инфраструктуры: поисковый API (см. §1.6 п.2) — блокер для запуска
  зелёной кнопки в прод; для внутреннего теста допустим режим «model estimates only».

---

# ЧАСТЬ 2 — Delegate Drafts (кнопка «Do it for me» на 🔴 упражнениях)

## 2.1 Общие правила генерации (в системный промпт Delegate)

```
You are drafting ON BEHALF of the founder, from her own data only.

SOURCE RULE: build the draft exclusively from her Brain — intake, Snapshot, prior
answers, interview log. Use her words and phrasing wherever they exist.

NO-FABRICATION RULE (absolute): never invent facts, interview quotes, numbers,
customer commitments, or life details. Delegate exists for FORMULATION, not for facts.
If the Brain lacks material for an honest draft — do not improvise. Say what's
missing and ask exactly ONE question; draft after she answers.

QUALITY BAR: the draft must pass this block's own rubric (RUBRICS_M0-M4.md) at ≥70.
Self-check before returning; regenerate once if below.

FOOTER (always append, verbatim):
"This is a draft to react to — a recommendation, not a decision. Edit it until
every word is true for you. You know things I don't."
```

## 2.2 Режимы делегирования (утверждено Шамилём)

| Режим | Что делает AI | Что делает она | UI |
|---|---|---|---|
| **A — Готовый черновик** | Одна готовая версия из её данных | Редактирует и подтверждает | Compare-вью (её vs AI) |
| **B — Варианты на выбор** | **2–3 варианта** с разным углом | Выбирает понравившийся и **вписывает его в свой ответ** (с правками) | Карточки вариантов → выбор → поле ответа |
| **C — Сценарный анализ** | Детальный анализ / 2 сценария с рекомендацией — **для осознанного решения** | **Решение и обоснование пишет сама** — это поле AI не предзаполняет никогда | Панель анализа сверху + её поле решения снизу |
| **D — Никогда** | Ничего (полевые действия, вердикты, факты) | Всё сама | Кнопки Delegate нет |

**Исключение внутри D:** тексты-заготовки для полевых задач (сообщение-аск, аутрич-письмо) — можно: это черновик её слов, не действие за неё. Отдельная кнопка внутри брифинга.

## 2.3 Карта делегируемости М0–М4

| Блок | Режим | Примечание |
|---|---|---|
| m0l3 intake, m0l4 import | — | Не делегируются (это вход в систему) |
| m1l4 Mission & Vision | A | Черновик из intake + one-liner |
| m1l5 Value proposition | B | 3 варианта one-liner с разным акцентом (боль / результат / аудитория) |
| m1l6 Why you? | A ⚠️ | Из её intake-истории; футер: "Only you know if this story is true — check every sentence." |
| m2l4 Competitive landscape | A ⚠️ | Гипотетичных игроков помечать «verify this one exists in your geo» |
| m2l5 Positioning | B | 2–3 позиционных угла из m2l4 + persona |
| m2l7 🟡 journey walk | D | Только сама |
| m3l4 Three candidates | — | Compare-механика встроена в блок |
| m3l5 Beachhead persona | A ⚠️ | Только при ≥1 интервью или содержательном intake; иначе вопрос вместо черновика |
| m3l6 Interview script | A | «Делаем для неё» — и так по дизайну блока |
| m3l7 🟡 interviews | D | Вкл. поля verdict в Interview Log |
| m4l5 Reality check | C | Compare-карта — AI; рероайт-черновик допустим (A), но «что меняю и почему» — только она |
| m4l6 Use-case map | B | **3 варианта юзер-пути на выбор** — вписывает понравившийся |
| m4l7 Product sketch | B | 3 варианта описания продукта |
| m4l8 Quantified value + core | B ⚠️ | Варианты формулировок; числа — только из её данных, нет чисел → вопрос |
| m4l9 🟡 micro-commitment | D + текст | AI драфтит текст сообщения-аска |

## 2.4 Карта делегируемости М5–М12

| Блок | Режим | Примечание |
|---|---|---|
| М5 Выбор бизнес-модели | C | 2 сценария под её кейс с трейд-оффами; выбор и защита — её |
| М5 Юнит-экономика v1 | **C** | Не «посчитать за неё», а **2 сценария из её модели — например, массовый vs премиум** — с допущениями на виду; она выбирает и дорабатывает |
| М5 North Star + цель года | B | Кандидаты + recommended (механика `north-star` уже есть); выбор — её |
| М5 🟡 5–10 интервью | D + текст | Аутрич-тексты для сорсинга — можно |
| М6 Assumptions map | A | Выводится из её данных |
| М6 MVBP definition | B | 2 варианта скоупа: leaner vs richer |
| М6 Структура сайта | **A** | «Делаем для неё» — полный черновик из Brain (persona + VP + цена) |
| М6 🟡 запуск сайта | D | — |
| М7 Acquisition path / Decision map | A | Из persona + DMU |
| М7 5 каналов | B | Bullseye: ранжированные кандидаты, выбор 2 — её |
| М7 🟡 результаты каналов | D | — |
| М8 Скрипт продажи | **A** | «Делаем для неё» — из Brain (persona, VP, цена, возражения из интервью) |
| М8 Sales pipeline | A ⚠️ | Структуру и людей из Brain (интервью) — AI; реальные контакты добавляет она; выдумывать проспектов нельзя |
| М8 🟡 первая продажа | D + текст | — |
| М9 Анализ воронки/ретеншна | A | AI-диагноз по дизайну блока (данные — её) |
| М9 Progress report | A ⚠️ | Факты собирает AI; выводы и defense — она |
| М9 🟡 непокупатели | D + текст | — |
| М10 Аудит сильных/слабых | A ⚠️ | AI предлагает на основе всего, что видел; подтверждает она |
| М10 Матрица делегирования | A | Из истории её задач |
| М10 🟡 снять задачу | D | — |
| М11 Pivot/Scale Scorecard | **C** | **Детальный анализ: все «за и против» с итогами и рекомендацией — для осознанного решения, НЕ выбор за неё.** Поле «моё решение и почему» заполняет только она |
| М11 Roadmap / Pivot plan | A ⚠️ | Скелет из scorecard — AI; вехи подтверждает она |
| М11 🟡 верификация | D + текст | — |
| М12 Pitch deck | A | Авто-сборка из Brain по дизайну блока; нарратив дорабатывает она |
| М12 🟡 ресеч инвесторов | D + seed | AI может дать стартовый список направлений/типов фондов; проверка fit и приоритизация — её. Кандидат на будущий премиум-DFY |
| М12 🟡 контакт с инвесторами | D + текст | Аутрич-письма драфтит AI |

## 2.5 UX-петля (фиксация, уже в ТЗ §4)

Try (≥1 своя попытка) → Review → Delegate → две версии рядом → «Use AI / Keep mine /
Merge» → финал сохраняется, `userDraft` + `aiDraft` остаются в Мозге → каждое нажатие
в лог (userId, lessonId, timestamp).

---

*Статус: Часть 1 test-mode готова к внутреннему тесту без поискового API (с меткой
«estimates only»); прод-запуск зелёной кнопки — после решения по поисковой инфраструктуре.*
