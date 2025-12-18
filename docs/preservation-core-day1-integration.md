# Preservation Core - Day-1 Integration Example

## Overview

**Goal:** Prevent unfair losses when a player disconnects due to internet issues instead of quitting.

**How:** Add a small API call in your existing disconnect handler that sends basic connection data and applies the yes/no decision it returns.

**Key Point:** The API response `lossApplied` is what your game server uses to decide whether to apply or skip a loss. If a player is winning (e.g., up 7 points) and their connection drops, the opponent shouldn't get a free win.

---

## The API Response You Use

The API returns a simple yes/no decision in the `lossApplied` field:

```json
{
  "type": "unintentional_disconnect",
  "lossApplied": false,  // ← THIS IS WHAT YOU USE
  "signals": { ... }
}
```

**Your game server logic:**
- If `lossApplied: true` → Apply a loss to the disconnected player
- If `lossApplied: false` → Skip the loss (preserve match, mark no contest, etc.)

---

## Complete Day-1 Integration Example

### Step 1: Your Existing Disconnect Handler

```javascript
// Your existing code (before Preservation Core)
function onPlayerDisconnect(playerId, matchState) {
  // Currently: always count as loss
  applyLoss(playerId, matchState);
}
```

### Step 2: Add Preservation Core Call

```javascript
// Your code (after adding Preservation Core)
async function onPlayerDisconnect(playerId, matchState) {
  // 1. Capture basic connection data
  const quitAction = detectQuitAction(playerId); // Your existing logic
  const networkState = captureNetworkState(playerId); // Your existing metrics
  
  // 2. Call Preservation Core API
  const response = await fetch('https://your-domain.com/api/preservation-core/classify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      quitAction: quitAction,
      networkBeforeDisconnect: networkState ? {
        latencyMs: networkState.latency,
        packetLossRate: networkState.packetLoss,
        isConnected: networkState.isConnected
      } : undefined
    })
  });
  
  const result = await response.json();
  
  // 3. Use the API response to decide
  if (result.lossApplied) {
    // API says: Apply a loss
    applyLoss(playerId, matchState);
  } else {
    // API says: Skip the loss (preserve match)
    preserveMatch(playerId, matchState); // Your function to handle "no loss"
  }
}
```

### Step 3: Implement Your "Preserve Match" Logic

```javascript
function preserveMatch(playerId, matchState) {
  // You decide how to handle "no loss" - here are common options:
  
  // Option 1: Mark as no contest
  markMatchAsNoContest(matchState.matchId);
  
  // Option 2: Allow reconnection window
  enableReconnectionWindow(playerId, 30); // 30 seconds to reconnect
  
  // Option 3: Cancel the match
  cancelMatch(matchState.matchId);
  
  // Whatever fits your game design
}
```

---

## Three Scenarios - End-to-End Verification

### Scenario A: Normal Match Completion (No Disconnect)

**Situation:** Match completes normally, no disconnect occurs.

**API Request:**
```json
{
  "quitAction": false
}
```

**API Response:**
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

**Game Server Action:**
```javascript
if (result.lossApplied) {  // false
  applyLoss(playerId, matchState);  // NOT CALLED
} else {
  preserveMatch(playerId, matchState);  // CALLED - normal match completion
}
```

**Result:** ✅ Normal match completion handled correctly.

---

### Scenario B: Intentional Disconnect (Player Quits)

**Situation:** Player is losing (e.g., down 2-7) and presses Alt+F4 to quit.

**API Request:**
```json
{
  "quitAction": true
}
```

**API Response:**
```json
{
  "type": "intentional_disconnect",
  "lossApplied": true,
  "signals": {
    "quitDetected": true,
    "timeoutDetected": false,
    "highPacketLoss": false,
    "highLatency": false,
    "hardDisconnect": false
  }
}
```

**Game Server Action:**
```javascript
if (result.lossApplied) {  // true
  applyLoss(playerId, matchState);  // CALLED - loss applied
} else {
  preserveMatch(playerId, matchState);  // NOT CALLED
}
```

**Result:** ✅ Loss applied correctly - player quit intentionally.

---

### Scenario C: Unintentional Disconnect (Network Issue While Winning)

**Situation:** Player is winning (e.g., up 7-2) and their internet connection drops.

**API Request:**
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

**API Response:**
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

**Game Server Action:**
```javascript
if (result.lossApplied) {  // false
  applyLoss(playerId, matchState);  // NOT CALLED
} else {
  preserveMatch(playerId, matchState);  // CALLED - loss prevented
}
```

**Result:** ✅ Loss prevented - player was winning, connection issue was not their fault. Opponent doesn't get a free win.

---

## Complete Integration Code (Copy-Paste Ready)

```javascript
// ============================================
// Preservation Core - Day-1 Integration
// ============================================

const PRESERVATION_CORE_API_URL = 'https://your-domain.com/api/preservation-core/classify';

/**
 * Handles player disconnect with Preservation Core classification
 */
async function onPlayerDisconnect(playerId, matchState) {
  try {
    // 1. Capture connection data
    const quitAction = detectQuitAction(playerId);
    const networkState = captureNetworkState(playerId);
    
    // 2. Call Preservation Core API
    const response = await fetch(PRESERVATION_CORE_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quitAction: quitAction,
        networkBeforeDisconnect: networkState ? {
          latencyMs: networkState.latency,
          packetLossRate: networkState.packetLoss,
          isConnected: networkState.isConnected
        } : undefined
      })
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    // 3. Apply the decision
    if (result.lossApplied) {
      // API says: Apply a loss
      console.log(`[PreservationCore] Loss applied for ${playerId} - ${result.type}`);
      applyLoss(playerId, matchState);
    } else {
      // API says: Skip the loss
      console.log(`[PreservationCore] Loss prevented for ${playerId} - ${result.type}`);
      preserveMatch(playerId, matchState);
    }
    
  } catch (error) {
    // Fallback: if API fails, use your default behavior
    console.error('[PreservationCore] API call failed, using fallback:', error);
    applyDefaultDisconnectBehavior(playerId, matchState);
  }
}

/**
 * Your existing functions (implement based on your game)
 */
function detectQuitAction(playerId) {
  // Return true if player explicitly quit (Alt+F4, quit button, etc.)
  // This is usually tracked in your disconnect event
  return wasExplicitQuit(playerId);
}

function captureNetworkState(playerId) {
  // Return network metrics if available
  // Most game engines already track this
  return {
    latency: getPlayerLatency(playerId),
    packetLoss: getPlayerPacketLoss(playerId),
    isConnected: isPlayerConnected(playerId)
  };
}

function applyLoss(playerId, matchState) {
  // Your existing loss application logic
  updatePlayerRecord(playerId, { losses: +1 });
  endMatchForPlayer(playerId, 'loss');
}

function preserveMatch(playerId, matchState) {
  // Your logic for handling "no loss"
  // Options: mark as no contest, allow reconnection, cancel match, etc.
  markMatchAsNoContest(matchState.matchId);
}

function applyDefaultDisconnectBehavior(playerId, matchState) {
  // Your fallback behavior if API fails
  // Could be: always apply loss, always preserve, etc.
  applyLoss(playerId, matchState);
}

// Hook into your disconnect event
gameServer.on('playerDisconnect', onPlayerDisconnect);
```

---

## Verification Checklist

Before deploying, verify all three scenarios:

- [ ] **Scenario A (Normal):** Match completes → `lossApplied: false` → Normal completion handled
- [ ] **Scenario B (Quit):** Player quits → `lossApplied: true` → Loss applied
- [ ] **Scenario C (Network Issue):** Connection drops while winning → `lossApplied: false` → Loss prevented

**How to verify:**

1. **Test in the UI:** Use the test harness at `/preservation-core` to verify behavior
2. **Run verification script:** `node scripts/verify-preservation-core-scenarios.js`
3. **Test API directly:** Make POST requests to `/api/preservation-core/classify` with the three scenarios

**Expected Results:**
- Scenario A: `lossApplied: false` (normal completion)
- Scenario B: `lossApplied: true` (intentional quit)
- Scenario C: `lossApplied: false` (network issue - prevents unfair loss)

---

## Key Points

1. **The API response `lossApplied` is what you use** - It's a simple boolean that tells you whether to apply a loss or not.

2. **Prevents unfair wins** - If a player is winning and their connection drops, the opponent doesn't get a free win.

3. **Simple integration** - Just add the API call to your existing disconnect handler and use the `lossApplied` field.

4. **You control match state** - Preservation Core only decides loss vs. no loss. You decide how to handle "no loss" (no contest, reconnection, etc.).

---

## Next Steps

1. Copy the integration code above
2. Replace placeholder functions with your actual implementations
3. Test all three scenarios
4. Deploy to production

For more details, see:
- [preservation-core-integration.md](./preservation-core-integration.md) - Full technical guide
- [preservation-core-clarifications.md](./preservation-core-clarifications.md) - Important clarifications
- [preservation-core-faq.md](./preservation-core-faq.md) - Common questions

