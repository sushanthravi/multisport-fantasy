import { describe, expect, it } from 'vitest'
import { canPick, createDraft, makePick, restoreDraft, roster, snakeTeam } from './model'

const players = [
  ...Array.from({length:13},(_,i)=>({key:`FPL:${i}`,sport:'FPL'})),
  ...Array.from({length:13},(_,i)=>({key:`NFL:${i}`,sport:'NFL'})),
  ...Array.from({length:5},(_,i)=>({key:`F1:${i}`,sport:'F1'})),
]
const byKey = new Map(players.map((p)=>[p.key,p]))

describe('snake draft',()=>{
  it('reverses direction and enforces unique picks and 6/6/2 per team',()=>{
    let draft=createDraft(['Alpha','Bravo'],()=>0.99)
    expect(draft.order).toEqual(['team-1','team-2'])
    expect([0,1,2,3,4,5].map((i)=>snakeTeam(draft.order,i))).toEqual(['team-1','team-2','team-2','team-1','team-1','team-2'])
    for(let i=0;i<12;i++) draft=makePick(draft,players[i],byKey)
    expect(roster(draft,'team-1',byKey).filter((p)=>p.sport==='FPL')).toHaveLength(6)
    expect(canPick(draft,players[12],byKey)).toBe(false)
    expect(canPick(draft,players[0],byKey)).toBe(false)
    for(let i=13;i<25;i++) draft=makePick(draft,players[i],byKey)
    for(let i=26;i<30;i++) draft=makePick(draft,players[i],byKey)
    expect(draft.picks).toHaveLength(28)
    expect(canPick(draft,players[30],byKey)).toBe(false)
    expect(restoreDraft(JSON.stringify(draft),byKey)).toEqual(draft)
  })
})
