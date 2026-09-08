import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { EXDB } from './exercises-data.js'
import { EXDB_FED } from './exercises-data-fed.js'

// This dataset is committed straight into the repo (unlike the base one, its Unlicense actually
// permits that) — these checks exist so a future refresh can't silently corrupt it or step on
// the base dataset's own ids.
describe('exercises-data-fed (Free Exercise DB)', () => {
  it('every entry has the fields the rest of the app reads off an exercise', () => {
    for (const e of EXDB_FED) {
      expect(e.id, JSON.stringify(e)).toMatch(/^fe\d{4}$/)
      expect(e.n).toBeTruthy()
      expect(e.bp).toBeTruthy()
      expect(e.eq).toBeTruthy()
      expect(Array.isArray(e.st) && e.st.length > 0, e.id).toBe(true)
      expect(e.img).toBe(e.id + '.jpg')
      expect(e.gif).toBeUndefined() // this source has no animations — Media.jsx falls back to img
    }
  })

  it('ids are unique within the fed dataset and never collide with the base dataset', () => {
    const fedIds = EXDB_FED.map(e => e.id)
    expect(new Set(fedIds).size).toBe(fedIds.length)
    const baseIds = new Set(EXDB.map(e => e.id))
    expect(fedIds.some(id => baseIds.has(id))).toBe(false)
  })

  it('never duplicates a name already in the base dataset', () => {
    const baseNames = new Set(EXDB.map(e => e.n.toLowerCase()))
    const dupes = EXDB_FED.filter(e => baseNames.has(e.n.toLowerCase()))
    expect(dupes.map(e => e.n)).toEqual([])
  })

  it('the media-fetch manifest lists exactly the fed dataset\'s own ids, nothing more or less', () => {
    const tsvPath = path.resolve(__dirname, '../../../scripts/fed-image-manifest.tsv')
    const rows = fs.readFileSync(tsvPath, 'utf8').trim().split('\n').map(line => line.split('\t')[0])
    expect(new Set(rows)).toEqual(new Set(EXDB_FED.map(e => e.id)))
  })
})
