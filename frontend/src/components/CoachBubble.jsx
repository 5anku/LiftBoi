import { useState } from 'react'
import { COACH_PERSONAS, coachAvatarSrc } from '../lib/coaches/personas.js'

// A chess.com-style coach line: portrait + speech bubble, one per Suggestion. The portrait is
// user-supplied art (public/coaches/README.md) — before it exists, or if it fails to load, this
// falls back to a plain colored initial so the feature works with zero image assets in place.
export default function CoachBubble({ coachId, message, severity }) {
  const [broken, setBroken] = useState(false)
  const persona = COACH_PERSONAS[coachId] || { name: coachId, tagline: '', color: 'var(--acc)' }
  return <div className={'coach-bubble' + (severity !== 'info' ? ' warn' : '')}>
    {broken || !coachId
      ? <div className="coach-avatar coach-avatar-fallback" style={{ background: persona.color }}>{persona.name[0]}</div>
      : <img className="coach-avatar" src={coachAvatarSrc(coachId)} alt={persona.name} onError={() => setBroken(true)} />}
    <div className="coach-speech">
      <strong>{persona.name}</strong>
      <div>{message}</div>
    </div>
  </div>
}
