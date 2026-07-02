# Done-for-You Rules — Market Research (М2) + Delegate Drafts

> Companion to SPEC_PROGRAM_V2.md (§4, §6.4) и RUBRICS_M0-M4.md.
> Регламент всего, что AI делает ЗА юзера. Промпт-блоки — EN, обвязка — RU.
> Принцип одной строкой: мы готовим черновики и исследования ДЛЯ неё;
> решения — её. В каждом сгенерированном материале это сказано явно.

---

# ЧАСТЬ 1 — Market Research (зелёный блок m2l6)

## 1.1 Размещение и гейтинг

- Блок доступен **только после завершения m2l4 (Competitive landscape) и m2l5
  (Positioning)** — решение Шамиля. Это гарантирует качественный вход: к моменту
  заказа в Мозге уже есть ниша, персона-направление, карта конкурентов и позиционирование.
- Если Snapshot всё же беден (редкий случай: формальные ответы в intake) — AI задаёт
  максимум 2 уточняющих вопроса ДО запуска генерации. Иначе — сразу в работу.

## 1.2 Входной контракт (что собирается в контекст генерации)

1. Startup Snapshot (полностью — ниша, стадия, гео, edge, цель).
2. m2l4 competitive_landscape + m2l5 positioning (её собственная карта — отчёт обязан
   на неё ссылаться: подтверждать, дополнять, спорить).
3. Персона-направление (m0l3 intake; если юзер уже в М3 — m3l4 persona).
4. Импортированные ссылки (m0l4).
5. Гео и язык рынка (из intake; если не указано — спросить, это влияет на всё).

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
| QA | human-review первых 10–20 отчётов (рекомендация) | выборочный |

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

## 1.8 Операционные заметки

- SLA: 48 часов (окно для human QA на старте).
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

## 2.2 Карта делегируемости М0–М4

| Блок | Delegate | Примечание |
|---|---|---|
| m0l3 intake, m0l4 import | — | Не упражнения в этом смысле; не делегируются |
| m1l6 Mission & Vision | ✅ полный | Черновик из intake + one-liner |
| m1l3 Value proposition | ✅ полный | Из intake; после М3 — обогащается интервью |
| m1l4 Why you? | ⚠️ с оговоркой | AI собирает из её intake-истории; в футере добавляется: "Only you know if this story is true — check every sentence." |
| m2l4 Competitive landscape | ✅ полный | AI может дополнить карту из общих знаний, помечая гипотетичных игроков «verify this one exists in your geo» |
| m2l5 Positioning | ✅ полный | Из m2l4 + persona |
| m2l7 🟡 journey walk | ❌ никогда | Полевая задача — только сама |
| m3l3 Three candidates | ✅ полный | Compare-механика и так AI-ассистирована |
| m3l4 Beachhead persona | ⚠️ с оговоркой | Только если есть ≥1 интервью или содержательный intake; иначе — вопрос вместо черновика |
| m3l6 Interview script | ✅ полный | И так генерится AI по дизайну блока |
| m3l7 🟡 interviews | ❌ никогда | Включая поля «verdict» в Interview Log — её суждение |
| m4l5 Reality check | ⚠️ частично | AI уже делает compare-карту; черновик REWRITE допустим, но verdict-часть («что меняю и почему») остаётся ей — поле не предзаполняется |
| m4l3 Use-case map, m4l4 Product sketch | ✅ полный | Из persona + интервью |
| m5l3 Quantified value + core | ⚠️ с оговоркой | Числа — только из её интервью/ресёча; нет чисел → вопрос вместо черновика |
| m4l9 🟡 micro-commitment | ❌ никогда | Но AI может драфтить ТЕКСТ сообщения-аска (это формулировка, не действие) — отдельная кнопка внутри брифинга |

**Общее правило карты:** 🔴 формулировки — делегируются; 🟡 действия и любые вердикты/факты — никогда. Тексты-заготовки для полевых задач (сообщение для аутрича, шаблон письма) — можно, это черновик её слов, а не действие за неё.

## 2.3 UX-петля (фиксация, уже в ТЗ §4)

Try (≥1 своя попытка) → Review → Delegate → две версии рядом → «Use AI / Keep mine /
Merge» → финал сохраняется, `userDraft` + `aiDraft` остаются в Мозге → каждое нажатие
в лог (userId, lessonId, timestamp).

---

*Статус: Часть 1 test-mode готова к внутреннему тесту без поискового API (с меткой
«estimates only»); прод-запуск зелёной кнопки — после решения по поисковой инфраструктуре.*
