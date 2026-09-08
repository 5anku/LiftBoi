// The starter-plan catalog. Training data only: the chooser's plan names and descriptions are
// written as string literals inside t() calls in sheets.jsx, because check-source-strings.mjs
// only finds them there — copy parked in here would silently ship English in every language.
//
// A routine is [key, name, emoji, [[exerciseId, sets, reps], …]]. The key is what a plan's
// schedule points at, so a weekday never depends on the position of a routine in the array.
// Names stay canonical English — they become ordinary user routines, which are not translated.
//
// A list entry can also carry a 4th element — [exerciseId, sets, reps, opts] — where opts is
// { weight, note, sg }. `weight` seeds the routine's target for that exercise (0 means "log your
// own baseline"), `note` is the plan's per-exercise instruction (surfaced during the live
// session, see Workout.jsx's `cfg.note`), and `sg` groups two consecutive entries as a superset
// the same way RoutineEdit's own superset toggle does.
import { uid } from './format.js'

const PPL = [
  ['push', 'Push Day', 'barbell', [['0025', 4, 8], ['0047', 3, 10], ['0426', 3, 10], ['0334', 3, 12], ['0241', 3, 12], ['0251', 3, 10]]],
  ['pull', 'Pull Day', 'pullup', [['2330', 4, 10], ['0027', 4, 8], ['1323', 3, 10], ['0031', 3, 10], ['0313', 3, 12]]],
  ['legs', 'Leg Day', 'legs', [['0043', 4, 8], ['0085', 3, 10], ['0739', 3, 12], ['0585', 3, 12], ['0586', 3, 12], ['0605', 4, 15]]]
]

const UPPER_LOWER = [
  ['upper-a', 'Upper A', 'barbell', [['0025', 3, 8], ['2330', 3, 10], ['0047', 2, 10], ['1323', 2, 10], ['0334', 2, 12], ['0241', 2, 12], ['0031', 2, 12]]],
  ['lower-a', 'Lower A', 'legs', [['0043', 3, 8], ['0085', 3, 8], ['0739', 2, 10], ['0586', 2, 12], ['0605', 3, 15]]],
  ['upper-b', 'Upper B', 'barbell', [['0047', 3, 8], ['0027', 3, 8], ['0426', 2, 10], ['2330', 2, 10], ['0334', 2, 12], ['0241', 2, 12], ['0313', 2, 12]]],
  ['lower-b', 'Lower B', 'legs', [['0739', 3, 10], ['0085', 2, 10], ['0585', 2, 12], ['0586', 3, 12], ['0605', 3, 15]]]
]

const FULL_BODY = [
  ['fb-a', 'Full Body A', 'figureStrength', [['0043', 3, 8], ['0025', 3, 8], ['2330', 3, 10], ['0586', 3, 12], ['0334', 2, 12], ['0031', 2, 12]]],
  ['fb-b', 'Full Body B', 'figureStrength', [['0085', 3, 8], ['0047', 3, 10], ['1323', 3, 10], ['0585', 3, 12], ['0334', 2, 12], ['0241', 2, 12]]],
  ['fb-c', 'Full Body C', 'figureStrength', [['0739', 3, 10], ['0025', 2, 10], ['0027', 3, 10], ['0426', 2, 10], ['0586', 3, 12], ['0605', 3, 15]]]
]

const FIVE_BY_FIVE = [
  ['5x5-a', '5×5 A', 'barbell', [['0043', 5, 5], ['0025', 5, 5], ['0027', 5, 5]]],
  ['5x5-b', '5×5 B', 'barbell', [['0085', 5, 5], ['0426', 5, 5], ['2330', 5, 5]]],
  ['5x5-c', '5×5 C', 'barbell', [['0739', 5, 5], ['0047', 5, 5], ['1323', 5, 5]]]
]

// ---------------------------------------------------------------------------------------------
// Program 0 — 5-Day Upper/Lower/Push/Pull/Legs. Autoregulated via RPE (top set + back-off on
// the strength days), volume climbs MEV → MRV across a 6-week block per RP's landmarks, and the
// last set of every accessory is written to land near genuine failure. Week 1 targets only —
// the week-to-week climb and the week-6 deload are a block-level plan the weekly-routine model
// can't hold on its own, so they're spelled out in the plan's chooser description instead.
const ULPPL = [
  ['ulppl-upper', 'Upper (Strength)', 'barbell', [
    ['0025', 1, 3, { weight: 95, note: 'Top set · RPE 8-9' }],
    ['0025', 2, 5, { weight: 85, note: 'Back-off · RPE 7-8' }],
    ['0841', 3, 5, { note: 'Reps 5-8 · RPE 8' }],
    ['0027', 3, 6, { note: 'Reps 6-8 · RPE 8 (or Chest-Supported Row)' }],
    ['0091', 2, 6, { note: 'Reps 6-8 · RPE 7-8' }],
    ['0203', 2, 15, { note: 'Face Pull · RPE 8' }]
  ]],
  ['ulppl-lower', 'Lower (Strength)', 'legs', [
    ['0032', 1, 2, { weight: 158, note: 'Top set · Reps 2-3 · RPE 8-9' }],
    ['0032', 2, 4, { weight: 148, note: 'Back-off · RPE 7-8' }],
    ['0043', 3, 5, { weight: 87, note: 'RPE 7-8' }],
    ['0085', 3, 6, { note: 'Reps 6-8 · RPE 7-8' }],
    ['0605', 3, 10, { note: 'Reps 10-12 · RPE 9 (near failure)' }]
  ]],
  ['ulppl-push', 'Push (Hypertrophy)', 'barbell', [
    ['0314', 3, 8, { note: 'Reps 8-10 · RPE 8' }],
    ['0405', 3, 8, { note: 'Reps 8-10 · RPE 8' }],
    ['0227', 2, 12, { note: 'Cable Fly or Pec Deck · Reps 12-15 · RPE 9' }],
    ['0334', 3, 15, { note: 'Reps 15-20 · RPE 9-10 (failure)' }],
    ['0241', 3, 10, { note: 'Triceps Pushdown or Skull Crusher · Reps 10-12 · RPE 9' }]
  ]],
  ['ulppl-pull', 'Pull (Hypertrophy)', 'pullup', [
    ['2330', 3, 8, { note: 'Lat Pulldown or Chin-Up · Reps 8-10 · RPE 8' }],
    ['1323', 3, 10, { note: 'Seated Cable Row · Reps 10-12 · RPE 8' }],
    ['0238', 2, 12, { note: 'Straight-Arm Pulldown or Pullover · Reps 12-15 · RPE 8-9' }],
    ['0383', 2, 15, { note: 'Rear Delt Fly / Reverse Pec Deck · RPE 9' }],
    ['0031', 3, 8, { note: 'Reps 8-10 · RPE 9-10 (failure)' }]
  ]],
  ['ulppl-legs', 'Legs (Hypertrophy)', 'legs', [
    ['0739', 3, 8, { note: 'Leg Press or Front Squat · Reps 8-10 · RPE 8' }],
    ['0586', 3, 10, { note: 'Reps 10-12 · RPE 9' }],
    ['1460', 2, 10, { note: 'Walking Lunge or Bulgarian Split Squat · Reps 10/leg · RPE 8' }],
    ['0585', 2, 12, { note: 'Reps 12-15 · RPE 9-10 (failure)' }],
    ['1371', 3, 12, { note: 'Seated Calf Raise · Reps 12-15 · RPE 9-10 (failure)' }]
  ]]
]

// Program 1 — Minimalist HIT (Mentzer): one work set to true failure per exercise, 3x/week.
// Add weight the moment you hit the top of the rep range; two stalled sessions in a row → a
// full week off, not more sets — his literal fix, and the opposite instinct from Program 3.
const HIT = [
  ['hit-a', 'A — Push', 'barbell', [
    ['0025', 1, 6, { note: 'One set to true failure · Reps 6-10' }],
    ['0091', 1, 6, { note: 'One set to true failure · Reps 6-10' }],
    ['0814', 1, 6, { note: 'Weighted if needed · Reps 6-10' }],
    ['0334', 1, 10, { note: 'Reps 10-15' }]
  ]],
  ['hit-b', 'B — Pull', 'pullup', [
    ['0841', 1, 6, { note: 'One set to true failure · Reps 6-10' }],
    ['0027', 1, 6, { note: 'Reps 6-10' }],
    ['0031', 1, 6, { note: 'Reps 6-10' }]
  ]],
  ['hit-c', 'C — Legs', 'legs', [
    ['0043', 1, 6, { note: 'One set to true failure · Reps 6-10' }],
    ['0586', 1, 8, { note: 'Reps 8-12' }],
    ['0605', 1, 10, { note: 'Reps 10-15' }],
    ['0085', 1, 5, { note: 'Deadlift or RDL · Reps 5-8' }]
  ]]
]

// Program 2 — Pure Strength: top-set + back-off on the big three, longer rest, lower reps.
// 4 progressive weeks (+2.5kg/week to top sets when RPE allows) → 1 deload (RPE capped at 6)
// → test new top singles/triples, restart.
const PURE_STRENGTH = [
  ['ps-squat', '1 — Squat', 'legs', [
    ['0043', 1, 3, { weight: 95, note: 'Top set · RPE 8-9' }],
    ['0043', 3, 5, { weight: 83, note: 'Back-off · RPE 7-8' }],
    ['0042', 2, 6, { note: 'Front Squat or Leg Press · RPE 7' }],
    ['0605', 2, 10, { note: 'Standing Calf Raise · RPE 8' }]
  ]],
  ['ps-bench', '2 — Bench', 'barbell', [
    ['0025', 1, 3, { weight: 95, note: 'Top set · RPE 8-9' }],
    ['0025', 3, 5, { weight: 85, note: 'Back-off · RPE 7-8' }],
    ['0091', 3, 5, { note: 'Reps 5-6 · RPE 7' }],
    ['0814', 2, 6, { note: 'Weighted Dip · Reps 6-8 · RPE 7' }]
  ]],
  ['ps-deadlift', '3 — Deadlift', 'legs', [
    ['0032', 1, 2, { weight: 160, note: 'Top set · RPE 8-9' }],
    ['0032', 2, 3, { weight: 145, note: 'Back-off · RPE 7-8' }],
    ['0027', 3, 6, { note: 'RPE 7' }],
    ['0841', 3, 5, { note: 'Reps 5-6 · RPE 7' }]
  ]],
  ['ps-accessory', '4 — Repeat/Accessory', 'barbell', [
    ['0043', 3, 5, { note: 'Pause variation · RPE 7' }],
    ['0030', 3, 6, { note: 'Close-Grip Bench or Incline Press · Reps 6-8 · RPE 7' }],
    ['0085', 3, 6, { note: 'RDL · Reps 6-8 · RPE 7' }],
    ['0203', 2, 12, { note: 'Superset with Curl below · Reps 12-15 · RPE 8', sg: 'ss1' }],
    ['0031', 2, 12, { note: 'Superset with Face Pull above · Reps 12-15 · RPE 8', sg: 'ss1' }]
  ]]
]

// Program 3 — Pure Hypertrophy (RP volume-landmark driven): PPL x2/week, week-1 (MEV) sets
// shown here — weeks 3-5 add a set to whatever's recovering well, climbing toward MRV, then
// week 6 deloads. RIR 0-1 on the isolation work.
const PURE_HYPERTROPHY = [
  ['ph-push', 'Push', 'barbell', [
    ['0047', 3, 6, { note: 'Incline Bench Press · Reps 6-8 · RPE 8' }],
    ['0289', 3, 8, { note: 'Flat DB Press · RPE 8' }],
    ['0405', 3, 8, { note: 'Shoulder Press · RPE 8' }],
    ['0334', 4, 15, { note: 'Reps 15-20 · RPE 9-10' }],
    ['0241', 3, 10, { note: 'Triceps Pushdown · Reps 10-12 · RPE 9' }],
    ['0092', 2, 10, { note: 'Overhead Triceps Extension · Reps 10-12 · RPE 9' }]
  ]],
  ['ph-pull', 'Pull', 'pullup', [
    ['0841', 3, 6, { note: 'Weighted Pull-Up or Lat Pulldown · Reps 6-10 · RPE 8' }],
    ['0027', 3, 8, { note: 'Barbell or Chest-Supported Row · Reps 8-10 · RPE 8' }],
    ['0238', 2, 12, { note: 'Straight-Arm Pulldown · Reps 12-15 · RPE 8-9' }],
    ['0383', 3, 15, { note: 'Rear Delt Fly · Reps 15-20 · RPE 9' }],
    ['0031', 3, 8, { note: 'Barbell Curl · Reps 8-10 · RPE 9' }],
    ['0313', 2, 10, { note: 'Hammer Curl · Reps 10-12 · RPE 9' }]
  ]],
  ['ph-legs', 'Legs', 'legs', [
    ['0043', 3, 6, { note: 'Reps 6-8 · RPE 8' }],
    ['0739', 3, 10, { note: 'Leg Press · Reps 10-12 · RPE 8' }],
    ['0085', 3, 8, { note: 'RDL · Reps 8-10 · RPE 8' }],
    ['0586', 3, 10, { note: 'Leg Curl · Reps 10-12 · RPE 9' }],
    ['0585', 3, 12, { note: 'Leg Extension · Reps 12-15 · RPE 9-10' }],
    ['0605', 2, 10, { note: 'Standing Calf Raise · half of 4 total sets · RPE 9-10' }],
    ['1371', 2, 10, { note: 'Seated Calf Raise · other half of 4 total sets · RPE 9-10' }]
  ]]
]

// Program 4 — Classic Full-Body 3x/Week: all sets to failure, Mon/Wed/Fri. Rotate squat/
// deadlift emphasis weekly by hand — the weekly-routine model repeats the same day, so swap the
// squat entry for a deadlift one (or back) every other week.
const CLASSIC_FULL_BODY = [
  ['fb-classic', 'Full Body', 'figureStrength', [
    ['0043', 1, 8, { note: 'Squat or Leg Press · rotate squat/deadlift emphasis weekly · Reps 8-10' }],
    ['0025', 1, 6, { note: 'To failure · Reps 6-10' }],
    ['0027', 1, 6, { note: 'To failure · Reps 6-10' }],
    ['0091', 1, 6, { note: 'To failure · Reps 6-10' }],
    ['0841', 1, 6, { note: 'To failure · Reps 6-10' }],
    ['0586', 1, 8, { note: 'To failure · Reps 8-12' }],
    ['0605', 1, 10, { note: 'To failure · Reps 10-15' }]
  ]]
]

// Program 5 — Upper/Lower 4-Day (moderate volume): strength-biased A days (top set + back-off),
// hypertrophy-biased B days. RPE 7-9 depending on day type; deload week 5 or 7.
const POWERBUILD_UL = [
  ['pbul-upper-a', 'Upper A (Strength)', 'barbell', [
    ['0025', 1, 3, { note: 'Top set · RPE 8-9' }],
    ['0025', 3, 6, { note: 'Back-off · Reps 6-8 · RPE 7' }],
    ['0027', 3, 6, { note: 'Reps 6-8 · RPE 7-8' }],
    ['0091', 3, 6, { note: 'Reps 6-8 · RPE 7' }]
  ]],
  ['pbul-lower-a', 'Lower A (Strength)', 'legs', [
    ['0043', 1, 3, { note: 'Top set · RPE 8-9' }],
    ['0043', 3, 6, { note: 'Back-off · Reps 6-8 · RPE 7' }],
    ['0085', 3, 6, { note: 'RDL · Reps 6-8 · RPE 7-8' }]
  ]],
  ['pbul-upper-b', 'Upper B (Hypertrophy)', 'barbell', [
    ['0314', 3, 8, { note: 'Incline Press · Reps 8-12 · RPE 8' }],
    ['2330', 3, 8, { note: 'Pulldown · Reps 8-12 · RPE 8' }],
    ['0334', 3, 12, { note: 'Lateral Raise · Reps 12-15 · RPE 9' }],
    ['0031', 3, 8, { note: 'Curl · Reps 8-12 · RPE 9' }]
  ]],
  ['pbul-lower-b', 'Lower B (Hypertrophy)', 'legs', [
    ['0032', 3, 5, { note: 'Deadlift, moderate · Reps 5-6 · RPE 7' }],
    ['0739', 3, 10, { note: 'Leg Press · Reps 10-12 · RPE 8' }],
    ['0586', 3, 10, { note: 'Leg Curl · Reps 10-12 · RPE 9' }],
    ['0605', 3, 12, { note: 'Calves · Reps 12-15 · RPE 9' }]
  ]]
]

// Program 6 — 6-Day PPL (high frequency): each muscle 2x/week, lower per-session volume than
// the dedicated hypertrophy day since each muscle is hit twice.
const PPL_6DAY = [
  ['ppl6-push', 'Push', 'barbell', [
    ['0025', 3, 8, { note: 'Reps 8-12 · RPE 7-8' }],
    ['0091', 3, 8, { note: 'Reps 8-12 · RPE 7-8' }],
    ['0334', 3, 8, { note: 'Reps 8-12 · RPE 7-8' }],
    ['0241', 3, 8, { note: 'Reps 8-12 · RPE 7-8' }]
  ]],
  ['ppl6-pull', 'Pull', 'pullup', [
    ['0027', 3, 8, { note: 'Reps 8-12 · RPE 7-8' }],
    ['2330', 3, 8, { note: 'Reps 8-12 · RPE 7-8' }],
    ['0383', 3, 8, { note: 'Rear Delt · Reps 8-12 · RPE 7-8' }],
    ['0031', 3, 8, { note: 'Reps 8-12 · RPE 7-8' }]
  ]],
  ['ppl6-legs', 'Legs', 'legs', [
    ['0043', 3, 6, { note: 'Reps 6-10 · RPE 7-8' }],
    ['0085', 3, 6, { note: 'Reps 6-10 · RPE 7-8' }],
    ['0586', 3, 6, { note: 'Reps 6-10 · RPE 7-8' }],
    ['0605', 3, 6, { note: 'Calves · Reps 6-10 · RPE 7-8' }]
  ]]
]

// Program 7 — Min-Max 4-Day: low volume, high variety, RIR pushed to 0-1. The middle ground
// between HIT and a full bodybuilding split.
const MINMAX = [
  ['mm-upper', 'Upper', 'barbell', [
    ['0025', 2, 6, { note: 'Reps 6-12 · RIR 0-1' }],
    ['0027', 2, 6, { note: 'Reps 6-12 · RIR 0-1' }],
    ['0091', 2, 6, { note: 'Reps 6-12 · RIR 0-1' }],
    ['2330', 2, 6, { note: 'Reps 6-12 · RIR 0-1' }],
    ['0334', 2, 6, { note: 'Reps 6-12 · RIR 0-1' }],
    ['0031', 2, 6, { note: 'Reps 6-12 · RIR 0-1' }],
    ['0241', 2, 6, { note: 'Triceps · Reps 6-12 · RIR 0-1' }]
  ]],
  ['mm-lower', 'Lower', 'legs', [
    ['0043', 2, 6, { note: 'Reps 6-12 · RIR 0-1' }],
    ['0085', 2, 6, { note: 'RDL · Reps 6-12 · RIR 0-1' }],
    ['0586', 2, 6, { note: 'Leg Curl · Reps 6-12 · RIR 0-1' }],
    ['0585', 2, 6, { note: 'Leg Extension · Reps 6-12 · RIR 0-1' }],
    ['0605', 2, 6, { note: 'Calves · Reps 6-12 · RIR 0-1' }]
  ]]
]

// Program 8 — Cutting-Phase Maintenance: the Program 0 split with accessory sets cut to 2, one
// exercise dropped per session, top-set intensity kept (RPE 8 — strength retention is the
// signal muscle isn't being lost), and no weekly volume progression: hold the line, don't climb.
const CUTTING = [
  ['cut-upper', 'Upper', 'barbell', [
    ['0025', 1, 3, { note: 'Top set · RPE 8 · hold, don’t climb' }],
    ['0841', 2, 6, { note: 'Reps 6-8 · RPE 8' }],
    ['0027', 2, 6, { note: 'Reps 6-8 · RPE 8' }],
    ['0091', 2, 6, { note: 'Reps 6-8 · RPE 8' }]
  ]],
  ['cut-lower', 'Lower', 'legs', [
    ['0032', 1, 3, { note: 'Top set · RPE 8 · hold, don’t climb' }],
    ['0043', 2, 5, { note: 'RPE 8' }],
    ['0085', 2, 6, { note: 'RDL · Reps 6-8 · RPE 8' }]
  ]],
  ['cut-push', 'Push', 'barbell', [
    ['0314', 2, 8, { note: 'Reps 8-10 · RPE 8' }],
    ['0405', 2, 8, { note: 'Reps 8-10 · RPE 8' }],
    ['0334', 2, 15, { note: 'Reps 15-20 · RPE 8' }]
  ]],
  ['cut-pull', 'Pull', 'pullup', [
    ['2330', 2, 8, { note: 'Reps 8-10 · RPE 8' }],
    ['1323', 2, 10, { note: 'Reps 10-12 · RPE 8' }],
    ['0031', 2, 8, { note: 'Reps 8-10 · RPE 8' }]
  ]],
  ['cut-legs', 'Legs', 'legs', [
    ['0739', 2, 8, { note: 'Reps 8-10 · RPE 8' }],
    ['0586', 2, 10, { note: 'Reps 10-12 · RPE 8' }],
    ['0585', 2, 12, { note: 'Reps 12-15 · RPE 8' }]
  ]]
]

// Program 9 — Strength Peak / Test Block (4-5 weeks): one top set per main lift, ramping from
// 3 reps @ RPE 8 (week 1) down to a 1-rep test by week 5, accessory volume dropping each week
// (3 sets → 1). Only run 4-6 weeks max, then return to a normal block.
const PEAK = [
  ['peak-squat', 'Squat Day', 'legs', [
    ['0043', 1, 3, { note: 'Wk1 3@RPE8 · Wk2 2@RPE8-9 · Wk3 1-2@RPE9 · Wk4 taper 1 light@RPE6 · Wk5 test 1 rep max' }],
    ['0739', 3, 6, { note: 'Accessory · drop a set each week (3→1) heading into the test' }]
  ]],
  ['peak-bench', 'Bench Day', 'barbell', [
    ['0025', 1, 3, { note: 'Wk1 3@RPE8 · Wk2 2@RPE8-9 · Wk3 1-2@RPE9 · Wk4 taper 1 light@RPE6 · Wk5 test 1 rep max' }],
    ['0030', 3, 6, { note: 'Accessory · drop a set each week (3→1) heading into the test' }]
  ]],
  ['peak-deadlift', 'Deadlift Day', 'legs', [
    ['0032', 1, 3, { note: 'Wk1 3@RPE8 · Wk2 2@RPE8-9 · Wk3 1-2@RPE9 · Wk4 taper 1 light@RPE6 · Wk5 test 1 rep max' }],
    ['0027', 3, 6, { note: 'Accessory · drop a set each week (3→1) heading into the test' }]
  ]]
]

// Program 10 — Minimal Equipment / Travel: hotel gym, home dumbbells, or bodyweight only. Same
// progression rule as Program 1 — add reps/weight the moment you hit the top of the range.
const TRAVEL = [
  ['travel-fb', 'Full Body', 'figureStrength', [
    ['1760', 1, 10, { note: 'Goblet Squat or DB Squat · To failure · Reps 10-15' }],
    ['0289', 1, 10, { note: 'DB Bench Press or Push-Up · To failure · elevate feet if too easy' }],
    ['0293', 1, 10, { note: 'DB Row, each arm · To failure' }],
    ['0405', 1, 10, { note: 'DB Overhead Press · To failure' }],
    ['0652', 1, 10, { note: 'Pull-Up, any grip available · To failure' }],
    ['1459', 1, 10, { note: 'DB RDL · To failure · Reps 10-15' }]
  ]]
]

// Program 11 — Chest/Back Focus Split: the source doc writes every slot as "pick 1 of N"
// (Nippard's exercise-substitution logic — same muscle, different angle), which the routine
// model can't represent yet. Fixed to one sensible pick per slot until the program-recommender
// / generator grow a real "choose one" mechanism; swapping any exercise for its slot-mates by
// hand loses nothing structurally. RPE 8 on compounds, 9 on isolation/finishers (last set to
// failure, per Mentzer) — the same rule as everywhere else in this file.
const CHEST_BACK_FOCUS = [
  ['cbf-chest', 'Upper (Chest Focus)', 'barbell', [
    ['0025', 3, 8, { note: 'Horizontal push · RPE 8' }],
    ['0227', 3, 12, { note: 'Cable Fly or Chest Fly · squeezing motion · RPE 9' }],
    ['1350', 3, 10, { note: 'Chest-Supported Row or Lat Pulldown · RPE 8' }],
    ['0405', 3, 8, { note: 'Shoulder Press · RPE 8' }],
    ['0203', 2, 15, { note: 'Face Pull · rear delt · RPE 9' }],
    ['0031', 3, 10, { note: 'Barbell Curl · RPE 9-10 (failure)' }],
    ['0241', 3, 10, { note: 'Triceps Pushdown · RPE 9-10 (failure)' }]
  ]],
  ['cbf-back', 'Upper (Back Focus)', 'pullup', [
    ['2330', 3, 8, { note: 'Vertical pull · Lat Pulldown · RPE 8' }],
    ['0027', 3, 8, { note: 'Horizontal pull · Barbell Row · RPE 8' }],
    ['0047', 3, 10, { note: 'Incline Bench or Chest Fly · RPE 8' }],
    ['0334', 3, 12, { note: 'Lateral Raise · RPE 8-9' }],
    ['0383', 2, 15, { note: 'Rear Delt Fly · RPE 9' }],
    ['0313', 3, 10, { note: 'Hammer Curl · RPE 9-10 (failure)' }],
    ['0060', 3, 10, { note: 'Skull Crusher · RPE 9-10 (failure)' }]
  ]],
  ['cbf-legs', 'Legs', 'legs', [
    ['0043', 3, 8, { note: 'RPE 8' }],
    ['0585', 3, 12, { note: 'Leg Extension · quad accessory · RPE 9' }],
    ['0586', 3, 10, { note: 'Leg Curl · posterior chain · RPE 9' }],
    ['0605', 3, 12, { note: 'Standing Calf Raise · RPE 9-10 (failure)' }]
  ]]
]

// ---------------------------------------------------------------------------------------------
// Book-sourced library (program-library-v2): each program below is tagged for the coach engine
// via COACH_META at the bottom of this file (coach_id + mechanic_variant), not inline here —
// this section stays training data only. Every multi-week program's numbers are Week/Wave 1
// only, same convention as ULPPL/PURE_STRENGTH above.

// Heavy Duty (Mike Mentzer): 1 set per exercise to true failure, superset pairs with zero rest
// (even a 3-second gap lets the primary muscle recover up to 50%). Add 10-20% the moment 12+
// reps lands inside the 6-10 target. Two stalled weeks in a row → a full week off, then fewer
// sets and more rest days on resumption, not a straight repeat.
const HEAVY_DUTY = [
  ['hd-day1', 'Day 1 — Pecs/Delts/Triceps', 'barbell', [
    ['0227', 1, 10, { note: 'Cable Fly/Pec Deck · superset with Incline Press, zero rest · one set to true failure · Reps 6-10', sg: 'ss1' }],
    ['0047', 1, 8, { note: 'Incline Press · superset with Fly above · one set to true failure · Reps 6-10', sg: 'ss1' }],
    ['0334', 1, 10, { note: 'Laterals · one set to true failure · Reps 10-15' }],
    ['0383', 1, 12, { note: 'Bent-over DB Laterals (or Pec Deck for rear delts) · one set to true failure' }],
    ['0241', 1, 8, { note: 'Lying French Press/Pressdowns · superset with Dips, zero rest · one set to true failure · Reps 6-10', sg: 'ss2' }],
    ['0814', 1, 8, { note: 'Dips · superset with Triceps above · one set to true failure · Reps 6-10', sg: 'ss2' }]
  ]],
  ['hd-day2', 'Day 2 — Lats/Traps/Erectors/Biceps', 'pullup', [
    ['0073', 1, 10, { note: 'Pullovers · superset with Close-Grip Pulldown, zero rest · one set to true failure', sg: 'ss1' }],
    ['2330', 1, 8, { note: 'Close-grip, palms-up Pulldown · superset with Pullover above · one set to true failure', sg: 'ss1' }],
    ['0027', 1, 8, { note: 'Bent-Over Barbell Row · one set to true failure · Reps 6-10' }],
    ['0095', 1, 10, { note: 'Shrugs · one set to true failure' }],
    ['0489', 1, 12, { note: 'Hyperextensions (or Deadlifts) · one set to true failure' }],
    ['0031', 1, 8, { note: 'Curls · one set to true failure · Reps 6-10' }]
  ]],
  ['hd-day3', 'Day 3 — Legs/Abs', 'legs', [
    ['0585', 1, 12, { note: 'Leg Extensions · superset with Leg Press/Squat, zero rest · one set to true failure', sg: 'ss1' }],
    ['0739', 1, 10, { note: 'Leg Press or Squat, alternate workout to workout · superset with Leg Extension above · one set to true failure', sg: 'ss1' }],
    ['0586', 1, 10, { note: 'Leg Curls · one set to true failure' }],
    ['0605', 1, 12, { note: 'Calf Raises · one set to true failure' }],
    ['0001', 1, 15, { note: 'Sit-Ups' }]
  ]]
]

// Min-Max (4x, Jeff Nippard): last-set-failure — only the final working set per exercise goes
// to target RIR, which tightens across sets (Set1 RIR3 → Set2 RIR2). Squat/incline/leg
// press/Smith lunge get the RIR-0 exception: don't force the failed attempt. Double progression:
// top of the rep range → add weight next session, else extend the range up rather than reset.
// Week 1 (intro) shown; 7-week block, Week 7 deloads on schedule.
const MIN_MAX_4X = [
  ['mm4x-fullbody', 'Day 1 — Full Body', 'figureStrength', [
    ['0586', 2, 7, { note: 'Lying Leg Curl · Reps 6-8 · RIR 1/0' }],
    ['0043', 2, 7, { note: 'Squat (your choice) · Reps 6-8 · RIR 3/2' }],
    ['0047', 2, 7, { note: 'Barbell Incline Press · Reps 6-8 · RIR 2/1' }],
    ['3541', 1, 9, { note: 'Incline DB Y-Raise · Reps 8-10' }],
    ['1429', 2, 7, { note: 'Pull-Up (Wide Grip) · Reps 6-8 · RIR 2/1' }],
    ['0605', 1, 7, { note: 'Standing Calf Raise · Reps 6-8' }]
  ]],
  ['mm4x-upper', 'Day 2 — Upper', 'barbell', [
    ['2330', 2, 9, { note: 'Close-Grip Lat Pulldown · Reps 8-10 · RIR 2/1' }],
    ['1349', 2, 9, { note: 'Chest-Supported T-Bar Row · Reps 8-10 · RIR 2/1' }],
    ['0604', 1, 7, { note: 'Machine Shrug · Reps 6-8' }],
    ['0576', 2, 9, { note: 'Machine Chest Press · Reps 8-10 · RIR 2/1' }],
    ['0334', 2, 9, { note: 'High-Cable Lateral Raise · Reps 8-10 · RIR 1/0' }],
    ['0383', 1, 9, { note: '1-Arm Reverse Pec Deck · Reps 8-10' }],
    ['0472', 2, 7, { note: 'Cable Crunch (Hanging Leg Raise substitute) · Reps 6-8 · RIR 1/0' }]
  ]],
  ['mm4x-lower', 'Day 3 — Lower', 'legs', [
    ['0585', 2, 9, { note: 'Leg Extension · Reps 8-10 · RIR 1/0' }],
    ['0085', 2, 7, { note: 'Barbell RDL · Reps 6-8 · RIR 3/2' }],
    ['1409', 2, 7, { note: 'Machine Hip Thrust (Barbell Glute Bridge substitute) · Reps 6-8 · RIR 2/1' }],
    ['0739', 1, 7, { note: 'Leg Press · Reps 6-8' }],
    ['0605', 2, 9, { note: 'Standing Calf Raise · Reps 8-10 · RIR 1/0' }]
  ]],
  ['mm4x-arms', 'Day 4 — Arms/Delts', 'barbell', [
    ['0868', 2, 7, { note: 'Bayesian Cable Curl · Reps 6-8 · RIR 1/0' }],
    ['0092', 2, 9, { note: 'Overhead Cable Triceps Extension · Reps 8-10 · RIR 1/0' }],
    ['0439', 1, 9, { note: 'Modified Zottman Curl · Reps 8-10' }],
    ['0333', 2, 9, { note: 'Cable Triceps Kickback · Reps 8-10 · RIR 1/0' }],
    ['0126', 2, 9, { note: 'DB Wrist Curl · Reps 8-10 · RIR 1/0' }],
    ['0385', 2, 9, { note: 'DB Wrist Extension · Reps 8-10 · RIR 1/0' }],
    ['0416', 1, 7, { note: 'Alternating DB Curl · Reps 6-8' }],
    ['0334', 2, 9, { note: 'Machine Lateral Raise · Reps 8-10 · RIR 1/0' }]
  ]]
]

// Min-Max (5 Days, Jeff Nippard): same rules as the 4x version, split across a 5th day instead
// (Upper 1 / Lower 1 / Upper 2 / Lower 2 / Arms-Delts). Upper 2, Lower 2 and Arms/Delts are
// identical to the 4x version's Day 2, Day 3 and Day 4 — reused verbatim below.
const MIN_MAX_5X = [
  ['mm5x-upper1', 'Day 1 — Upper 1', 'barbell', [
    ['0047', 2, 7, { note: 'Barbell Incline Press · Reps 6-8 · RIR 2/1' }],
    ['0227', 2, 7, { note: 'Pec Deck (Cable Fly substitute) · Reps 6-8 · RIR 1/0' }],
    ['3541', 2, 9, { note: 'Incline DB Y-Raise · Reps 8-10 · RIR 1/0' }],
    ['1429', 2, 7, { note: 'Pull-Up (Wide Grip) · Reps 6-8 · RIR 2/1' }],
    ['0095', 2, 7, { note: 'Kelso Shrug (Barbell Shrug substitute) · Reps 6-8 · RIR 2/1' }],
    ['0070', 2, 7, { note: 'EZ-Bar Preacher Curl · Reps 6-8 · RIR 1/0' }],
    ['0241', 2, 7, { note: 'Triceps Pressdown · Reps 6-8 · RIR 1/0' }],
    ['0472', 2, 7, { note: 'Dragon Flag (Hanging Leg Raise substitute) · Reps 6-8 · RIR 1/0' }]
  ]],
  ['mm5x-lower1', 'Day 2 — Lower 1', 'legs', [
    ['0586', 2, 7, { note: 'Lying Leg Curl · Reps 6-8 · RIR 1/0' }],
    ['0043', 2, 7, { note: 'Squat (your choice) · Reps 6-8 · RIR 3/2' }],
    ['1460', 1, 7, { note: 'Smith Machine Lunge (Walking Lunge substitute) · Reps 6-8 · RIR 1' }],
    ['0585', 2, 7, { note: 'Leg Extension · Reps 6-8 · RIR 1/0' }],
    ['0597', 1, 7, { note: 'Machine Hip Abduction · Reps 6-8' }],
    ['0605', 2, 7, { note: 'Standing Calf Raise · Reps 6-8 · RIR 1/0' }]
  ]],
  ['mm5x-upper2', 'Day 3 — Upper 2', 'barbell', [
    ['2330', 2, 9, { note: 'Close-Grip Lat Pulldown · Reps 8-10 · RIR 2/1' }],
    ['1349', 2, 9, { note: 'Chest-Supported T-Bar Row · Reps 8-10 · RIR 2/1' }],
    ['0604', 1, 7, { note: 'Machine Shrug · Reps 6-8' }],
    ['0576', 2, 9, { note: 'Machine Chest Press · Reps 8-10 · RIR 2/1' }],
    ['0334', 2, 9, { note: 'High-Cable Lateral Raise · Reps 8-10 · RIR 1/0' }],
    ['0383', 1, 9, { note: '1-Arm Reverse Pec Deck · Reps 8-10' }],
    ['0472', 2, 7, { note: 'Cable Crunch (Hanging Leg Raise substitute) · Reps 6-8 · RIR 1/0' }]
  ]],
  ['mm5x-lower2', 'Day 4 — Lower 2', 'legs', [
    ['0585', 2, 9, { note: 'Leg Extension · Reps 8-10 · RIR 1/0' }],
    ['0085', 2, 7, { note: 'Barbell RDL · Reps 6-8 · RIR 3/2' }],
    ['1409', 2, 7, { note: 'Machine Hip Thrust (Barbell Glute Bridge substitute) · Reps 6-8 · RIR 2/1' }],
    ['0739', 1, 7, { note: 'Leg Press · Reps 6-8' }],
    ['0605', 2, 9, { note: 'Standing Calf Raise · Reps 8-10 · RIR 1/0' }]
  ]],
  ['mm5x-arms', 'Day 5 — Arms/Delts', 'barbell', [
    ['0868', 2, 7, { note: 'Bayesian Cable Curl · Reps 6-8 · RIR 1/0' }],
    ['0092', 2, 9, { note: 'Overhead Cable Triceps Extension · Reps 8-10 · RIR 1/0' }],
    ['0439', 1, 9, { note: 'Modified Zottman Curl · Reps 8-10' }],
    ['0333', 2, 9, { note: 'Cable Triceps Kickback · Reps 8-10 · RIR 1/0' }],
    ['0126', 2, 9, { note: 'DB Wrist Curl · Reps 8-10 · RIR 1/0' }],
    ['0385', 2, 9, { note: 'DB Wrist Extension · Reps 8-10 · RIR 1/0' }],
    ['0416', 1, 7, { note: 'Alternating DB Curl · Reps 6-8' }],
    ['0334', 2, 9, { note: 'Machine Lateral Raise · Reps 8-10 · RIR 1/0' }]
  ]]
]

// Min-Max Phase 2: Peak Physique (4x, Jeff Nippard) — opposite mechanic from original Min-Max:
// first-set-to-failure, RIR *loosens* across sets. Extra volume comes from appended "burnout"
// sets (same exercise, 0 warm-up, much higher reps) rather than more exercises — each burnout
// below is written as a second entry for the same exercise id, same pattern ULPPL already uses
// for top-set/back-off pairs. Split: Upper/Lower/Push/Pull, arm volume folded into the other four
// days (the 5x version below restores a dedicated Arms day instead).
const MIN_MAX_P2_4X = [
  ['mm2-4x-upper', 'Day 1 — Upper', 'barbell', [
    ['0576', 2, 5, { note: 'Machine Chest Press · Reps 4-6 · RIR 1/2' }],
    ['0576', 1, 20, { note: 'Machine Chest Press (burnout set) · Reps 20 · RIR 1' }],
    ['0073', 1, 9, { note: 'Machine Lat Pullover (Barbell Pullover substitute) · Reps 8-10 · RIR 0' }],
    ['0073', 1, 20, { note: 'Machine Lat Pullover (burnout set) · Reps 20 · RIR 0' }],
    ['0227', 2, 11, { note: 'Pec Deck (Cable Fly substitute) · Reps 10-12 · RIR 0/1' }],
    ['1349', 2, 7, { note: 'Chest-Supported T-Bar Row · Reps 6-8 · RIR 1/2' }],
    ['3541', 3, 11, { note: 'Incline DB Y-Raise · Reps 10-12 · RIR 0/1/1' }],
    ['0447', 2, 5, { note: 'S1: EZ-Bar Cheat Curl · superset with Skull Crusher below, zero rest · Reps 4-6 · RIR 0/1', sg: 'ss1' }],
    ['0060', 2, 7, { note: 'S1: EZ-Bar Skull Crusher · superset with Curl above · Reps 6-8 · RIR 0/1', sg: 'ss1' }]
  ]],
  ['mm2-4x-lower', 'Day 2 — Lower', 'legs', [
    ['0599', 3, 7, { note: 'Seated Leg Curl · Reps 6-8 · RIR 0/1/1' }],
    ['0046', 2, 5, { note: 'Hack Squat · Reps 4-6 · RIR 2/3' }],
    ['0585', 2, 7, { note: 'Leg Extension · Reps 6-8 · RIR 0/1' }],
    ['0585', 1, 20, { note: 'Leg Extension (burnout set) · Reps 20 · RIR 1' }],
    ['1460', 1, 10, { note: 'DB Walking Lunge · Reps 10/leg · RIR 1' }],
    ['0605', 3, 11, { note: 'Standing Calf Raise · Reps 10-12 · RIR 0/1/1' }],
    ['0333', 1, 30, { note: 'Glute Kickback (DB Kickback substitute) · Reps 30 · RIR 1' }]
  ]],
  ['mm2-4x-push', 'Day 3 — Push', 'barbell', [
    ['0405', 2, 5, { note: 'Machine Shoulder Press · Reps 4-6 · RIR 1/2' }],
    ['0289', 1, 10, { note: 'DB Bench Press · Reps 10 · RIR 1' }],
    ['0289', 1, 20, { note: 'DB Bench Press (burnout set) · Reps 20 · RIR 1' }],
    ['0585', 1, 20, { note: 'Single-Leg Leg Extension · Reps 20 · RIR 1' }],
    ['0334', 1, 10, { note: 'Machine Lateral Raise · Reps 10 · RIR 0' }],
    ['0334', 1, 20, { note: 'Machine Lateral Raise (burnout set) · Reps 20 · RIR 0' }],
    ['0227', 2, 11, { note: 'Cable Flye · Reps 10-12 · RIR 0/1' }],
    ['0241', 2, 5, { note: 'Triceps Pressdown · Reps 4-6 · RIR 0/1' }]
  ]],
  ['mm2-4x-pull', 'Day 4 — Pull', 'pullup', [
    ['1429', 3, 5, { note: 'Pull-Up (Wide Grip) · Reps 4-6 · RIR 1/2/2' }],
    ['0432', 2, 7, { note: 'Stiff-Leg Deadlift (DB) · Reps 6-8 · RIR 2/3' }],
    ['2330', 1, 10, { note: 'Close-Grip Lat Pulldown · Reps 10 · RIR 1' }],
    ['2330', 1, 20, { note: 'Close-Grip Lat Pulldown (burnout set) · Reps 20 · RIR 1' }],
    ['1350', 2, 5, { note: 'Chest-Supported Machine Row · Reps 4-6 · RIR 1/1' }],
    ['0383', 1, 20, { note: '1-Arm Reverse Pec Deck · Reps 20 · RIR 0' }],
    ['0383', 1, 10, { note: '1-Arm Reverse Pec Deck (burnout set) · Reps 10 · RIR 0' }],
    ['0070', 2, 7, { note: 'Preacher Hammer Curl · Reps 6-8 · RIR 0/1' }],
    ['0472', 2, 7, { note: 'Cable Crunch (Hanging Leg Raise substitute) · Reps 6-8 · RIR 0/1' }]
  ]]
]

// Min-Max Phase 2: Peak Physique (5x, Jeff Nippard) — same rules as the 4x version, but restores
// a dedicated Arms day; the arm-isolation picks are pulled out of Upper/Pull below and moved
// there instead (Lower and Push are unchanged from the 4x version).
const MIN_MAX_P2_5X = [
  ['mm2-5x-upper', 'Day 1 — Upper', 'barbell', [
    ['0576', 2, 5, { note: 'Machine Chest Press · Reps 4-6 · RIR 1/2' }],
    ['0576', 1, 20, { note: 'Machine Chest Press (burnout set) · Reps 20 · RIR 1' }],
    ['0073', 1, 9, { note: 'Machine Lat Pullover (Barbell Pullover substitute) · Reps 8-10 · RIR 0' }],
    ['0073', 1, 20, { note: 'Machine Lat Pullover (burnout set) · Reps 20 · RIR 0' }],
    ['0227', 2, 11, { note: 'Pec Deck (Cable Fly substitute) · Reps 10-12 · RIR 0/1' }],
    ['1349', 2, 7, { note: 'Chest-Supported T-Bar Row · Reps 6-8 · RIR 1/2' }],
    ['3541', 3, 11, { note: 'Incline DB Y-Raise · Reps 10-12 · RIR 0/1/1' }]
  ]],
  ['mm2-5x-lower', 'Day 2 — Lower', 'legs', [
    ['0599', 3, 7, { note: 'Seated Leg Curl · Reps 6-8 · RIR 0/1/1' }],
    ['0046', 2, 5, { note: 'Hack Squat · Reps 4-6 · RIR 2/3' }],
    ['0585', 2, 7, { note: 'Leg Extension · Reps 6-8 · RIR 0/1' }],
    ['0585', 1, 20, { note: 'Leg Extension (burnout set) · Reps 20 · RIR 1' }],
    ['1460', 1, 10, { note: 'DB Walking Lunge · Reps 10/leg · RIR 1' }],
    ['0605', 3, 11, { note: 'Standing Calf Raise · Reps 10-12 · RIR 0/1/1' }],
    ['0333', 1, 30, { note: 'Glute Kickback (DB Kickback substitute) · Reps 30 · RIR 1' }]
  ]],
  ['mm2-5x-push', 'Day 3 — Push', 'barbell', [
    ['0405', 2, 5, { note: 'Machine Shoulder Press · Reps 4-6 · RIR 1/2' }],
    ['0289', 1, 10, { note: 'DB Bench Press · Reps 10 · RIR 1' }],
    ['0289', 1, 20, { note: 'DB Bench Press (burnout set) · Reps 20 · RIR 1' }],
    ['0585', 1, 20, { note: 'Single-Leg Leg Extension · Reps 20 · RIR 1' }],
    ['0334', 1, 10, { note: 'Machine Lateral Raise · Reps 10 · RIR 0' }],
    ['0334', 1, 20, { note: 'Machine Lateral Raise (burnout set) · Reps 20 · RIR 0' }],
    ['0227', 2, 11, { note: 'Cable Flye · Reps 10-12 · RIR 0/1' }],
    ['0241', 2, 5, { note: 'Triceps Pressdown · Reps 4-6 · RIR 0/1' }]
  ]],
  ['mm2-5x-pull', 'Day 4 — Pull', 'pullup', [
    ['1429', 3, 5, { note: 'Pull-Up (Wide Grip) · Reps 4-6 · RIR 1/2/2' }],
    ['0432', 2, 7, { note: 'Stiff-Leg Deadlift (DB) · Reps 6-8 · RIR 2/3' }],
    ['2330', 1, 10, { note: 'Close-Grip Lat Pulldown · Reps 10 · RIR 1' }],
    ['2330', 1, 20, { note: 'Close-Grip Lat Pulldown (burnout set) · Reps 20 · RIR 1' }],
    ['1350', 2, 5, { note: 'Chest-Supported Machine Row · Reps 4-6 · RIR 1/1' }],
    ['0383', 1, 20, { note: '1-Arm Reverse Pec Deck · Reps 20 · RIR 0' }],
    ['0383', 1, 10, { note: '1-Arm Reverse Pec Deck (burnout set) · Reps 10 · RIR 0' }],
    ['0472', 2, 7, { note: 'Cable Crunch (Hanging Leg Raise substitute) · Reps 6-8 · RIR 0/1' }]
  ]],
  ['mm2-5x-arms', 'Day 5 — Arms', 'barbell', [
    ['0447', 2, 5, { note: 'S1: EZ-Bar Cheat Curl · superset with Skull Crusher, zero rest · Reps 4-6 · RIR 0/1', sg: 'ss1' }],
    ['0060', 2, 7, { note: 'S1: EZ-Bar Skull Crusher · superset with Curl above · Reps 6-8 · RIR 0/1', sg: 'ss1' }],
    ['0070', 2, 7, { note: 'S2: Preacher Hammer Curl · superset with Pressdown, zero rest · Reps 6-8 · RIR 0/1', sg: 'ss2' }],
    ['0241', 2, 5, { note: 'S2: Triceps Pressdown · superset with Curl above · Reps 4-6 · RIR 0/1', sg: 'ss2' }],
    ['0126', 2, 11, { note: 'S3: DB Wrist Curl · superset with Wrist Extension, zero rest · Reps 10-12 · RIR 0/1', sg: 'ss3' }],
    ['0385', 2, 11, { note: 'S3: DB Wrist Extension · superset with Wrist Curl above · Reps 10-12 · RIR 0/1', sg: 'ss3' }],
    ['0334', 1, 20, { note: 'Single-Arm Machine Lateral Raise · Reps 20 · RIR 0' }],
    ['0334', 1, 10, { note: 'Single-Arm Machine Lateral Raise (burnout set) · Reps 10 · RIR 0' }]
  ]]
]

// Powerbuilding 3.0 (4x, Jeff Nippard): every "Full Body" day centers on ONE main lift's heavy
// top single/back-off at a prescribed %1RM (RPE given as a secondary ceiling), then accessories.
// Week 1 weights below are computed off this app's own 1RM estimates (squat/bench ~108-110kg,
// deadlift ~177kg) — recalculate once the app can read a lifter's actual 1RM into plan-load time.
const POWERBUILDING_3_4X = [
  ['pb4x-fb1', 'Full Body 1', 'barbell', [
    ['0043', 1, 1, { weight: 94, note: 'Top Single · 85-87.5% 1RM · RPE 6-8' }],
    ['0043', 3, 5, { weight: 82, note: 'Back-off · 75-77.5% 1RM · RPE 7-8' }],
    ['0030', 3, 8, { note: 'Close Grip Bench Press · RPE 6' }],
    ['0085', 2, 9, { note: 'Barbell RDL · Reps 8-10 · RPE 6' }],
    ['1350', 4, 9, { note: 'Chest-Supported Row · Reps 8-10 · RPE 8' }],
    ['0334', 4, 17, { note: 'Dumbbell Lateral Raise · Reps 15-20 · RPE 9' }],
    ['0472', 3, 6, { note: 'Hanging Leg Raise · RPE 8' }]
  ]],
  ['pb4x-fb2', 'Full Body 2', 'barbell', [
    ['0025', 4, 6, { weight: 78, note: '72.5% 1RM · RPE 7-8' }],
    ['0043', 3, 8, { note: 'Anderson Squat (Back Squat substitute) · RPE 6' }],
    ['2330', 4, 7, { note: 'Neutral Grip Pulldown · Reps 6-8 · RPE 9' }],
    ['0060', 3, 9, { note: 'DB Skull Crusher · Reps 8-10 · RPE 10' }],
    ['0031', 4, 7, { note: 'Barbell (or EZ-Bar) Strict Curl · Reps 6-8 · RPE 10' }],
    ['0203', 3, 17, { note: 'Seated Face Pull · Reps 15-20 · RPE 9' }]
  ]],
  ['pb4x-fb3', 'Full Body 3', 'legs', [
    ['0032', 1, 4, { weight: 150, note: '85% 1RM · RPE 8-9' }],
    ['0032', 2, 4, { weight: 120, note: 'Pause Deadlift · 67.5% 1RM · RPE 7' }],
    ['0091', 2, 8, { note: 'Barbell Overhead Press · 70% 1RM · RPE 6' }],
    ['0203', 4, 17, { note: 'Band Pull-Apart (Face Pull substitute) · Reps 15-20 · RPE 9' }],
    ['0073', 3, 17, { note: 'Cable Pullover (Barbell Pullover substitute) · Reps 15-20 · RPE 7' }],
    ['0313', 4, 9, { note: 'Hammer Curl · Reps 8-10 · RPE 9' }],
    ['0605', 3, 11, { note: 'Standing Calf Raise · Reps 10-12 · RPE 10' }]
  ]],
  ['pb4x-fb4', 'Full Body 4', 'barbell', [
    ['0043', 4, 6, { weight: 76, note: '70% 1RM · RPE 7-8' }],
    ['0025', 1, 1, { weight: 95, note: 'Strict Bench Press Top Single · 87.5-90% 1RM · RPE 7-8' }],
    ['0025', 3, 3, { weight: 89, note: '82.5% 1RM · RPE 7-8' }],
    ['0027', 3, 11, { note: 'Helms Row (Barbell Row substitute) · Reps 10-12 · RPE 8' }],
    ['0599', 3, 11, { note: 'Seated Leg Curl · Reps 10-12 · RPE 8' }],
    ['0597', 3, 13, { note: 'Hip Abduction · Reps 12-15 · RPE 8' }]
  ]]
]

// Powerbuilding 3.0 (5x, Jeff Nippard): the same program with a 5th session inserted rather than
// compressed. Full Body 1-3 reuse the 4x version's FB1/FB3(deadlift day)/FB4; 4 and 5 are new.
const POWERBUILDING_3_5X = [
  ['pb5x-fb1', 'Full Body 1', 'barbell', [
    ['0043', 1, 1, { weight: 94, note: 'Top Single · 85-87.5% 1RM · RPE 6-8' }],
    ['0043', 3, 5, { weight: 82, note: 'Back-off · 75-77.5% 1RM · RPE 7-8' }],
    ['0030', 3, 8, { note: 'Close Grip Bench Press · RPE 6' }],
    ['0085', 2, 9, { note: 'Barbell RDL · Reps 8-10 · RPE 6' }],
    ['1350', 4, 9, { note: 'Chest-Supported Row · Reps 8-10 · RPE 8' }],
    ['0334', 4, 17, { note: 'Dumbbell Lateral Raise · Reps 15-20 · RPE 9' }],
    ['0472', 3, 6, { note: 'Hanging Leg Raise · RPE 8' }]
  ]],
  ['pb5x-fb2', 'Full Body 2 (Deadlift)', 'legs', [
    ['0032', 1, 4, { weight: 150, note: '85% 1RM · RPE 8-9' }],
    ['0032', 2, 4, { weight: 120, note: 'Pause Deadlift · 67.5% 1RM · RPE 7' }],
    ['0091', 2, 8, { note: 'Barbell Overhead Press · 70% 1RM · RPE 6' }],
    ['0203', 4, 17, { note: 'Band Pull-Apart (Face Pull substitute) · Reps 15-20 · RPE 9' }],
    ['0073', 3, 17, { note: 'Cable Pullover (Barbell Pullover substitute) · Reps 15-20 · RPE 7' }],
    ['0313', 4, 9, { note: 'Hammer Curl · Reps 8-10 · RPE 9' }],
    ['0605', 3, 11, { note: 'Standing Calf Raise · Reps 10-12 · RPE 10' }]
  ]],
  ['pb5x-fb3', 'Full Body 3', 'barbell', [
    ['0043', 4, 6, { weight: 76, note: '70% 1RM · RPE 7-8' }],
    ['0025', 1, 1, { weight: 95, note: 'Strict Bench Press Top Single · 87.5-90% 1RM · RPE 7-8' }],
    ['0025', 3, 3, { weight: 89, note: '82.5% 1RM · RPE 7-8' }],
    ['0027', 3, 11, { note: 'Helms Row (Barbell Row substitute) · Reps 10-12 · RPE 8' }],
    ['0599', 3, 11, { note: 'Seated Leg Curl · Reps 10-12 · RPE 8' }],
    ['0597', 3, 13, { note: 'Hip Abduction · Reps 12-15 · RPE 8' }]
  ]],
  ['pb5x-fb4', 'Full Body 4 (Deadlift)', 'legs', [
    ['0032', 1, 4, { weight: 150, note: '85% 1RM · RPE 8-9' }],
    ['0032', 2, 4, { weight: 120, note: 'Pause Deadlift · 67.5% 1RM · RPE 7' }],
    ['0334', 4, 17, { note: 'Dumbbell Lateral Raise · Reps 15-20 · RPE 9' }],
    ['0203', 4, 17, { note: 'Band Pull-Apart (Face Pull substitute) · Reps 15-20 · RPE 9' }],
    ['0073', 3, 17, { note: 'Cable Pullover (Barbell Pullover substitute) · Reps 15-20 · RPE 7' }],
    ['0313', 4, 9, { note: 'Hammer Curl · Reps 8-10 · RPE 9' }]
  ]],
  ['pb5x-fb5', 'Full Body 5', 'barbell', [
    ['0043', 4, 6, { weight: 76, note: '70% 1RM · RPE 7-8' }],
    ['0025', 4, 6, { weight: 78, note: '72.5% 1RM · RPE 7-8' }],
    ['0027', 3, 11, { note: 'Helms Row (Barbell Row substitute) · Reps 10-12 · RPE 8' }],
    ['0597', 3, 13, { note: 'Hip Abduction · Reps 12-15 · RPE 8' }]
  ]]
]

// Upper/Lower Size and Strength (4x, Jeff Nippard) — top-set %1RM on the main lifts, RPE-based
// autoregulation everywhere else. "Weak Point" slots are the book's own built-in personalization
// slot (same idea as Program 11's menu picks) — left as a lateral-raise/leg-extension default,
// swap freely. Wave 1 shown; later waves' progression isn't extracted yet.
const UPPER_LOWER_4X_NIPPARD = [
  ['ul4-lower1', 'Day 1 — Lower #1', 'legs', [
    ['0043', 4, 4, { weight: 81, note: '75% 1RM' }],
    ['0432', 3, 10, { note: 'Eccentric-Accentuated Stiff-Leg Deadlift · 4-second lowering phase · RPE 7' }],
    ['1460', 3, 15, { note: 'DB Walking Lunge · Reps 15/leg · RPE 8' }],
    ['0599', 3, 15, { note: 'A1: Seated Leg Curl · superset with Cable Pull-Through, zero rest · RPE 9', sg: 'ss1' }],
    ['0085', 3, 15, { note: 'A2: Cable Pull-Through (RDL substitute) · superset with Leg Curl above · RPE 9', sg: 'ss1' }],
    ['0605', 4, 6, { note: 'Eccentric-Accentuated/Constant-Tension Standing Calf Raise · 6/6 tempo · RPE 8' }],
    ['0472', 4, 30, { note: 'Cable Crunch (Hanging Leg Raise substitute) · RPE 8' }]
  ]],
  ['ul4-upper1', 'Day 2 — Upper #1', 'barbell', [
    ['0025', 4, 6, { weight: 76, note: '70% 1RM' }],
    ['2330', 3, 11, { note: 'Lat Pulldown · RPE 8' }],
    ['0091', 3, 11, { note: 'Barbell Overhead Press · RPE 7' }],
    ['1350', 3, 13, { note: 'Seated T-Bar Row · RPE 8' }],
    ['0314', 3, 9, { note: 'Pause Dumbbell Incline Press · RPE 7' }],
    ['0060', 3, 13, { note: 'Myo Reps Floor Skull Crusher · 8 reps, rest 5s, 2 reps, rest 5s, 2 reps · RPE 9' }],
    ['0334', 3, 17, { note: 'Upper Body Weak Point 1 (plug in your own lagging area) · Reps 15-20 · RPE 9' }]
  ]],
  ['ul4-lower2', 'Day 3 — Lower #2', 'legs', [
    ['0032', 2, 5, { weight: 142, note: '80% 1RM' }],
    ['0043', 3, 8, { weight: 76, note: '70% 1RM' }],
    ['1409', 4, 13, { note: 'Barbell Hip Thrust · Reps 12 · RPE 8' }],
    ['0585', 3, 13, { note: 'Unilateral Eccentric-Overloaded Leg Extension · 12/leg, bilateral up/unilateral down · RPE 8' }],
    ['0586', 3, 21, { note: 'Constant-Tension Lying Leg Curl · no pause between reps · RPE 8' }],
    ['0585', 3, 17, { note: 'Lower Body Weak Point 1 (plug in your own lagging area) · Reps 15-20 · RPE 9' }]
  ]],
  ['ul4-upper2', 'Day 4 — Upper #2', 'pullup', [
    ['1429', 3, 6, { note: 'Wide-Grip Pull-Up · RPE 7' }],
    ['0047', 4, 8, { weight: 71, note: '65% 1RM' }],
    ['0027', 3, 10, { note: 'Pendlay Row / Barbell Bent Over Row · 10/10 · RPE 8' }],
    ['0227', 3, 21, { note: 'A1: Cable Flye 21s (7/7/7) · superset with Face Pull, zero rest · RPE 8', sg: 'ss1' }],
    ['0203', 3, 15, { note: 'A2: Face Pull · superset with Flye above · RPE 8', sg: 'ss1' }],
    ['0334', 3, 12, { note: 'Machine Lateral Raise (dropset) · 12/12 · RPE 9' }],
    ['0416', 3, 15, { note: 'Supinated Dumbbell Curl · RPE 8' }],
    ['0334', 3, 17, { note: 'Upper Body Weak Point 1 (plug in your own lagging area) · Reps 15-20 · RPE 9' }]
  ]]
]

// Dysfunctional Lifter's Handbook — 3-Day PPL (Condensed): double progression (8-12 reps, top
// of range → +2.5-5lb, 5-10% guardrail on any single jump), 0-1 RIR on most sets, true failure
// reserved for isolation work. Deload on a performance plateau over "a couple of weeks."
const DLH_3DAY_PPL = [
  ['dlh3-push', 'Push (Chest/Shoulders/Triceps)', 'barbell', [
    ['0025', 3, 9, { note: 'Reps 8-10' }],
    ['0091', 3, 9, { note: 'Seated Overhead Shoulder Press · Reps 8-10' }],
    ['0227', 3, 11, { note: 'Chest Fly (DB or Machine) · Reps 10-12' }],
    ['0334', 3, 12, { note: 'Lateral Raise · Reps 12' }],
    ['0241', 3, 11, { note: 'Triceps Cable Extension · Reps 10-12' }]
  ]],
  ['dlh3-pull', 'Pull (Back/Biceps)', 'pullup', [
    ['0032', 3, 7, { note: 'Barbell Deadlift (or Bent-Over Row) · Reps 6-8' }],
    ['2330', 3, 9, { note: 'Lat Pull-Down (or Pull-Up) · Reps 8-10' }],
    ['1323', 3, 11, { note: 'Seated Cable Row · Reps 10-12' }],
    ['0203', 3, 12, { note: 'Face Pull · Reps 12' }],
    ['0031', 3, 11, { note: 'Barbell Biceps Curl · Reps 10-12' }]
  ]],
  ['dlh3-legs', 'Legs (Quads/Hams/Glutes/Calves/Abs)', 'legs', [
    ['0043', 3, 9, { note: 'Back Squat · Reps 8-10' }],
    ['0085', 3, 9, { note: 'Romanian Deadlift · Reps 8-10' }],
    ['0739', 3, 11, { note: 'Leg Press (or DB Lunge) · Reps 10-12' }],
    ['0586', 3, 11, { note: 'Leg Curl · Reps 10-12' }],
    ['0605', 4, 13, { note: 'Standing Calf Raise · Reps 12-15' }],
    ['0472', 3, 15, { note: '(Optional) Weighted Ab Crunches · Reps 15' }]
  ]]
]

// Dysfunctional Lifter's Handbook — 6-Day PPL (Condensed): same rules as the 3-day version, each
// PPL day hit twice a week with varied exercises the second time — recommended as 3-on/1-off/3-on
// rather than six straight days.
const DLH_6DAY_PPL = [
  ['dlh6-push', 'Push', 'barbell', [
    ['0025', 3, 9, { note: 'Reps 8-10' }],
    ['0091', 3, 9, { note: 'Overhead Shoulder Press · Reps 8-10' }],
    ['0227', 3, 11, { note: 'Chest Fly · Reps 10-12' }],
    ['0241', 3, 11, { note: 'Triceps Pushdown · Reps 10-12' }]
  ]],
  ['dlh6-pull', 'Pull', 'pullup', [
    ['0032', 3, 7, { note: 'Deadlift (or Barbell Row) · Reps 6-8' }],
    ['2330', 3, 9, { note: 'Lat Pull-Down (or Pull-Up) · Reps 8-10' }],
    ['1323', 3, 11, { note: 'Seated Cable Row · Reps 10-12' }],
    ['0031', 3, 11, { note: 'Barbell Bicep Curl · Reps 10-12' }]
  ]],
  ['dlh6-legs', 'Legs', 'legs', [
    ['0043', 3, 9, { note: 'Back Squat · Reps 8-10' }],
    ['0586', 3, 11, { note: 'Leg Curl (or RDL) · Reps 10-12' }],
    ['0739', 3, 11, { note: 'Leg Press · Reps 10-12' }],
    ['0605', 4, 13, { note: 'Calf Raise · Reps 12-15' }]
  ]],
  ['dlh6-push2', 'Push (variation)', 'barbell', [
    ['0314', 3, 9, { note: 'Incline DB Press · Reps 8-10' }],
    ['0405', 3, 9, { note: 'DB Shoulder Press · Reps 8-10' }],
    ['0334', 3, 12, { note: 'Lateral Raise · Reps 12' }],
    ['0060', 3, 11, { note: 'Skull Crusher · Reps 10-12' }]
  ]],
  ['dlh6-pull2', 'Pull (variation)', 'pullup', [
    ['0027', 3, 9, { note: 'Barbell Row · Reps 8-10' }],
    ['1326', 3, 9, { note: 'Chin-Up · Reps 8-10' }],
    ['0203', 3, 12, { note: 'Face Pull · Reps 12' }],
    ['0313', 3, 11, { note: 'Hammer Curl · Reps 10-12' }]
  ]],
  ['dlh6-legs2', 'Legs (variation)', 'legs', [
    ['0085', 3, 8, { note: 'Romanian Deadlift · Reps 8' }],
    ['1460', 3, 10, { note: 'DB Lunges · Reps 10/leg' }],
    ['0585', 3, 12, { note: 'Leg Extension · Reps 12' }],
    ['1371', 4, 15, { note: 'Seated Calf Raise · Reps 15' }]
  ]]
]

// Dysfunctional Lifter's Handbook — Upper/Lower Split with Full-Body Variation: daily undulating
// periodization by design — the same muscle sees a heavy/low-rep strength day and a moderate/
// high-rep hypertrophy day in the same week on purpose. Deadlift day (6) is deliberately kept
// off squat day (2) so heavy pulling never carries residual squat fatigue. Days 3 and 7 rest.
const DLH_UPPER_LOWER_FULLBODY = [
  ['dlh-ul-upper-str', 'Upper (Strength)', 'barbell', [
    ['0025', 4, 5, { note: '5-6RM · 3-5min rest' }],
    ['0027', 4, 5, { note: 'Bent-Over Barbell Row · 5-6RM' }],
    ['0091', 3, 6, { note: 'Overhead Barbell Press · 5-6RM' }],
    ['0841', 3, 6, { note: 'Weighted Pull-Ups (or Pull-Downs)' }],
    ['0031', 3, 8, { note: '(Optional) Barbell/EZ-Bar Curl' }],
    ['0814', 3, 8, { note: '(Optional) Triceps Dips/Pushdowns' }]
  ]],
  ['dlh-ul-lower-str', 'Lower (Strength)', 'legs', [
    ['0043', 4, 5, { note: '~80-85% 1RM · 3-4min rest' }],
    ['0085', 3, 6, { note: 'Romanian Deadlift' }],
    ['0739', 3, 8, { note: 'Leg Press' }],
    ['0586', 3, 8, { note: 'Leg Curl (Machine)' }],
    ['0605', 3, 10, { note: 'Standing Calf Raise' }]
  ]],
  ['dlh-ul-upper-hyp', 'Upper (Hypertrophy)', 'barbell', [
    ['0314', 3, 9, { note: 'Incline DB Bench Press · 65-75% 1RM · Reps 8-10' }],
    ['1323', 3, 11, { note: 'Seated Cable Row · Reps 10-12' }],
    ['0334', 3, 12, { note: 'DB Lateral Raise · Reps 12' }],
    ['2330', 3, 11, { note: 'Lat Pulldown (or Pull-Ups) · Reps 10-12' }],
    ['0227', 2, 13, { note: 'Cable/Pec-Deck Chest Fly · Reps 12-15' }],
    ['0203', 2, 15, { note: 'Face Pulls · Reps 15' }],
    ['0031', 2, 11, { note: '(Optional) Barbell Curls · Reps 10-12' }],
    ['0060', 2, 11, { note: '(Optional) Skull Crushers · Reps 10-12' }]
  ]],
  ['dlh-ul-lower-hyp', 'Lower (Hypertrophy)', 'legs', [
    ['0739', 3, 11, { note: 'Leg Press (High Rep) · 8-15 reps · Reps 10-12' }],
    ['1460', 3, 10, { note: 'Walking Lunges · Reps 10 steps/leg' }],
    ['0585', 3, 13, { note: 'Leg Extension · Reps 12-15' }],
    ['0586', 2, 13, { note: 'Leg Curl (Machine) · Reps 12-15' }],
    ['1409', 2, 11, { note: 'Hip Thrust/Glute Bridge · Reps 10-12' }],
    ['1371', 3, 13, { note: 'Seated Calf Raise · Reps 12-15' }]
  ]],
  ['dlh-ul-fullbody', 'Full-Body Compound', 'figureStrength', [
    ['0032', 3, 4, { note: 'Conventional Deadlift · Reps 3-5 · 2-3min rest' }],
    ['1700', 3, 5, { note: 'Overhead Push-Press' }],
    ['1326', 3, 7, { note: 'Weighted Chin-Ups · Reps 6-8' }],
    ['0289', 3, 7, { note: 'Dumbbell Bench Press · Reps 6-8' }],
    ['2133', 2, 1, { note: '(Optional) Farmer’s Carry · 30-40yd' }]
  ]]
]

// [weekday, routineKey] — weekday is a DAYN index, so 1 is Monday. Fixed weeks only: every
// plan repeats the same seven days, which is all the weekly plan model can represent.
const PLANS = {
  ppl: { routines: PPL, schedule: [[1, 'push'], [3, 'pull'], [5, 'legs']] },
  'upper-lower': { routines: UPPER_LOWER, schedule: [[1, 'upper-a'], [2, 'lower-a'], [4, 'upper-b'], [5, 'lower-b']] },
  'full-body': { routines: FULL_BODY, schedule: [[1, 'fb-a'], [3, 'fb-b'], [5, 'fb-c']] },
  '5x5': { routines: FIVE_BY_FIVE, schedule: [[1, '5x5-a'], [3, '5x5-b'], [5, '5x5-c']] },

  ulppl: { routines: ULPPL, schedule: [[1, 'ulppl-upper'], [2, 'ulppl-lower'], [3, 'ulppl-push'], [4, 'ulppl-pull'], [5, 'ulppl-legs']] },
  hit: { routines: HIT, schedule: [[1, 'hit-a'], [3, 'hit-b'], [5, 'hit-c']] },
  'pure-strength': { routines: PURE_STRENGTH, schedule: [[1, 'ps-squat'], [2, 'ps-bench'], [4, 'ps-deadlift'], [5, 'ps-accessory']] },
  'pure-hypertrophy': { routines: PURE_HYPERTROPHY, schedule: [[1, 'ph-push'], [2, 'ph-pull'], [3, 'ph-legs'], [4, 'ph-push'], [5, 'ph-pull'], [6, 'ph-legs']] },
  'classic-full-body': { routines: CLASSIC_FULL_BODY, schedule: [[1, 'fb-classic'], [3, 'fb-classic'], [5, 'fb-classic']] },
  'powerbuild-ul': { routines: POWERBUILD_UL, schedule: [[1, 'pbul-upper-a'], [2, 'pbul-lower-a'], [4, 'pbul-upper-b'], [5, 'pbul-lower-b']] },
  'ppl-6day': { routines: PPL_6DAY, schedule: [[1, 'ppl6-push'], [2, 'ppl6-pull'], [3, 'ppl6-legs'], [4, 'ppl6-push'], [5, 'ppl6-pull'], [6, 'ppl6-legs']] },
  minmax: { routines: MINMAX, schedule: [[1, 'mm-upper'], [2, 'mm-lower'], [4, 'mm-upper'], [5, 'mm-lower']] },
  cutting: { routines: CUTTING, schedule: [[1, 'cut-upper'], [2, 'cut-lower'], [3, 'cut-push'], [4, 'cut-pull'], [5, 'cut-legs']] },
  peak: { routines: PEAK, schedule: [[1, 'peak-squat'], [3, 'peak-bench'], [5, 'peak-deadlift']] },
  travel: { routines: TRAVEL, schedule: [[1, 'travel-fb'], [3, 'travel-fb'], [5, 'travel-fb']] },
  'chest-back-focus': { routines: CHEST_BACK_FOCUS, schedule: [[1, 'cbf-chest'], [3, 'cbf-back'], [5, 'cbf-legs']] },

  heavy_duty: { routines: HEAVY_DUTY, schedule: [[1, 'hd-day1'], [3, 'hd-day2'], [5, 'hd-day3']] },
  min_max_4x: { routines: MIN_MAX_4X, schedule: [[1, 'mm4x-fullbody'], [2, 'mm4x-upper'], [4, 'mm4x-lower'], [5, 'mm4x-arms']] },
  min_max_5x: { routines: MIN_MAX_5X, schedule: [[1, 'mm5x-upper1'], [2, 'mm5x-lower1'], [3, 'mm5x-upper2'], [4, 'mm5x-lower2'], [5, 'mm5x-arms']] },
  min_max_phase2_4x: { routines: MIN_MAX_P2_4X, schedule: [[1, 'mm2-4x-upper'], [2, 'mm2-4x-lower'], [4, 'mm2-4x-push'], [5, 'mm2-4x-pull']] },
  min_max_phase2_5x: { routines: MIN_MAX_P2_5X, schedule: [[1, 'mm2-5x-upper'], [2, 'mm2-5x-lower'], [3, 'mm2-5x-push'], [4, 'mm2-5x-pull'], [5, 'mm2-5x-arms']] },
  powerbuilding_3_4x: { routines: POWERBUILDING_3_4X, schedule: [[1, 'pb4x-fb1'], [2, 'pb4x-fb2'], [3, 'pb4x-fb3'], [4, 'pb4x-fb4']] },
  powerbuilding_3_5x: { routines: POWERBUILDING_3_5X, schedule: [[1, 'pb5x-fb1'], [2, 'pb5x-fb2'], [3, 'pb5x-fb3'], [4, 'pb5x-fb4'], [5, 'pb5x-fb5']] },
  upper_lower_4x_nippard: { routines: UPPER_LOWER_4X_NIPPARD, schedule: [[1, 'ul4-lower1'], [2, 'ul4-upper1'], [4, 'ul4-lower2'], [5, 'ul4-upper2']] },
  dlh_3day_ppl: { routines: DLH_3DAY_PPL, schedule: [[1, 'dlh3-push'], [3, 'dlh3-pull'], [5, 'dlh3-legs']] },
  dlh_6day_ppl: { routines: DLH_6DAY_PPL, schedule: [[1, 'dlh6-push'], [2, 'dlh6-pull'], [3, 'dlh6-legs'], [4, 'dlh6-push2'], [5, 'dlh6-pull2'], [6, 'dlh6-legs2']] },
  dlh_upper_lower_fullbody: { routines: DLH_UPPER_LOWER_FULLBODY, schedule: [[1, 'dlh-ul-upper-str'], [2, 'dlh-ul-lower-str'], [4, 'dlh-ul-upper-hyp'], [5, 'dlh-ul-lower-hyp'], [6, 'dlh-ul-fullbody']] }
}

const mkEx = ([id, sets, reps, opts]) => ({
  id, sets, reps, weight: opts?.weight ?? 0,
  ...(opts?.note ? { note: opts.note } : {}),
  ...(opts?.sg ? { sg: opts.sg } : {})
})

const build = routines =>
  routines.map(([, name, emoji, list]) => ({ id: uid(), name, emoji, ex: list.map(mkEx) }))

// Fresh routine objects (new ids) — [push, pull, legs]. The demo build seeds a history on
// top of exactly these three, so this entry point keeps its shape.
export const starterRoutines = () => build(PPL)

// [{ id, days }] for the chooser. The day count is read off the schedule rather than stored
// beside it, so the two can never disagree.
export const starterPlanOptions = () =>
  Object.entries(PLANS).map(([id, { schedule }]) => ({ id, days: schedule.length }))

// The weekdays a plan would claim, or null for an unknown id.
export const starterPlanDays = id => PLANS[id]?.schedule.map(([day]) => day) ?? null

// Fresh routines plus the weekdays to put them on, or null for an unknown id — a caller that
// treats null as "change nothing" can never half-apply a plan.
export const buildStarterPlan = id => {
  const plan = PLANS[id]
  if (!plan) return null
  const routines = build(plan.routines)
  // key → the id just minted for it, so the schedule below names its routine
  const byKey = Object.fromEntries(plan.routines.map(([key], i) => [key, routines[i].id]))
  return { routines, schedule: plan.schedule.map(([day, key]) => ({ day, routineId: byKey[key] })) }
}
