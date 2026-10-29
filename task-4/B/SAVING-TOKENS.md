# The Thirteenth Year: Working Lean (Saving Tokens)

A guide for Daniel and any AI helper working on this game. Goal: get the most game per message, at $0.

## 1. Where things live
- **Play:** https://thepodemail-lgtm.github.io/thirteenth-year/ (the only build; the in-chat Page is retired)
- **Code:** github.com/thepodemail-lgtm/thirteenth-year, split into small files (see README.md)
- **Numbers you can change yourself:** `js/tuning.js` (speed, jump, hearts, enemy and boss health, volumes)
  - Edit link: https://github.com/thepodemail-lgtm/thirteenth-year/edit/main/js/tuning.js
  - Sign in as `thepodemail-lgtm`, change only the digits, tap Commit, wait ~1 minute, reopen the game.
- **Music:** github.com/thepodemail-lgtm/thirteenth-year-music (new tracks get a new file name so phones don't play a cached old one)
- **Art:** `assets/art/` (your images), `assets/art/src/` (originals)

## 2. The big savings, in order
1. **Batch feedback.** Ten notes in one message cost about the same as one. Every round reloads the game.
2. **Fresh chat per stage.** Long chats carry their whole history every reply. Start a new chat with Game Dev for Stage 2; memory carries over.
3. **Change numbers yourself** in `tuning.js` instead of asking.
4. **Bring finished assets.** Your own art and music are far cheaper for me to drop in than to draw or compose. Free tools: Piskel, Lospec pixel editor. Art on a plain white background cuts out cleanest; one pose per frame, side by side.
5. **Approve a one-line plan before big features.** A "yes" or "change X" beats rebuilding the wrong thing.
6. **Keep game talk in this chat**, other topics with other bots.
7. **Short replies are fine.** A thumbs-up is a full yes.

## 3. Playtest order (one focus per session)
1. **Feel** - run, jump, double-jump spin, sword, bow. (Mostly fixable in `tuning.js`.)
2. **Fairness** - enemy placement, cheap hits, pits, restart points. Every death should feel like your own fault.
3. **Readability** - can you always see Vel, enemies and shots?
4. **Boss** - Vaka's pattern, health, difficulty.
5. **Story** - Sanjaya's lines, opening, ending, the moral.
6. **Polish** - art details, sound, music timing.

Don't move on until the current area feels right.

## 4. How to write a feedback note
- **Where:** "second pit after the lanterns"
- **What happened:** "I jumped early but still fell"
- **What you expected:** "I should have cleared it"
- Screenshot only when the *look* is the problem.
- One message per play session.

## 5. Free helpers that can take work off Game Dev
All accounts and keys under **thepodemail@gmail.com**. Free first; nothing paid without Daniel's OK.

| Rank | Tool | Free limit (from research, Oct 2026) | Best for |
|---|---|---|---|
| 1 | Gemini via Google AI Studio | Not published; resets midnight PT. Free input is used to improve Google's products. | Writing and fixing game code, long files |
| 2 | Google Jules | 15 tasks/day, 3 at a time | Making changes directly on the GitHub repo |
| 3 | Groq | 1,000 requests/day | Small jobs: numbers, text, bug checks |
| 4 | OpenRouter | 50/day free; 1,000/day after one-time $10 (needs approval) | Trying many models |
| 5 | GitHub Copilot Free | 2,000 completions + 50 chats/month | Quick code edits on GitHub |

- **Keys:** never paste a key in chat. Tell Game Dev and it sends a secure box.
- **Jules / Copilot:** sign in with GitHub `thepodemail-lgtm`, give access to `thirteenth-year`.
- **Always have Game Dev do the final check.** Helpers sometimes say "done and tested" when it isn't.

## 6. Prompting tips that worked for others (Reddit research)
- Keep a one-page spec: one mechanic, one screen, one win/lose rule. Extra ideas go on a "later" list.
- Build one small slice, test, then update the spec.
- Plan, build and review as separate steps, so the tool doesn't grade its own work.
- Describe the game, not the epic by name, when prompting music tools.
- Stick to one art style or pack.
- Exact bug descriptions and screenshots beat "something feels off".

## 7. Game Dev's own lean habits
- One feedback batch = one edit pass.
- Light checks for small fixes; full screenshot sets only for big visual changes, and it says when heavy checks were skipped.
- Pictures only when the look changed.

## 8. Locked game rules (so nobody re-asks)
- $0 budget, free first, flag any cost before spending.
- Never rip NES art or music.
- No scanlines. Backgrounds light and receding; sprites pop.
- Vel uses a **sword** (never a staff); beam only at full health; second jump is a spinning sword attack.
- Deva mode switches the music (like Mario's star).
- Enemies from Indian mythology. Names: Vel (Kathirvelan), Sanjaya narrates, the Dog, Vaka the rakshasa.
- Reference: Matendoji (Famicom) over the US Crystal Palace; Batman: Return of the Joker for art quality; Strider, Rocket Knight Adventures, Ogre Battle for inspiration.
- Open decision (Daniel's): Hunter/Shiva duel vs Vaka as Stage 1 boss.

## TL;DR
Batch notes, play in the order above, tweak numbers yourself, bring your own art and music, start a fresh chat per stage, and let free helpers (Gemini, Jules) do grunt work with Game Dev checking the result.
