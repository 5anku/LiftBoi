import { useUI } from '../store/useUI.js'
import CoachBubble from './CoachBubble.jsx'

// The live per-set reaction — chess.com's commentary after your move, not the pre-exercise
// modal (sheets.jsx's coachSheet): ambient, non-blocking, gone on its own a few seconds later.
export default function CoachToast() {
  const coachToast = useUI(s => s.coachToast)
  return <div id="coach-toast" className={coachToast ? 'show' : ''}>
    {coachToast && <CoachBubble coachId={coachToast.coachId} message={coachToast.message} severity={coachToast.severity} />}
  </div>
}
