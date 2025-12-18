# Preservation Core - Important Clarifications

## Overview

**The goal:** Let game studios eliminate unfair online losses when a player disconnects due to internet issues instead of quitting.

**How it works:** Studios simply add a small API call in their existing disconnect handler that sends basic connection data and applies the yes/no decision it returns.

---

## 1. What Preservation Core Does (and Doesn't Do)

### What Preservation Core Does:
✅ **Only decides whether a disconnect results in a loss or not**

Preservation Core is a decision-making service. It analyzes disconnect data and tells you:
- "Apply a loss" (`lossApplied: true`)
- "Don't apply a loss" (`lossApplied: false`)

### What Preservation Core Does NOT Do:
❌ **Does NOT manage match state**
❌ **Does NOT store scores**
❌ **Does NOT control match flow**
❌ **Does NOT handle reconnections**

**The game always owns:**
- Match state (running, paused, ended, etc.)
- Scores and game progress
- Player data and records
- Match rules and logic
- Reconnection logic
- Everything else about the match

**Think of it like this:** Preservation Core is a consultant that gives you advice. You (the game) make all the decisions and control everything. We just tell you: "This disconnect should count as a loss" or "This disconnect should not count as a loss."

---

## 2. What "Preserve Match" Means in Practice

When Preservation Core returns `lossApplied: false` (preserve match), here's what that means:

### The Decision:
**"This disconnect was unintentional (network problem), so don't count it as a loss."**

### What You (the Developer) Should Do:

Preservation Core doesn't tell you HOW to preserve the match - that's up to your game. Here are common approaches:

#### Option A: Mark as "No Contest"
- Don't record a loss for the disconnected player
- Don't record a win for the opponent
- Match doesn't count toward rankings
- **Example:** "Match ended due to connection issue - no contest"

#### Option B: Allow Reconnection
- Keep the match state active
- Allow player to reconnect within a time window
- Resume match when they reconnect
- If they don't reconnect in time, then decide (no contest or loss)
- **Example:** "Connection lost - reconnecting... (30 seconds remaining)"

#### Option C: Pause and Wait
- Pause the match
- Wait for player to reconnect
- Resume when they return
- If timeout expires, mark as no contest
- **Example:** Match pauses, shows "Waiting for player to reconnect"

#### Option D: Cancel Match
- Cancel the entire match
- No wins or losses recorded
- Players can queue again
- **Example:** "Match cancelled due to connection issue"

### Important Notes:

- **Preservation Core doesn't choose the approach** - You decide what "preserve" means for your game
- **The decision is just about the loss** - We're saying "don't count this as a loss," not "do this specific thing"
- **Your game logic handles everything else** - Match state, reconnection, UI, etc. are all your responsibility

### Example Implementation:

```javascript
// When Preservation Core says "preserve match"
if (result.lossApplied === false) {
  // You decide what to do - here are some options:
  
  // Option 1: Mark as no contest
  markMatchAsNoContest(matchId);
  
  // Option 2: Allow reconnection
  enableReconnectionWindow(playerId, 30); // 30 seconds to reconnect
  
  // Option 3: Pause match
  pauseMatch(matchId);
  waitForReconnection(playerId, 60); // 60 seconds timeout
  
  // Option 4: Cancel match
  cancelMatch(matchId);
  
  // Whatever fits your game design
}
```

**Bottom line:** `lossApplied: false` means "don't count this as a loss." Everything else is your decision.

---

## 3. Demo UI vs. Real API

### Confirmation: The demo UI uses the exact same logic as the real API

**How it works:**
- The demo UI (`/preservation-core` page) uses the same `classifyDisconnect()` function
- The real API endpoint (`/api/preservation-core/classify`) uses the same `classifyDisconnect()` function
- Both call the exact same code in `lib/preservation-core.ts`

**What this means:**
- ✅ The demo is not a simulation - it's using real logic
- ✅ Results in the demo match what you'll get from the API
- ✅ You can trust the demo to show you how the real service works
- ✅ The only difference is the UI shows it visually, while the API returns JSON

**Testing:**
- Test scenarios in the demo UI
- See the exact decision and signals
- When you call the real API with the same data, you'll get the same result

---

## 4. Minimum Day-1 Integration Requirements

### Minimum Request (Required Fields Only)

**Absolute minimum to get started:**

```json
{
  "quitAction": false
}
```

That's it! Just one field.

**What you get back:**

```json
{
  "type": "none",
  "lossApplied": false,
  "signals": {
    "quitDetected": false,
    "timeoutDetected": false,
    "highPacketLoss": false,
    "highLatency": false,
    "hardDisconnect": false
  }
}
```

### Recommended Request (For Better Accuracy)

**To get accurate results, also include network data:**

```json
{
  "quitAction": false,
  "networkBeforeDisconnect": {
    "latencyMs": 1200,
    "packetLossRate": 0.4,
    "isConnected": false
  }
}
```

**What you get back:**

```json
{
  "type": "unintentional_disconnect",
  "lossApplied": false,
  "signals": {
    "quitDetected": false,
    "timeoutDetected": false,
    "highPacketLoss": true,
    "highLatency": true,
    "hardDisconnect": true
  }
}
```

### Response Fields Explained

| Field | Type | Meaning |
|-------|------|---------|
| `type` | string | `"none"`, `"intentional_disconnect"`, or `"unintentional_disconnect"` |
| `lossApplied` | boolean | **This is the decision:** `true` = apply loss, `false` = preserve match |
| `signals` | object | Breakdown of what was detected (for debugging/logging) |

### Decision Response Logic

**The key field is `lossApplied`:**

- `lossApplied: true` → **Apply a loss** to the player's record
- `lossApplied: false` → **Don't apply a loss** (preserve match - you decide how)

**The `type` field tells you why:**

- `"intentional_disconnect"` → Player quit (always results in `lossApplied: true`)
- `"unintentional_disconnect"` → Network problem (always results in `lossApplied: false`)
- `"none"` → No disconnect detected (results in `lossApplied: false`)

### Day-1 Integration Example

**Simplest possible integration:**

```javascript
// 1. Player disconnects
function onPlayerDisconnect(playerId) {
  // 2. Determine if they quit (your existing logic)
  const quitAction = detectQuitAction(playerId);
  
  // 3. Call Preservation Core (minimum request)
  const response = await fetch('/api/preservation-core/classify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      quitAction: quitAction  // Only required field
    })
  });
  
  const result = await response.json();
  
  // 4. Apply the decision
  if (result.lossApplied) {
    applyLoss(playerId);  // Your function to record a loss
  } else {
    preserveMatch(playerId);  // Your function to handle "no loss"
  }
}
```

**That's it!** This is the absolute minimum. You can add network data later for better accuracy.

---

## Summary

1. **Preservation Core only decides loss vs. no loss** - Your game owns everything else
2. **"Preserve match" means "don't count as loss"** - You decide how to handle it (no contest, reconnection, etc.)
3. **Demo UI uses the same logic as the real API** - What you see is what you get
4. **Minimum integration:** Just send `quitAction` - that's all you need to start

---

## Next Steps

- See `preservation-core-integration.md` for full technical details
- See `preservation-core-faq.md` for common questions
- Test in the demo UI at `/preservation-core`
- Start with minimum integration, add network data later for accuracy

