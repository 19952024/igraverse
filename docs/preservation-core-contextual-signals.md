# Preservation Core - Optional Contextual Signals

## Overview

Preservation Core supports **optional contextual signals** that help improve accuracy in disconnect classification while remaining completely game-agnostic. These signals allow studios to provide minimal context about match state without exposing game-specific data or logic.

## Why Contextual Signals?

**The Problem:**
- A player disconnects due to network issues while clearly winning → Should NOT receive a loss
- A player disconnects while losing in an uncertain match → Should NOT receive a loss (match could still turn around)
- A player disconnects while losing in a settled match → Still should NOT receive a loss if it's a network issue (we protect players)

**The Solution:**
Optional contextual signals that are:
- ✅ **Game-agnostic** - Works for basketball, Call of Duty, fighting games, strategy games, etc.
- ✅ **Studio-defined** - Your game server calculates the signals based on your game's metrics
- ✅ **Privacy-friendly** - No game-specific data, just normalized signals
- ✅ **Optional** - Works perfectly without them, better accuracy with them

## The Two Signals

### 1. Competitive Advantage (`competitiveAdvantage`)

**What it represents:** Who is ahead in the match at the moment of disconnect.

**Range:** `-1.0` to `1.0`
- `-1.0` = Player is clearly losing/behind
- `0.0` = Match is even/neutral
- `1.0` = Player is clearly winning/ahead

**How to calculate (examples):**

**Basketball/Soccer (Score-based):**
```javascript
const scoreDiff = playerScore - opponentScore
const maxPossibleDiff = maxPossibleScore // e.g., 100 points
competitiveAdvantage = Math.max(-1, Math.min(1, scoreDiff / maxPossibleDiff))
```

**Call of Duty (Kills/Objectives):**
```javascript
const killDiff = playerKills - opponentKills
const totalKills = playerKills + opponentKills
competitiveAdvantage = totalKills > 0 ? Math.max(-1, Math.min(1, killDiff / totalKills)) : 0
// Or combine with objective control:
// competitiveAdvantage = (killAdvantage * 0.6) + (objectiveControl * 0.4)
```

**Fighting Game (Health/Rounds):**
```javascript
const healthDiff = playerHealth - opponentHealth
const maxHealth = 100
competitiveAdvantage = Math.max(-1, Math.min(1, healthDiff / maxHealth))
// Or consider rounds won:
// competitiveAdvantage = (roundsWon - roundsLost) / totalRounds
```

**Strategy Game (Resources/Map Control):**
```javascript
const resourceDiff = playerResources - opponentResources
const maxResources = 10000
competitiveAdvantage = Math.max(-1, Math.min(1, resourceDiff / maxResources))
// Or combine multiple factors:
// competitiveAdvantage = (resourceAdvantage * 0.5) + (mapControl * 0.5)
```

**Key Point:** You normalize your game's metrics into a -1.0 to 1.0 range. Preservation Core doesn't need to understand your game - it just uses this normalized signal.

### 2. Fairness Confidence (`fairnessConfidence`)

**What it represents:** Whether the match outcome is likely settled or still highly uncertain.

**Range:** `0.0` to `1.0`
- `0.0` = Match outcome is highly uncertain, anything could happen
- `0.5` = Match is somewhat uncertain, outcome not yet clear
- `1.0` = Match outcome is likely settled, clear winner/loser

**How to calculate (examples):**

**Time-based (Basketball, Soccer):**
```javascript
const timeRemaining = matchDuration - elapsedTime
const totalDuration = matchDuration
const timeFactor = timeRemaining / totalDuration // 0 = almost over, 1 = just started

const scoreDiff = Math.abs(playerScore - opponentScore)
const scoreFactor = Math.min(1, scoreDiff / maxPossibleScoreDiff) // 0 = tied, 1 = huge lead

// Low confidence if lots of time left OR scores are close
fairnessConfidence = Math.min(1, (1 - timeFactor) * scoreFactor)
```

**Round-based (Fighting Games, Best-of-X):**
```javascript
const roundsWon = playerRounds
const roundsLost = opponentRounds
const totalRounds = 5 // best of 5

const roundsNeeded = Math.ceil(totalRounds / 2)
const roundsRemaining = totalRounds - roundsWon - roundsLost

// High confidence if player needs 1 more round to win, low if many rounds left
fairnessConfidence = roundsRemaining === 0 ? 1.0 : (roundsNeeded - roundsRemaining) / roundsNeeded
```

**Momentum-based (Any competitive game):**
```javascript
// Consider recent performance, not just current score
const recentPerformance = calculateRecentMomentum() // e.g., last 30 seconds
const currentAdvantage = competitiveAdvantage

// Low confidence if momentum is against player even if they're ahead
fairnessConfidence = Math.abs(currentAdvantage) * (1 - Math.abs(recentPerformance))
```

**Key Point:** This signal helps distinguish between "player was winning but match could still turn" vs "player was winning and match is essentially over."

## How Preservation Core Uses These Signals

**Decision Logic:**

1. **Intentional Quit** → Always apply loss (regardless of signals)

2. **Network Problem Detected:**
   - If `competitiveAdvantage > 0.3` (player was winning) → Preserve match (no loss)
   - If `competitiveAdvantage < -0.3` (player was losing) AND `fairnessConfidence > 0.8` (match settled) → Still preserve (network issues can happen to anyone)
   - If `fairnessConfidence < 0.3` (match uncertain) → Always preserve (don't penalize when match could go either way)
   - Default: Preserve match (we err on the side of protecting players)

**Important:** Network signals always take precedence. If there's clear network problems (high latency, packet loss, timeout), the match is preserved regardless of competitive state.

## API Usage

### Basic Request (No Contextual Signals)
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

### Enhanced Request (With Contextual Signals)
```json
{
  "quitAction": false,
  "networkBeforeDisconnect": {
    "latencyMs": 1200,
    "packetLossRate": 0.4,
    "isConnected": false
  },
  "competitiveAdvantage": 0.7,
  "fairnessConfidence": 0.6
}
```

### Response
```json
{
  "type": "unintentional_disconnect",
  "lossApplied": false,
  "signals": {
    "quitDetected": false,
    "timeoutDetected": true,
    "highPacketLoss": true,
    "highLatency": true,
    "hardDisconnect": true,
    "competitiveAdvantageUsed": true,
    "fairnessConfidenceUsed": true
  }
}
```

## Implementation Guide

### Step 1: Calculate Signals in Your Game Server

```javascript
function calculateCompetitiveAdvantage(playerState, opponentState, gameType) {
  // Your game-specific logic
  // Normalize to -1.0 to 1.0 range
  // Examples above show how to do this for different game types
}

function calculateFairnessConfidence(matchState, timeRemaining, scoreDiff) {
  // Your game-specific logic
  // Normalize to 0.0 to 1.0 range
  // Examples above show how to do this
}
```

### Step 2: Include Signals in API Call

```javascript
async function onPlayerDisconnect(playerId, matchState) {
  // Capture network state
  const networkState = captureNetworkState(playerId);
  const quitAction = detectQuitAction(playerId);
  
  // Calculate contextual signals (optional)
  const competitiveAdvantage = calculateCompetitiveAdvantage(
    matchState.player,
    matchState.opponent,
    matchState.gameType
  );
  const fairnessConfidence = calculateFairnessConfidence(
    matchState,
    matchState.timeRemaining,
    matchState.scoreDiff
  );
  
  // Call Preservation Core API
  const response = await fetch('/api/preservation-core/classify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      quitAction,
      networkBeforeDisconnect: networkState,
      competitiveAdvantage, // Optional
      fairnessConfidence,   // Optional
    }),
  });
  
  const result = await response.json();
  
  // Apply result
  if (result.lossApplied) {
    applyLoss(playerId);
  } else {
    preserveMatch(playerId);
  }
}
```

## Best Practices

1. **Start Simple:** You can use Preservation Core without contextual signals. Add them later for improved accuracy.

2. **Normalize Properly:** Make sure your signals are in the correct ranges:
   - `competitiveAdvantage`: -1.0 to 1.0
   - `fairnessConfidence`: 0.0 to 1.0

3. **Update Dynamically:** Recalculate signals at the moment of disconnect, not at match start.

4. **Consider Multiple Factors:** For complex games, combine multiple metrics:
   - Score + time remaining
   - Kills + objectives + map control
   - Health + rounds + momentum

5. **Test Your Calculations:** Use the sandbox test harness to verify your signal calculations produce expected results.

## Privacy & Security

- ✅ **No game-specific data exposed** - Just normalized signals
- ✅ **No player information** - Signals are about match state, not players
- ✅ **Studio controls calculation** - You decide how to calculate signals
- ✅ **Optional** - Works perfectly without them

## Examples by Game Type

### Basketball
```javascript
competitiveAdvantage = (playerScore - opponentScore) / 100 // Normalize to reasonable range
fairnessConfidence = (timeRemaining < 30 && scoreDiff > 10) ? 0.9 : 0.3
```

### Call of Duty
```javascript
competitiveAdvantage = (playerKills - opponentKills) / (playerKills + opponentKills + 1)
fairnessConfidence = (timeRemaining < 60 && killDiff > 5) ? 0.8 : 0.4
```

### Fighting Game
```javascript
competitiveAdvantage = (playerHealth - opponentHealth) / 100
fairnessConfidence = (roundsWon === 2 && roundsLost === 0) ? 0.9 : 0.5
```

### Strategy Game
```javascript
competitiveAdvantage = (playerResources - opponentResources) / 10000
fairnessConfidence = (mapControl > 0.8 && resourceDiff > 5000) ? 0.9 : 0.3
```

## Summary

Contextual signals make Preservation Core more accurate while staying game-agnostic. They're optional, privacy-friendly, and easy to implement. Your game server calculates them based on your game's metrics, and Preservation Core uses them to make better decisions about unfair losses.
