# ТЗ: Программа v2 — «Гибридный инкубатор»

> Статус: УТВЕРЖДЕНО (v2.1) — готово к передаче ИИ-разработчику. Кодовые правки не вносились.
> ⚠️ Историческая нумерация: lesson-id в этом документе — pre-restructure. Живые id —
> позиционные `m{модуль}l{блок}` в `src/data.ts`; все рабочие доки (CONTENT_*, RUBRICS_*,
> RULES_*) нормализованы к живой нумерации 2026-07-03. Сверяться по заголовкам блоков.
> Основание: стратегическая сессия (ресёрч EF/Antler/MIT/YC/FI + прожарка MVP).
> Язык контента: EN (как в текущем продукте). Язык ТЗ: RU.

---

## 0. Цель обновления

Превратить текущий линейный курс в **гибридный инкубатор**: юзер проходит путь
идея → первый платящий клиент, где лекции — прелюдия к реальным бизнес-действиям,
AI даёт персональный гайданс и фидбэк на базе накопленных данных (Brain),
а фаундеры Affina подключаются как менторы в 3 контрольных точках.

Северная звезда программы для юзера: **первый платящий клиент**.
Северная звезда Affina: % юзеров, дошедших до первой продажи.

Ключевые принципы (зафиксированы, не менять):
1. Теория = 15%, топливо для действия. После любой теории — немедленное применение.
2. Каждый модуль отдаёт структурированные артефакты в Brain (Snapshot — курируемый слой).
3. Красные упражнения работают по паттерну **Try → Review → Delegate**.
4. Жёлтые полевые задачи юзер делает ТОЛЬКО сам; платформа даёт Briefing до и Debrief после.
5. Зачёт полевой задачи — только при артефакте (текст по шаблону / ссылка / скрин).

---

## 1. Текущее состояние (as-is, по коду)

| Что есть | Где | Оценка |
|---|---|---|
| 12 модулей × ~4 урока (2 text + 2 input) | `src/data.ts` MODULES | Хорошая база, покрывает ~70% целевой программы |
| Типы уроков `text / input / structured`, aiMode `feedback / compare / north-star` | `types.ts` Lesson | Расширить типами блоков |
| Brain: `brainEntries` (entryType, aiScore, aiFeedback), маппинг BRAIN_ENTRY_TYPES | `schema.ts`, `data.ts` | Оставить; добавить Snapshot |
| Tasks: source `mentor/lesson/advisor/self/system/pulse`, статусы, AI review, файлы (coming soon) | `schema.ts` tasks | Добавить source `program`, структурные формы |
| Pulse: weekly check-in, momentum card, streak | `api/pulse`, MetricPulse | Оставить как есть |
| North Star: структурный урок m11l6, jsonb в users | `api/northstar` | Переносится в М5 |
| Launch Readiness: seed + слои, «unmet required» | `api/score.ts`, `api/progress.ts` | Формализовать формулу (см. §7) |
| Онбординг: 5 вопросов → analyzing → score → register → unlock | screens | Оставить; углубление — в М0 |

**Вывод:** реструктуризация, а не переписывание. Уроки с устоявшимися ID сохраняют ID
(история completedLessons и brainEntries не ломается).

---

## 2. Целевая структура программы: 13 модулей

Легенда: 🟣 теория · 🔴 упражнение (Try→Review→Delegate) · 🟡 полевая задача ·
🟢 премиум · 📅 менторская сессия · ⚙️ системный блок.
Маркеры: **KEEP** (как есть) / **REWRITE** (переписать текст) / **MOVE** (перенос) / **NEW**.

### М0 — Welcome to Affina Space (NEW, track: Foundations)
| # | Тип | Блок | Статус |
|---|---|---|---|
| 0.1 | 🟣 | How Affina works: theory → practice → real world → your Brain | NEW |
| 0.2 | 🟣 | Being a founder in the AI era (честно про предпринимательство + AI-рычаг) | NEW |
| 0.3 | 🔴 | Deep intake: your project today (структурная форма, префилл из онбординга) | NEW |
| 0.4 | 🔴 | Import what you have (ссылки: сайт, соцсети, доки; файлы — этап 2) | NEW |
| 0.5 | ⚙️ | **Generate Startup Snapshot v1** (см. §5) — вау-момент №1 | NEW |

### М1 — Find Your Focus (эволюция текущего m1)
| # | Тип | Блок | Статус |
|---|---|---|---|
| 1.1 | 🟣 | Think in hypotheses: the lean loop (Ries/Blank + HBS; «пивот = дисциплина») | NEW |
| 1.2 | 🟣 | Why a clear idea beats a big idea (`m1l1`) | KEEP |
| 1.3 | 🟣 | The shape of a one-liner that lands (`m1l2`) | KEEP |
| 1.4 | 🔴 | Mission & Vision (префилл из Snapshot) | NEW |
| 1.5 | 🔴 | Your value proposition (`m1l3`) | KEEP |
| 1.6 | 🔴 | Why you? (`m1l4`) | KEEP |

### М2 — Research the Market (эволюция m2)
| # | Тип | Блок | Статус |
|---|---|---|---|
| 2.1 | 🟣 | Is this a market worth winning? (`m2l1`) + тезис Тиля «own a small market» | REWRITE |
| 2.2 | 🟣 | Your real competitor is the status quo (`m2l2`) | KEEP |
| 2.3 | 🟣 | Market size: TAM bottom-up (замена `m2l3` Does the money work → деньги уходят в М5) | REWRITE |
| 2.4 | 🔴 | Map your competitive landscape (`m2l4`) | KEEP |
| 2.5 | 🔴 | Your positioning & differentiation (`m2l5`) | KEEP |
| 2.6 | 🟢 | **Order your personal Market Research** (см. §6.4; доступен сразу; если 2.4/2.5 пусты — обязательная мини-анкета из 3–5 уточняющих вопросов) | NEW |
| 2.7 | 🟡 | Walk your competitors' user journey (3–5 конкурентов; артефакт: заметки по шаблону) | NEW |

### М3 — Customer Discovery (переименование Persona Builder)
| # | Тип | Блок | Статус |
|---|---|---|---|
| 3.1 | 🟣 | You can't build for everyone (`m3l1`) | KEEP |
| 3.2 | 🟣 | What makes a great first customer (`m3l2`) | KEEP |
| 3.3 | 🟣 | Interviews that tell the truth (Mom Test: прошлое поведение, не питчить) | NEW |
| 3.4 | 🔴 | Three candidate customers (`m3l3`, compare mode) | KEEP |
| 3.5 | 🔴 | Your beachhead persona (`m3l4`) | KEEP |
| 3.6 | 🔴 | Your interview script (+ подготовка: репетиция с AI-«клиентом», v1 = генерация скрипта и подсказок) | NEW |
| 3.7 | 🟡 | Run 1–2 warm interviews (друзья друзей; компонент Interview Log — §6.2) | NEW |

### М4 — Problem, Solution & Product (слияние m4 + m5)
| # | Тип | Блок | Статус |
|---|---|---|---|
| 4.1 | 🟣 | Fall in love with the problem, not the solution (JTBD; painkiller vs vitamin) | NEW |
| 4.2 | 🟣 | Full life-cycle use case (`m4l1`) | KEEP |
| 4.3 | 🟣 | Sketch your product, not your tech (`m4l2`) | KEEP |
| 4.4 | 🟣 | Value in numbers: before and after (`m5l1`) | KEEP |
| 4.5 | 🔴 | **Problem–Solution check against your interviews** — AI сверяет v0 (М1) с интервью (М3), подсвечивает расхождения. Вау-момент №2 | NEW |
| 4.6 | 🔴 | Use-case map (`m4l3`) | KEEP |
| 4.7 | 🔴 | Product sketch (`m4l4`) | KEEP |
| 4.8 | 🔴 | Quantified value (`m5l3`) + Your core advantage (`m5l4` — объединить в один блок с двумя полями) | REWRITE |
| 4.9 | 🟡 | Ask for a micro-commitment (waitlist/LOI/предзаказ; артефакт: скрин) | NEW |
| — | ⚙️ | **PAYWALL_BOUNDARY** — флаг на модуле М5+ (`paid: true`), в v2 выключен | NEW |
| — | 📅 | **Mentor Session S1 «Start»** (см. §6.5) | NEW |

*Примечание: «Define your core» (`m5l2`) — убрать как отдельную лекцию, суть входит в 4.8.*

### М5 — Business Model & Revenue (слияние m7 + m8 + North Star)
| # | Тип | Блок | Статус |
|---|---|---|---|
| 5.1 | 🟣 | Ways your product makes money (`m7l1`) + «модель определяет продукт и цель года» | REWRITE |
| 5.2 | 🟣 | Price from value, not cost (`m7l2`) + женская специфика: underpricing | REWRITE |
| 5.3 | 🟣 | LTV & CAC (`m8l1`+`m8l2` объединить) + North Star Metric (перенос из `m11l5`) | REWRITE |
| 5.4 | 🔴 | Your business model (`m7l3`) — с письменной защитой «почему эта» | REWRITE |
| 5.5 | 🔴 | Unit economics v1 (`m8l3`) — AI помечает 2–3 самых шатких допущения | REWRITE |
| 5.6 | 🔴 | **Choose your North Star + year goal** (`m11l6`, structured, aiMode north-star) — декомпозиция в квартальные вехи | MOVE+REWRITE |
| 5.7 | 🟡 | **Run 5–10 discovery interviews with WTP questions** (Interview Log; это исследование цены, НЕ продажа) | NEW |

### М6 — MVP & Website (слияние m9 + m10)
| # | Тип | Блок | Статус |
|---|---|---|---|
| 6.1 | 🟣 | Identify your riskiest assumptions (`m9l1`) | KEEP |
| 6.2 | 🟣 | Pretotyping: fake door, landing, Wizard of Oz (`m9l2`) | KEEP |
| 6.3 | 🟣 | What an MVBP is (`m10l1`) + The scope knife + no-code (`m10l2`) — объединить, добавить «как AI изменил игру» | REWRITE |
| 6.4 | 🟣 | Anatomy of a landing page that converts (StoryBrand-структура; message-match с персоной) | NEW |
| 6.5 | 🔴 | Assumptions map (`m9l3`) | KEEP |
| 6.6 | 🔴 | MVBP definition (`m10l3`) | KEEP |
| 6.7 | 🔴 | Your site structure (AI-черновик из Brain: персона+VP+цена) | NEW |
| 6.8 | 🟡 | **Publish your site/MVP + first traffic** (порог успеха фиксируется ДО запуска; артефакт: URL + цифры) — поглощает `m9l4` Demand test | NEW |

### М7 — Customer Acquisition & Marketing (эволюция m6 + новое)
| # | Тип | Блок | Статус |
|---|---|---|---|
| 7.1 | 🟣 | The path to a paying customer (`m6l1`) | KEEP |
| 7.2 | 🟣 | Who really decides (`m6l2`, DMU) | KEEP |
| 7.3 | 🟣 | 19 channels, pick 2 (Bullseye) + Do things that don't scale | NEW |
| 7.4 | 🟣 | CJM & retention: the leaky bucket (AARRR) | NEW |
| 7.5 | 🔴 | Acquisition path (`m6l3`) | KEEP |
| 7.6 | 🔴 | Decision & influence map (`m6l4`) | KEEP |
| 7.7 | 🔴 | 5 candidate channels for your first 10 customers (Bullseye-ранжирование) | NEW |
| 7.8 | 🟡 | First acquisition results (запустить 1–2 немасштабируемых канала; артефакт: цифры по каналам) | NEW |

### М8 — Sales: You Are the Founder Who Sells (NEW, track: Launch)
| # | Тип | Блок | Статус |
|---|---|---|---|
| 8.1 | 🟣 | The founder is the first salesperson (Bosmeny: prospecting→conversations→closing) | NEW |
| 8.2 | 🟣 | You're not selling — you're helping (страх, рефрейминг, женская оптика) | NEW |
| 8.3 | 🟣 | The funnel math: volume beats perfection + explicit ask + follow-up | NEW |
| 8.4 | 🔴 | Your sales script (из Brain; роль-плей с AI-«скептиком», v1 = скрипт + разбор возражений) | NEW |
| 8.5 | 🔴 | Sales pipeline (проспекты из интервью М3/М5 + тёплая сеть; недельная норма касаний) | NEW |
| 8.6 | 🟡 | **First paid deal / pilot** (артефакт: скрин оплаты) — North Star программы | NEW |

### М9 — Review: Look at the Truth (NEW, чекпоинт)
| # | Тип | Блок | Статус |
|---|---|---|---|
| 9.1 | 🟣 | Three numbers that matter: traction · product · cash flow (MIT delta v) | NEW |
| 9.2 | 🟣 | Funnel & conversions: vanity vs real metrics | NEW |
| 9.3 | 🟣 | Retention & habit formation (`m11l2` — перенос) + Sean Ellis PMF test | MOVE+REWRITE |
| 9.4 | 🔴 | Traction dashboard (`m11l3` — перенос): воронка + главный leak + AI-диагноз | MOVE+REWRITE |
| 9.5 | 🔴 | Progress report + defense (отчёт по 3 метрикам; рейтинг; 3 приоритета на след. спринт) | NEW |
| 9.6 | 🟡 | Talk to 3–5 non-buyers (почему не купили; артефакт: заметки) | NEW |
| — | 📅 | **Mentor Session S2 «Midpoint»** | NEW |

### М10 — Be a Solopreneur (NEW, коучинговый)
| # | Тип | Блок | Статус |
|---|---|---|---|
| 10.1 | 🟣 | Focus, energy, burnout (maker vs manager; совмещение с семьёй) | NEW |
| 10.2 | 🟣 | Manage like Horowitz: people → product → profit; нанимай за силу | NEW |
| 10.3 | 🟣 | Operate like Rabois: CEO-редактор; AI и автоматизация раньше найма | NEW |
| 10.4 | 🔴 | Strengths & weaknesses audit (+founder-market fit, тянет edge из М0/М1) | NEW |
| 10.5 | 🔴 | Do / Delegate / Automate matrix (AI предлагает, что закрыть агентами) | NEW |
| 10.6 | 🟡 | Delegate or automate 1 real task this week (артефакт: что снял + часы) | NEW |

### М11 — Pivot or Scale (NEW + переносы)
| # | Тип | Блок | Статус |
|---|---|---|---|
| 11.1 | 🟣 | The fork: decide from data, not emotion (premature scaling = смерть №1) | NEW |
| 11.2 | 🟣 | Types of pivot: changing course ≠ failure (Ries; кейсы) | NEW |
| 11.3 | 🟣 | Scale only what repeats (PMF-чеклист; LTV:CAC ≥ 3; beachhead → соседние рынки) | NEW |
| 11.4 | 🔴 | Pivot/Scale scorecard (AI считает из Brain: за/против + рекомендация) | NEW |
| 11.5 | 🔴 | Pivot plan / Scale roadmap (`m11l4` Product roadmap — перенос; 12-мес план с вехами) | MOVE+REWRITE |
| 11.6 | 🟡 | **Verification sprint** (ветвление: scale → 1 дешёвый эксперимент; pivot → 3–5 интервью новой гипотезы через Interview Log) | NEW |

### М12 — Fundraising & Your Story (эволюция m12)
| # | Тип | Блок | Статус |
|---|---|---|---|
| 12.1 | 🟣 | Do you even need VC? (bootstrapping/гранты/ангелы/VC; женские гранты и ангел-сети) | NEW |
| 12.2 | 🟣 | How a round works + SAFE/term sheet basics (глазами VC) | NEW |
| 12.3 | 🟣 | Founder storytelling (`m12l1`) + Pitch deck structure (`m12l2`) — объединить, структура Sequoia | REWRITE |
| 12.4 | 🔴 | Pitch narrative (`m12l3`) → **Create your pitch deck** (авто-сборка из Brain + Q&A-тренажёр) | REWRITE |
| 12.5 | 🟡 | Research 20+ investors/grants (fit по стадии/нише/чеку) | NEW |
| 12.6 | 🟡 | Contact 10 real investors (≥1 живой разговор; артефакт: лог аутрича) | NEW |
| — | 📅 | **Mentor Session S3 «Graduation»** + сертификат | NEW |

**Итог: 13 модулей, ~78 блоков. Из них KEEP ≈ 24, REWRITE/MOVE ≈ 12, NEW ≈ 42.**
Треки: М0–М1 Foundations · М2–М5 Validation · М6 Building · М7–М9 Launch · М10–М12 Growth.

---

## 3. Изменения модели данных

### 3.1 Типы блоков (`types.ts`)
```ts
// Расширить Lesson → Block
export type BlockKind = 'theory' | 'exercise' | 'field' | 'premium' | 'mentor_session' | 'system';
export type Lesson = {
  id: string;
  kind: BlockKind;              // NEW; дефолт по типу: text→theory, input/structured→exercise
  // ...существующие поля...
  fieldTask?: {                 // только для kind: 'field'
    artifactType: 'text_template' | 'interview_log' | 'url_with_numbers' | 'screenshot' | 'outreach_log';
    template?: string[];        // поля шаблона для text_template
    minEntries?: number;        // для interview_log
  };
  delegatable?: boolean;        // exercise: доступна ли кнопка "Do it for me" (дефолт true)
};
export type Module = {
  // ...существующие...
  paid?: boolean;               // флаг пейвола (М5+ = true, в v2 не enforce'ится)
  mentorSessionAfter?: 'S1' | 'S2' | 'S3';  // М4, М9, М12
};
```

### 3.2 Задачи (`schema.ts` tasks)
- Новый source: `'program'` — полевые задачи из куррикулума. Создаются автоматически
  при входе юзера в модуль, содержащий 🟡-блок. `sourceRef` = lessonId блока.
- Новое поле `submissionData jsonb` — структурные сабмиты (Interview Log и т.п.).
- Статус-machine: `todo → submitted → reviewed(verdict: strong|good|needs_work) → done`;
  needs_work возвращает в редактируемое состояние (UI уже показывает «needs work» — сохранить).
- **Валидация артефакта:** submit заблокирован, пока не заполнен обязательный артефакт
  (для text_template — все поля шаблона; для url — валидный URL; для interview_log — ≥ minEntries).

### 3.3 Interview Log (переиспользуемый компонент, М3/М5/М11)
Записи (до 10), каждая — 5 полей:
1. Who (имя/роль/сегмент)
2. Main pain + how they solve it today
3. Key quotes / insights
4. Price signal (что платит сейчас / реакция на цену) — активно с М5
5. Verdict: confirms / contradicts hypothesis (+что меняем)
Каждая запись → AI-разбор → обновление persona-дока и Snapshot. Счётчик прогресса на карточке задачи.

### 3.4 Brain / Snapshot
- Новый entryType: `startup_snapshot` (уникальный на юзера) + таблица или jsonb-история версий
  (v2: хранить последние 5 версий в jsonb `snapshotHistory`).
- Секции Snapshot: Founder (edge, мотивация, ёмкость ч/нед) · Project & stage · Hypothesis
  (one-liner, клиент) · Market · Customer/Persona · Product · Model + North Star · Traction ·
  Risk flags · Next focus.
- **Правила обогащения — два источника:** (а) чекпоинты модулей: AI-суммаризация
  brainEntries модуля + предыдущей версии Snapshot; (б) **еженедельный check-in (Traction/Pulse)**:
  факты и апдейты, названные юзером в чекине (новые цифры, изменившиеся вводные, коррекции),
  парсятся и вносятся в Snapshot. Только факты/решения (не процесс); каждая запись
  с датой и источником (module N / check-in DATE).
- **Snapshot read-only для юзера.** Правки и обновления — через check-in: на доке подпись
  «Something changed or looks off? Tell us in your weekly check-in — your Snapshot updates
  itself». Отдельный чат/форму правок НЕ делаем.
- DocumentsPanel: Snapshot закреплён первым, бейдж «updated after Module N / check-in».

### 3.5 BRAIN_ENTRY_TYPES — обновить маппинг
Сохранить существующие ID→тип; добавить новые: `m0l3: founder_intake`, `m0l4: imported_assets`,
`m3l6: interview_script`, `m3l7/m5l7/m11l6: interview_log`, `m4l5: problem_solution_check`,
`m6l7: site_structure`, `m7l7: channel_shortlist`, `m8l4: sales_script`, `m8l5: pipeline`,
`m8l6: first_sale`, `m9l5: progress_report`, `m9l6: non_buyer_insights`, `m10l5: delegation_matrix`,
`m11l4: pivot_scale_decision`, `m12l5: investor_targets`, `m12l6: outreach_log`.

---

## 4. Паттерн Try → Review → Delegate (красные блоки)

Состояния упражнения:
1. **Try** — юзер пишет черновик (текущий input-flow). Save.
2. **Review** — существующий AI-фидбэк (score, good, missing, nextStep) — как сейчас.
3. **Delegate** — НОВОЕ: кнопка «Let AI mentor draft this for me», активна ПОСЛЕ
   хотя бы одной попытки юзера (принципиально: сначала пробует сама).
   - AI генерит свою версию из Brain (Snapshot + релевантные brainEntries).
   - UI: две версии рядом (переиспользовать паттерн CompareCard), юзер выбирает
     «Use AI version / Keep mine / Merge» → результат сохраняется как финальный.
   - В brainEntry сохранять оба: `content` (финал) + `userDraft` + `aiDraft`.
   - Счётчик делегаций (готовим кредитную модель, в v2 без лимита, но логируем).
   - **Режимы делегирования:** A — готовый черновик · B — 2–3 варианта на выбор
     (юзер вписывает понравившийся в ответ) · C — сценарный анализ с рекомендацией
     (решение и обоснование юзер пишет сам, поле не предзаполняется) · D — никогда
     (полевые действия/вердикты; допустимы только тексты-заготовки сообщений).
     Пер-блочная карта всех модулей — RULES_DONE_FOR_YOU.md §2.2–2.4.

**Правила для done-for-you задач (маркет-ресеч и др.) — отдельный документ на этапе
контента (НЕ ЗАБЫТЬ: промпт-правила, источники, формат отчёта, SLA, дисклеймеры).**

## 4b. Briefing / Debrief (жёлтые блоки)

- **Mission Briefing** — генерится при открытии задачи из Brain: с кем говорить (из персоны),
  что сказать (из скрипта), чего ждать, критерий «сделано». Заменяет статический WHAT TO DO.
- **Debrief** — после submit: AI-разбор результата (что значит услышанное, что скорректировать)
  + `nextStep`. Рендер поверх существующего TaskReview.

---

## 5. Экран/UX-изменения

| Экран | Изменение |
|---|---|
| **Dashboard** | + Карта программы (13 модулей, состояния: done/current/locked); + виджет North Star (после М5, данные `users.northStar` уже есть); + карточка «Mentor session due» когда достигнут S1/S2/S3; Learning path и Tasks — как есть |
| **LMS (sidebar)** | Чипы типов блоков (Lesson / Exercise / Field / Premium / Session); 🟡-блок в сайдбаре ссылается на задачу в Tasks; замок на paid-модулях (в v2 не активен) |
| **Tasks** | Новая секция **FROM PROGRAM** (выше FROM MENTOR); карточки Interview Log с прогрессом «3/10»; блок артефакта обязателен |
| **TaskDetail** | Briefing (AI) вместо статичного WHAT TO DO; структурные формы по artifactType; Debrief после ревью |
| **Exercise page** | Кнопка Delegate + compare-вью (см. §4) |
| **DocumentsPanel** | Snapshot закреплён сверху; версия и дата; остальное как есть |
| **Mentor session block** | Полстраницы: что это за сессия, зачем, повестка (AI-бриф из Snapshot), кнопка **Book a session** (v2: placeholder → mailto/ссылка, интеграция календаря позже), чекбокс «session completed» (ставит владелец аккаунта менторской роли — v2: вручную) |

---

## 6. Отдельные механики

### 6.1 М0 Intake → Snapshot
- Форма 0.3: стадия (детально), что уже сделано (мультивыбор + текст), ссылки, ёмкость ч/нед,
  мотивация/цель на 12 недель. Префилл из онбординг-ответов (idea/customer/businessModel/stage/goal).
- 0.4: до 5 ссылок (сайт, соцсети, доки) — v2 сохраняем и передаём в промпт Snapshot
  (fetch содержимого — этап 2, если недорого).
- ⚙️ 0.5: генерация Snapshot v1 → экран-презентация («вот твой стартап на одной странице»)
  → сохранение в Brain. Это первый вау-момент; дизайн-приоритет высокий.

### 6.2 Interview Log — см. §3.3.

### 6.3 Чекпоинты модулей
Условие завершения модуля: все exercise со score ≥ порога (предложение: 50) И field task
в статусе done (для модулей с 🟡). По завершении: обновление Snapshot + начисление
Launch Readiness (см. §7) + разблокировка следующего модуля.
(v2: без жёсткого гейтинга по score — только по факту завершения; порог включим после теста.)

### 6.4 Премиум-блок М2 (Market Research)
- Карточка «Order your personal market research»: что входит (размер, тренды, карта
  конкурентов, gap-анализ, «где твоё окно»), срок, CTA.
- **Правило готовности (без жёсткого гейтинга):** если m2l4+m2l5 заполнены — вход
  собирается из них (≤2 уточняющих вопроса); если нет — обязательная мини-анкета
  из 3–5 вопросов (банк вопросов — RULES_DONE_FOR_YOU.md §1.2a).
- **Доставка: полный автомат, без human QA** (решение Шамиля). В футере отчёта —
  фидбэк-строка + кнопка «Discuss this report» (ручной re-run по обращению).
- v2: CTA ведёт на оплату-заглушку/заявку (интеграция платежей — отдельно);
  результат доставляется как документ типа `market_research` в Brain + уведомление.
- **Формат отчёта:** онлайн-документ в стиле PDF — постраничный просмотр в браузере,
  минимальный дизайн (подсветка ключевых цифр, callout-блоки выводов и предупреждений,
  таблица конкурентов), БЕЗ кнопки скачивания (v2). Два режима: Test (~4 стр., все
  9 секций сжато) и Full (~20 стр., платный — позже).
- Правила генерации, структура 9 секций, пайплайн и стандарт качества —
  **RULES_DONE_FOR_YOU.md** (готов). ⚠ Прод-запуск кнопки требует поискового API
  (Exa/Tavily или аналог) — без него только внутренний тест с меткой «estimates only».

### 6.5 Менторские сессии S1/S2/S3
- S1 «Start» (после М4): знакомство, цель на 12 недель вслух, как работает ритм.
- S2 «Midpoint» (после М9): разбор дашборда, суждение по pivot/scale, разблокировка.
- S3 «Graduation» (после М12): итоги vs цель из S1, план на год, подписка, отзыв, рефералы.
- v2: блок + кнопка (заглушка). Интеграция booking-инструмента и заметки → Brain — этап 3.

---

## 7. Launch Readiness — формула (закрывает бэклог «activity points»)

`readiness = min(100, seed + lessons + exercises + field + checkpoints + traction)`

| Источник | Очки | Кап |
|---|---|---|
| Seed (idea score онбординга) | score/10 | 10 |
| Теория пройдена | +0.4/урок | ~10 |
| Упражнение с AI-score ≥50 | +1 (score ≥80 → +1.5) | ~20 |
| Полевая задача done | интервью 1–2: +3 · конкурентный путь: +2 · микро-обязательство: +4 · 5–10 интервью: +5 · запуск сайта: +6 · результаты каналов: +4 · **первая продажа: +8** · non-buyers: +3 · верификация М11: +4 · инвест-аутрич: +3 | ~42 |
| Чекпоинты М4/М9 пройдены | +3 каждый | 6 |
| Traction-вехи из Pulse (первые регистрации, first revenue подтверждён) | +2–6 | 12 |

Принципы: реальные действия весят в разы больше уроков; 100 ≈ «готова к запуску» —
достигается только через полевые задачи. `lastReadinessGain` уже есть — показывать источник.
Pulse-активность конвертируется через traction-вехи (не за факт чекина — против накрутки).

---

## 8. Миграция

Текущая структура была тестовой (решение Шамиля) — жёсткая обратная совместимость НЕ требуется.
1. Допустим полный сброс прогресса тест-юзеров при выкатке новой программы.
2. Рекомендация (не требование): переиспользовать старые ID уроков там, где урок сохраняется
   as-is (KEEP), — меньше правок в BRAIN_ENTRY_TYPES и контенте.
3. BRAIN_ENTRY_TYPES — привести к новой карте блоков (см. §3.5).

---

## 9. Фазы внедрения и приёмка

**Фаза 1 — Структура и контент (блокер: тексты лекций — пишутся отдельно).**
Реструктуризация модулей по §2; типы блоков; program-задачи в Tasks hub; Interview Log.
✅ Приёмка: юзер проходит М0→М3, видит 13 модулей, полевые задачи появляются в Tasks,
интервью сохраняются структурно.

**Фаза 2 — Мозг и делегирование.**
Snapshot (генерация + версии + пин в Documents); Briefing/Debrief; Delegate-кнопка с compare.
✅ Приёмка: после М0 юзер получает Snapshot; после чекпоинта М2 Snapshot обновился;
в упражнении доступна AI-версия после попытки.

**Фаза 3 — Скоринг и сессии.**
Launch Readiness по §7; менторские блоки-заглушки; карта программы на Dashboard;
North Star виджет после М5.
✅ Приёмка: readiness растёт по формуле с указанием источника; после М4 появляется
блок S1 с кнопкой.

**Вне скоупа v2 (зафиксировано):** пейвол-enforce, платежи, Resend/email-триггеры,
Legal-мини-курс, виральные карточки/бейдж, полный Interview Engine (пайплайн+аутрич),
booking-интеграция, правила done-for-you ресёча (пишутся вместе с контентом).

---

## 10. Принятые решения (лог, утверждено Шамилём)

1. **Слияния m4+m5, m7+m8, m9+m10 — утверждены.** Старая структура была тестовой;
   приоритет — новая программа из §2, без оглядки на прошлую разбивку.
2. **«Define your core»** — внутри М4 (блок 4.8), отдельной лекции нет.
3. **Чекпоинты в v2 без порога score** — завершение по факту выполнения блоков;
   порог включим после сбора данных теста.
4. **Interview Log: голосовой ввод дебрифа** — бэклог, не v2.
5. **Delegate: без лимита в v2, с логом** каждого использования
   (userId, lessonId, timestamp) — данные для будущей кредитной модели.
6. **Snapshot read-only.** Обновления и правки юзер сообщает в еженедельном check-in
   (раздел Traction) — Snapshot обновляется сам (см. §3.4). Отдельный чат правок не делаем.

---

*Следующие шаги после утверждения ТЗ: (1) тексты лекций М0–М4 (EN) + критерии оценки
и рекомендации для всех 🔴/🟡; (2) правила done-for-you (маркет-ресеч и пр.);
(3) тексты М5–М12.*
