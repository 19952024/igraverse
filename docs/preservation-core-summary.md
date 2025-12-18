# Preservation Core - Quick Summary for Stakeholders

## What is Preservation Core?

**The goal:** Let game studios eliminate unfair online losses when a player disconnects due to internet issues instead of quitting.

**How it works:** Studios simply add a small API call in their existing disconnect handler that sends basic connection data and applies the yes/no decision it returns.

---

## Four Key Questions Answered

### 1. Is Preservation Core something developers download and integrate?

**No. It's a web service - no download needed.**

- Developers don't install anything
- They just make a web request (like calling a weather API)
- Works with any game engine (Unity, Unreal, custom, etc.)
- Takes about 30-60 minutes to integrate

**Think of it like:** Your game calls our service, we analyze the disconnect, and send back a decision. Simple.

---

### 2. Is it called via a function or event when a disconnect happens?

**Yes. Developers add it to their existing disconnect handler.**

**The flow:**
1. Player disconnects (your game already detects this)
2. Game gathers network data (latency, packet loss, etc.)
3. Game calls Preservation Core API
4. Preservation Core responds with a decision
5. Game applies the decision (loss or preserve)

**Where it goes:** In the same code that already handles disconnects. Just add a few lines.

**Timeline:** Happens in milliseconds - doesn't slow down the game.

---

### 3. What data does the game need to pass in?

**Just connection quality data - nothing game-specific.**

**Required:**
- Did the player quit? (Yes/No - usually easy to detect)

**Recommended:**
- Network quality before disconnect:
  - Connection speed (latency/ping)
  - Data loss (packet loss)
  - Connection status

**What you DON'T need:**
- ❌ Match scores
- ❌ Game mode
- ❌ Player information
- ❌ Any game-specific data

**Why this is good:** 
- Simple to implement
- Privacy-friendly (no personal data)
- Most games already track this data

**If network data isn't available:** Can still use it with just quit detection, though less accurate.

---

### 4. What would a basic Day-1 integration look like from a developer's perspective?

**30-60 minutes of work. Four simple steps:**

1. **Set up API call** (5 min)
   - Create function to send data to Preservation Core
   - Standard web API setup

2. **Find disconnect handler** (10 min)
   - Locate existing code that handles disconnects
   - This code already exists in the game

3. **Capture network data** (15 min)
   - Add code to grab network metrics
   - Most games already have this data available

4. **Call and apply result** (10 min)
   - Send data to Preservation Core
   - Get decision back
   - Apply it (loss or preserve)

**Total: 30-60 minutes for basic integration**

**What changes:**
- **Before:** Player disconnects → Always counts as loss
- **After:** Player disconnects → Ask Preservation Core → Apply decision

**Testing:** Test with intentional quit (should be loss) and network drop (should preserve)

---

## Real-World Example

**The Problem:**
Player's internet cuts out during a ranked match. Game automatically gives them a loss, even though it wasn't their fault.

**The Solution:**
1. Player disconnects
2. Game checks: "Did they quit? No. Network was bad? Yes."
3. Game asks Preservation Core: "Should this count as a loss?"
4. Preservation Core: "No - network problem, preserve the match"
5. Player's record is protected

**Result:** Players are protected from unfair losses due to network issues.

---

## Key Benefits

✅ **Simple integration** - 30-60 minutes, no downloads
✅ **Works with existing code** - Just add to disconnect handler
✅ **Privacy-friendly** - Only connection data, no personal info
✅ **Accurate** - Correctly identifies intentional quits vs. network problems
✅ **Fast** - Decisions in milliseconds
✅ **Flexible** - Works with any game engine or networking solution

---

## Next Steps for Developers

1. Review technical docs: `preservation-core-integration.md`
2. Test in UI: Use test harness at `/preservation-core`
3. Try the API: Make a test call
4. Integrate: Add to disconnect handler (30-60 min)
5. Test: Verify with intentional quits and network drops
6. Deploy: Roll out to players

---

## Important Clarifications

**See [preservation-core-clarifications.md](./preservation-core-clarifications.md) for detailed answers to:**
1. What Preservation Core does (and doesn't do) - Only decides loss vs. no loss
2. What "preserve match" means - You decide how to handle it
3. Demo UI vs. real API - Uses the same logic
4. Minimum Day-1 requirements - Just `quitAction` field needed

## Documentation

- **Day-1 Integration:** [preservation-core-day1-integration.md](./preservation-core-day1-integration.md) - **START HERE** - Complete copy-paste ready code with three scenarios verified
- **This document:** Quick summary for stakeholders
- **Clarifications:** [preservation-core-clarifications.md](./preservation-core-clarifications.md) - Important details about what Preservation Core does
- **For developers:** [preservation-core-integration.md](./preservation-core-integration.md) - Technical guide with code
- **FAQ:** [preservation-core-faq.md](./preservation-core-faq.md) - Common questions answered
- **Business overview:** [preservation-core-for-developers.md](./preservation-core-for-developers.md) - Non-technical explanation

