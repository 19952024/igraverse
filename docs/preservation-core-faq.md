# Preservation Core - Developer FAQ

> **For non-technical stakeholders:** See [preservation-core-for-developers.md](./preservation-core-for-developers.md) for a business-friendly explanation.

## What is Preservation Core?

**The goal:** Eliminate unfair online losses when a player disconnects due to internet issues instead of quitting.

**How it works:** Studios simply add a small API call in their existing disconnect handler that sends basic connection data and applies the yes/no decision it returns.

---

## Quick Answers to Common Questions

### 1. Is Preservation Core something developers download and integrate?

**No, Preservation Core is a cloud-based API service.** You don't download or install anything locally. Instead, you make HTTP requests to the Preservation Core API endpoint from your game server or client.

**Integration method:**
- Call the REST API endpoint: `POST /api/preservation-core/classify`
- No SDK download required
- No local installation needed
- Works from any language/platform that can make HTTP requests

**Example:**
```javascript
// Just make an HTTP POST request - no downloads needed
const response = await fetch('https://your-domain.com/api/preservation-core/classify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ /* your data */ })
});
```

---

### 2. Is it called via a function or event when a disconnect happens?

**Yes, you call it as a function/API call when a disconnect event is detected.**

**Typical flow:**
1. Your game detects a player disconnect (via your networking layer)
2. You capture the necessary data (network state, quit action, etc.)
3. You call the Preservation Core API
4. You apply the result (apply loss or preserve match state)

**Where to call it:**
- **On disconnect event**: When your networking layer fires a disconnect event
- **In your match disconnect handler**: When processing a player leaving a match
- **Before finalizing match results**: When determining match outcomes

**Example integration points:**

```csharp
// Unity Netcode example
void OnClientDisconnectCallback(ulong clientId)
{
    // 1. Detect disconnect
    var playerId = GetPlayerId(clientId);
    
    // 2. Capture data
    var networkState = CaptureNetworkState(playerId);
    var quitAction = DetectQuitAction(playerId);
    
    // 3. Call Preservation Core API
    var result = await preservationCore.ClassifyDisconnect(quitAction, networkState);
    
    // 4. Apply result
    if (result.LossApplied)
        ApplyLoss(playerId);
    else
        PreserveMatchState(playerId);
}
```

```javascript
// Node.js game server example
gameServer.on('playerDisconnect', async (playerId, matchState) => {
    // 1. Disconnect detected
    // 2. Capture data
    const networkState = captureNetworkState(playerId);
    const quitAction = detectQuitAction(playerId);
    
    // 3. Call Preservation Core API
    const result = await classifyDisconnect(quitAction, networkState);
    
    // 4. Apply result
    if (result.lossApplied) {
        applyLoss(playerId, matchState);
    } else {
        preserveMatchState(playerId, matchState);
    }
});
```

---

### 3. What data does the game need to pass in?

**Minimum required:**
- `quitAction` (boolean): Whether the user explicitly quit

**Recommended (for accurate classification):**
- `networkBeforeDisconnect` (object): Network state snapshot
  - `latencyMs` (number): Latency in milliseconds
  - `packetLossRate` (number): Packet loss rate (0.0 to 1.0)
  - `isConnected` (boolean): Whether connection was active
- `timeSinceLastPacket` (number): Milliseconds since last successful packet

**You do NOT need to pass:**
- Match state (score, game mode, etc.) - Preservation Core doesn't need this
- Player information - Only network/connection data
- Game-specific data - Only connection quality metrics

**Example request:**
```json
{
  "quitAction": false,
  "networkBeforeDisconnect": {
    "latencyMs": 1200,
    "packetLossRate": 0.4,
    "isConnected": false
  },
  "timeSinceLastPacket": 6000
}
```

**How to get this data:**

| Data | How to Get It |
|------|---------------|
| `quitAction` | Detect explicit quit (Alt+F4, quit button press, application close) |
| `latencyMs` | From your networking layer (RTT, ping, latency metrics) |
| `packetLossRate` | From your networking layer (packets lost / packets sent) |
| `isConnected` | From your networking layer (connection status before disconnect) |
| `timeSinceLastPacket` | Track timestamp of last successful packet/acknowledgment |

**Platform-specific examples:**

**Unity Netcode:**
```csharp
var networkManager = NetworkManager.Singleton;
var transport = networkManager.NetworkConfig.NetworkTransport;
var rtt = transport.GetCurrentRtt(clientId);
var packetLoss = CalculatePacketLoss(clientId);
var isConnected = networkManager.ConnectedClients.ContainsKey(clientId);
```

**Unreal Engine:**
```cpp
UNetConnection* Connection = GetPlayerConnection();
float Latency = Connection->AvgLag;
float PacketLoss = Connection->PacketLoss;
bool IsConnected = Connection->State == USOCK_Open;
```

**Custom Networking:**
```javascript
// Track in your networking layer
const networkState = {
  latencyMs: lastRTT,
  packetLossRate: packetsLost / packetsSent,
  isConnected: connectionState === 'connected'
};
```

---

### 4. What would a basic Day-1 integration look like from a developer's perspective?

**Step-by-step Day-1 integration:**

#### Step 1: Set up API client (5 minutes)

```javascript
// Create a simple API client function
async function callPreservationCore(quitAction, networkState) {
  const response = await fetch('https://your-domain.com/api/preservation-core/classify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      quitAction,
      networkBeforeDisconnect: networkState,
    }),
  });
  return await response.json();
}
```

#### Step 2: Hook into disconnect event (10 minutes)

```javascript
// Find where your game handles disconnects
function onPlayerDisconnect(playerId) {
  // This is where you'll add Preservation Core
}
```

#### Step 3: Capture network data (15 minutes)

```javascript
function onPlayerDisconnect(playerId) {
  // Capture network state before disconnect
  const networkState = {
    latencyMs: getPlayerLatency(playerId),
    packetLossRate: getPlayerPacketLoss(playerId),
    isConnected: wasPlayerConnected(playerId),
  };
  
  // Detect if it was an explicit quit
  const quitAction = wasExplicitQuit(playerId);
  
  // Call Preservation Core
  callPreservationCore(quitAction, networkState)
    .then(result => {
      // Apply result
      if (result.lossApplied) {
        recordLoss(playerId);
      } else {
        preserveMatch(playerId);
      }
    });
}
```

#### Step 4: Apply the result (10 minutes)

```javascript
function recordLoss(playerId) {
  // Your existing loss recording logic
  updatePlayerRecord(playerId, { losses: +1 });
  endMatchForPlayer(playerId, 'loss');
}

function preserveMatch(playerId) {
  // Your existing match preservation logic
  // (e.g., don't count as loss, allow reconnection, etc.)
  markMatchAsPreserved(playerId);
}
```

**Complete minimal example (Day-1 ready):**

```javascript
// Minimal Day-1 integration - just the essentials
async function handlePlayerDisconnect(playerId) {
  // 1. Capture what you can
  const quitAction = detectQuitAction(playerId); // true/false
  const networkState = captureNetworkState(playerId); // { latencyMs, packetLossRate, isConnected }
  
  // 2. Call Preservation Core
  try {
    const response = await fetch('/api/preservation-core/classify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quitAction,
        networkBeforeDisconnect: networkState,
      }),
    });
    
    const result = await response.json();
    
    // 3. Apply result
    if (result.lossApplied) {
      // Player gets a loss
      applyLoss(playerId);
    } else {
      // Match state preserved, no loss
      preserveMatchState(playerId);
    }
  } catch (error) {
    // Fallback: if API fails, use your default behavior
    console.error('Preservation Core API error:', error);
    applyDefaultDisconnectBehavior(playerId);
  }
}

// Hook it into your disconnect handler
gameServer.on('playerDisconnect', handlePlayerDisconnect);
```

**Time estimate: 30-60 minutes for basic integration**

**What you need:**
- ✅ Access to your disconnect event handler
- ✅ Ability to capture network metrics (latency, packet loss)
- ✅ Ability to detect explicit quit actions
- ✅ HTTP client library (built into most languages)

**What you get:**
- ✅ Automatic disconnect classification
- ✅ Loss application decision
- ✅ Signal breakdown for debugging

---

## Common Integration Patterns

### Pattern 1: Server-Side Integration (Recommended)
- Call API from your game server
- More secure, centralized logic
- Single source of truth

### Pattern 2: Client-Side Integration
- Call API from game client
- Useful for client-side matchmaking
- Requires API key/authentication

### Pattern 3: Hybrid
- Client captures data, server makes API call
- Best of both worlds
- More complex but most flexible

---

## Testing Your Integration

1. **Test intentional disconnect**: Quit the game → should return `lossApplied: true`
2. **Test network drop**: Simulate network failure → should return `lossApplied: false`
3. **Test normal completion**: Let match finish normally → should return `type: "none"`

Use the test harness at `/preservation-core` to validate behavior before integrating.

---

## Need Help?

- See full integration guide: `docs/preservation-core-integration.md`
- Test in the UI: Navigate to `/preservation-core` in your app
- Check API docs: `GET /api/preservation-core/classify`

