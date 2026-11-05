// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import snapshot from '../public/data/draft-catalog.json'
import DraftApp from './DraftApp'

describe('multisport draft interface',()=>{
  beforeEach(()=>{localStorage.clear();vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>snapshot}))})
  afterEach(()=>{cleanup();vi.unstubAllGlobals();localStorage.clear()})
  it('creates a league, drafts across all sports, and restores the draft on reload',async()=>{
    const user=userEvent.setup()
    const view=render(<DraftApp/>)
    await screen.findByRole('heading',{name:/Set your league/})
    await user.selectOptions(screen.getByLabelText('Number of teams'),'2')
    await user.click(screen.getByRole('button',{name:/Randomize order/}))
    expect(screen.getByText(/Round 1 of 14 · Pick 1/)).toBeVisible()
    const pool=document.querySelector('.pool-panel')
    await user.click(within(pool).getByRole('button',{name:'NFL',exact:true}))
    const nfl=within(pool).getAllByRole('button',{name:/^Draft .* \(NFL\)$/})[0]
    await user.click(nfl)
    expect(screen.getByText(/Round 1 of 14 · Pick 2/)).toBeVisible()
    expect(document.querySelectorAll('.history-pick')).toHaveLength(1)
    await user.click(within(pool).getByRole('button',{name:'F1',exact:true}))
    await user.click(within(pool).getAllByRole('button',{name:/^Draft .* \(F1\)$/})[0])
    expect(screen.getByText(/Round 2 of 14 · Pick 3/)).toBeVisible()
    await user.click(within(pool).getByRole('button',{name:'FPL',exact:true}))
    await user.type(within(pool).getByPlaceholderText('Search athlete or team'),'Haaland')
    expect(within(pool).getByText('Erling Haaland')).toBeVisible()
    await user.click(within(pool).getByRole('button',{name:/^Draft Erling Haaland/}))
    expect(document.querySelectorAll('.history-pick')).toHaveLength(3)
    view.unmount()
    render(<DraftApp/>)
    expect(await screen.findByText(/Round 2 of 14 · Pick 4/)).toBeVisible()
    expect(document.querySelectorAll('.history-pick')).toHaveLength(3)
  })
})
