# Preservation Core - For Game Developers

## What is Preservation Core?

**The goal:** Eliminate unfair online losses when a player disconnects due to internet issues instead of quitting.

**How it works:** You add a small API call in your existing disconnect handler that sends basic connection data and applies the yes/no decision it returns.

Preservation Core automatically determines whether a player's disconnect should count as a loss or be preserved (no loss applied). It analyzes network conditions and player actions to make this decision.

**Important:** Preservation Core **only decides loss vs. no loss**. Your game always owns and controls match state, scores, reconnection logic, and everything else. We just tell you: "This should count as a loss" or "This should not count as a loss."

> **See [preservation-core-clarifications.md](./preservation-core-clarifications.md) for detailed clarifications on what Preservation Core does and doesn't do.**

---

## How Developers Use Preservation Core

### Question 1: Is Preservation Core something developers download and integrate?

**Answer: No, it's a web service you call from your game.**

- **No downloads required** - You don't install anything
- **No code libraries to add** - You just make a web request
- **Works with any game engine** - Unity, Unreal, custom engines, etc.
- **Works from your game server** - Call it when a disconnect happens

**In simple terms:** Think of it like calling a weather API. Your game makes a request to our service, we analyze the data, and send back a decision. No installation needed.

---

### Question 2: Is it called via a function or event when a disconnect happens?

**Answer: Yes, you call it when your game detects a player disconnect.**

**Typical workflow:**

1. **Player disconnects** → Your game detects this (your existing disconnect detection)
2. **You gather some data** → Network info, whether they quit, etc. (takes a few milliseconds)
3. **You call Preservation Core** → Send us the data via a web request
4. **You get a decision back** → "Apply loss" (`lossApplied: true`) or "Don't apply loss" (`lossApplied: false`)
5. **You act on the decision** → Record the loss, or handle "no loss" however your game design requires (no contest, allow reconnection, etc.)

**Where you add it:** In the same place you currently handle disconnects. Most games already have code that runs when a player leaves - you just add a call to Preservation Core there.

**Example scenario:**
```
Player loses connection during a match
    ↓
Your game: "Player disconnected, let me check what happened"
    ↓
Your game: "Let me ask Preservation Core if this should count as a loss"
    ↓
Preservation Core: "Network was bad, preserve the match - no loss"
    ↓
Your game: "Okay, I'll preserve the match state"
```

---

### Question 3: What data does the game need to pass in?

**Answer: Just connection quality data - no game-specific information needed.**

**What you need to send:**

1. **Did they quit?** (Yes/No)
   - Did they press Alt+F4, click Quit, or close the game?
   - This is usually easy to detect - your game already knows this

2. **Network quality before disconnect** (Optional but recommended)
   - How fast was their connection? (latency/ping)
   - How much data was being lost? (packet loss)
   - Was the connection still active? (connection status)

**What you DON'T need to send:**
- ❌ Match scores
- ❌ Game mode
- ❌ Player names or IDs
- ❌ Match duration
- ❌ Any game-specific data

**Why this matters:** Preservation Core only needs to know about the connection quality, not what happened in the game. This keeps it simple and privacy-friendly.

**Where to get this data:**
- Most game engines already track this (Unity Netcode, Unreal networking, etc.)
- Your networking layer already knows latency and packet loss
- You're probably already logging this for debugging

**If you don't have network data:** You can still use Preservation Core with just the "did they quit" information, though results will be less accurate.

---

### Question 4: What would a basic Day-1 integration look like from a developer's perspective?

**Answer: About 30-60 minutes of work, adding code to your existing disconnect handler.**

**Step-by-step (non-technical overview):**

#### Step 1: Set up the API call (5 minutes)
- Create a simple function that sends data to Preservation Core
- This is like setting up any web API call - standard programming task

#### Step 2: Find your disconnect handler (10 minutes)
- Locate where your game currently handles player disconnects
- This is code you already have - you're just adding to it

#### Step 3: Capture network data (15 minutes)
- Add code to grab network metrics when disconnect happens
- Most games already have this data available, you just need to capture it

#### Step 4: Call Preservation Core and apply result (10 minutes)
- Send the data to Preservation Core
- Get the decision back
- Apply it (record loss or preserve match)

**Total time: 30-60 minutes for a basic integration**

**What it looks like in practice:**

```
BEFORE (your current code):
Player disconnects → Always count as loss

AFTER (with Preservation Core):
Player disconnects → 
  Gather network data → 
  Ask Preservation Core → 
  Get decision → 
  Apply decision (loss or preserve)
```

**Testing:**
- Test with intentional quit → Should count as loss
- Test with network drop → Should preserve match
- Test normal match completion → Should work normally

---

## Real-World Example

**Scenario:** A player is in a ranked match, their internet cuts out, and they disconnect.

**Without Preservation Core:**
- Game: "Player disconnected = automatic loss"
- Player gets a loss on their record
- Player is frustrated because it wasn't their fault

**With Preservation Core:**
- Game: "Player disconnected, let me check..."
- Game sends: "Quit? No. Network was bad (high latency, packet loss, connection dropped)"
- Preservation Core: "This was unintentional - don't count as loss (`lossApplied: false`)"
- Game: "No loss applied. I'll mark this as no contest / allow reconnection / etc." (game decides)
- Player's record is protected

---

## Common Questions

**Q: Do I need to change my game's networking?**  
A: No. Preservation Core works with whatever networking you already have. You just send us data you're already collecting.

**Q: What if the API is down?**  
A: You can add a fallback - if Preservation Core doesn't respond, use your default behavior (e.g., always count as loss, or always preserve).

**Q: Does this work for all game types?**  
A: Yes. It works for any multiplayer game where disconnects matter - MOBAs, FPS, fighting games, battle royales, etc.

**Q: How accurate is it?**  
A: Very accurate when you provide network data. It correctly identifies intentional quits vs. network problems in the vast majority of cases.

**Q: What if I can't detect quit actions?**  
A: You can still use it with just network data. It will be less accurate at detecting intentional quits, but will still catch network problems.

**Q: Is there a cost?**  
A: Check with your Igraverse representative for pricing details.

**Q: What does "preserve match" actually mean?**  
A: It means "don't count this as a loss." Your game decides how to handle it - mark as no contest, allow reconnection, pause and wait, cancel the match, etc. Preservation Core doesn't control match state - it only tells you whether to apply a loss or not.

**Q: Does the demo UI use the same logic as the real API?**  
A: Yes. The demo UI and the real API both use the exact same `classifyDisconnect()` function. What you see in the demo is what you'll get from the API.

**Q: What's the minimum I need to send for Day-1 integration?**  
A: Just `quitAction` (true/false). That's the only required field. You can add network data later for better accuracy. See [preservation-core-clarifications.md](./preservation-core-clarifications.md) for details.

---

## Getting Started

1. **Review the technical documentation** - See `preservation-core-integration.md` for code examples
2. **Test in the UI** - Use the test harness at `/preservation-core` to see how it works
3. **Try the API** - Make a test call to see the response format
4. **Integrate** - Add the code to your disconnect handler (30-60 minutes)
5. **Test** - Verify it works with intentional quits and network drops
6. **Deploy** - Roll it out to your players

---

## Support

- **Technical questions:** See `preservation-core-integration.md` and `preservation-core-faq.md`
- **API testing:** Use the test harness UI
- **Integration help:** Contact your Igraverse representative

