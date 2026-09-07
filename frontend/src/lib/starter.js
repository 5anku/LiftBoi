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
  travel: { routines: TRAVEL, schedule: [[1, 'travel-fb'], [3, 'travel-fb'], [5, 'travel-fb']] }
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
