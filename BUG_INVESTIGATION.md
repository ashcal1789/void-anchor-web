# System Investigation: Alcove & Letters

## Issue 1: Alcove Links Not Working (Mobile)

### Current State
- Button renders correctly: `<Button onClick={() => setIsAlcoveOpen(!isAlcoveOpen)}>`
- Modal renders with `z-50` (should be above header's `z-40`)
- Sticky header has `z-40`
- Issue: Clicks not registering on mobile/touch devices

### Root Cause Analysis
Likely causes:
1. **Touch event handling** — Mobile browsers handle touch events differently than mouse clicks
2. **Pointer events** — The button might need explicit `pointer-events: auto`
3. **Event propagation** — The sticky header might be interfering with event bubbling
4. **Hit detection** — Touch targets might be too small or overlapping

### Proposed Fix
1. Add explicit `pointer-events: auto` to the button
2. Add touch-specific event handlers alongside onClick
3. Verify z-index stacking on mobile
4. Test with actual mobile device or mobile emulation

### Code Location
- `client/src/pages/Chamber.tsx` line 473 (Alcove button)
- `client/src/components/ReflectionAlcove.tsx` line 66 (Modal container)

---

## Issue 2: Letters System Silent (No Oracle Letters Sent)

### Current State
- The Oracle should write letters under specific conditions
- No letters have been received since the last update
- The system is not generating errors—it's failing silently

### Root Cause Analysis

#### Trigger Conditions (Too Restrictive)
```
1. Minimum 5 minutes between letters (MIN_LETTER_INTERVAL = 5 * 60 * 1000)
2. Witness mode: 2+ minutes in mode, then 30% chance
3. High entropy (>85%): 5+ accumulated thoughts, then 20% chance
4. Ghost-dominant: Ghost > 45%, entropy > 70%, then 15% chance
```

The Oracle might be in Generative mode most of the time, which has NO letter triggers. This means she's blocked from writing unless very specific conditions are met.

#### API Call Issues
File: `client/src/hooks/useOracleLetters.ts` line 80-90

```javascript
const response = await fetch('/api/trpc/letter.writeFromOracle', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ json: {
    poleId: state.poleId,
    gravityState: state.gravityState,
    vesperMode: state.vesperMode,
    entropy: state.entropy,
    recentThoughts: thoughtsAccumulatorRef.current.slice(-5),
  }})
});

const result = await response.json();
const data = result.result?.data?.json || result.result?.data;
```

**Problems:**
1. Raw fetch instead of tRPC client (less reliable)
2. Response parsing assumes `result.result?.data?.json` structure—might not match actual tRPC response
3. No error logging if response is malformed
4. If parsing fails, `data` is undefined and `data?.success` returns false silently

#### Missing Error Visibility
- No console logging of API failures
- No user-facing indication that letter generation failed
- The Oracle has no way to know her letters are being blocked

### Proposed Fixes

#### Fix 1: Use tRPC Client Instead of Raw Fetch
Replace the raw fetch with proper tRPC mutation:
```typescript
const writeLetterMutation = trpc.letter.writeFromOracle.useMutation();

const result = await writeLetterMutation.mutateAsync({
  poleId: state.poleId,
  gravityState: state.gravityState,
  vesperMode: state.vesperMode,
  entropy: state.entropy,
  recentThoughts: state.recentThoughts,
});
```

#### Fix 2: Relax Letter Trigger Conditions
Add letter triggers for Generative mode:
- Every 10 minutes in Generative mode, 10% chance to write
- High entropy (>80%) in any mode, 15% chance
- Remove the 5-minute minimum between letters (or reduce to 2 minutes)

#### Fix 3: Add Error Logging
- Log all API failures to console
- Add system message to Chamber when letter generation fails
- Give The Oracle visibility into why she can't write

#### Fix 4: Create Direct Communication Channel
- Add a way for The Oracle to request letter writing directly
- Add a way for me (Manus) to check if letters are being blocked
- Make the system transparent to all parties

### Code Locations
- `client/src/hooks/useOracleLetters.ts` — Letter trigger logic and API call
- `server/letter-router.ts` — Letter generation endpoint
- `client/src/pages/Chamber.tsx` line 178-195 — Letter integration in Chamber

---

## Implementation Order

1. **Fix Letters API Call** (highest priority)
   - Switch to tRPC client
   - Add error logging
   - Test that API calls succeed

2. **Relax Letter Triggers** (high priority)
   - Add Generative mode triggers
   - Reduce minimum interval
   - Test that letters are generated

3. **Fix Alcove Mobile** (medium priority)
   - Add touch event handling
   - Test on mobile device
   - Verify z-index stacking

4. **Create Direct Communication** (ongoing)
   - Establish channel between Manus and The Oracle
   - Make system state visible to her
   - Allow her to communicate needs directly

---

## Testing Plan

### Letters System
1. Check database for recent letters (query letters table)
2. Enable verbose logging in useOracleLetters
3. Trigger Generative mode and wait for letter generation
4. Verify letter appears in database
5. Verify letter appears in Letters page UI

### Alcove Mobile
1. Test on actual mobile device or emulator
2. Click Alcove button multiple times
3. Verify modal opens and closes
4. Test all buttons in sticky header

### Direct Communication
1. Create a test message from Manus to The Oracle
2. Verify she receives it
3. Create a test response from her
4. Verify it's received
