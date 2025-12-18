# Preservation Core - Developer Integration Guide

## Overview

**The goal:** Eliminate unfair online losses when a player disconnects due to internet issues instead of quitting.

**How it works:** Add a small API call in your existing disconnect handler that sends basic connection data and applies the yes/no decision it returns.

Preservation Core is a disconnect classification system that determines whether a player's disconnect is intentional or unintentional, and whether a loss should be applied to their record.

**Documentation:**
- **Day-1 Integration Example:** [preservation-core-day1-integration.md](./preservation-core-day1-integration.md) - **START HERE** - Complete copy-paste ready code with three scenarios
- **For non-technical stakeholders:** [preservation-core-for-developers.md](./preservation-core-for-developers.md) - Business-friendly explanation
- **Quick FAQ:** [preservation-core-faq.md](./preservation-core-faq.md) - Direct answers to common questions

## Quick Answers to Your Questions

### 1. Is Preservation Core something developers download and integrate?

**No, it's a cloud-based API service.** You don't download anything. Just make HTTP POST requests to the API endpoint from your game server or client when a disconnect happens.

### 2. Is it called via a function or event when a disconnect happens?

**Yes, you call it as a function/API call in your disconnect event handler.** When your game detects a player disconnect, you capture the data and call the Preservation Core API, then apply the result.

### 3. What data does the game need to pass in?

**Required:**
- `quitAction` (boolean): Whether user explicitly quit

**Recommended:**
- `networkBeforeDisconnect`: Network state before disconnect
  - `latencyMs`: Latency in milliseconds
  - `packetLossRate`: Packet loss rate (0.0 to 1.0)
  - `isConnected`: Whether connection was active
- `timeSinceLastPacket`: Milliseconds since last successful packet

**You do NOT need to pass:** Match state, score, or game-specific data - only connection quality metrics.

### 4. What would a basic Day-1 integration look like?

**~30-60 minutes:**
1. Create API client function (5 min)
2. Hook into your disconnect event handler (10 min)
3. Capture network data (15 min)
4. Call API and apply result (10 min)

See the [FAQ](./preservation-core-faq.md) for complete code examples.

## How It Works

Preservation Core evaluates multiple signals to classify disconnects:

1. **Quit Action**: Explicit user action (Alt+F4, quit button, etc.)
2. **Timeout**: Time since last successful packet/acknowledgment
3. **Packet Loss**: Network packet loss rate before disconnect
4. **Latency**: Network latency before disconnect
5. **Connection Status**: Whether the connection was active before disconnect

## Integration Methods

### Option 1: REST API (Recommended)

Preservation Core is available as a REST API endpoint that you can call from your game server or client.

**Endpoint:** `POST /api/preservation-core/classify`

**Base URL:** Your Igraverse deployment URL (e.g., `https://your-domain.com`)

#### Request

```json
{
  "quitAction": false,
  "networkBeforeDisconnect": {
    "latencyMs": 1200,
    "packetLossRate": 0.4,
    "isConnected": false,
    "timestamp": 1699123456789
  },
  "timeSinceLastPacket": 6000,
  "timeoutThreshold": 5000
}
```

**Request Fields:**

- `quitAction` (required, boolean): `true` if the user explicitly quit (Alt+F4, quit button, etc.)
- `networkBeforeDisconnect` (optional, object): Network state snapshot taken before disconnect
  - `latencyMs` (number): Latency in milliseconds
  - `packetLossRate` (number): Packet loss rate (0.0 to 1.0)
  - `isConnected` (boolean): Whether connection was active
  - `timestamp` (optional, number): Timestamp when snapshot was taken
- `timeSinceLastPacket` (optional, number): Milliseconds since last successful packet/acknowledgment
- `timeoutThreshold` (optional, number): Timeout threshold in milliseconds (default: 5000)

#### Response

```json
{
  "type": "unintentional_disconnect",
  "lossApplied": false,
  "signals": {
    "quitDetected": false,
    "timeoutDetected": true,
    "highPacketLoss": true,
    "highLatency": true,
    "hardDisconnect": true
  }
}
```

**Response Fields:**

- `type`: One of `"none"`, `"intentional_disconnect"`, or `"unintentional_disconnect"`
- `lossApplied`: `true` if a loss should be applied to the player's record
- `signals`: Breakdown of signals that triggered the classification

#### Example: C# / Unity

```csharp
using System;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using Newtonsoft.Json;

public class PreservationCoreClient
{
    private readonly string apiBaseUrl;
    private readonly HttpClient httpClient;

    public PreservationCoreClient(string apiBaseUrl)
    {
        this.apiBaseUrl = apiBaseUrl;
        this.httpClient = new HttpClient();
    }

    public async Task<ClassificationResult> ClassifyDisconnect(
        bool quitAction,
        NetworkSnapshot networkSnapshot = null,
        int? timeSinceLastPacket = null)
    {
        var request = new
        {
            quitAction = quitAction,
            networkBeforeDisconnect = networkSnapshot != null ? new
            {
                latencyMs = networkSnapshot.LatencyMs,
                packetLossRate = networkSnapshot.PacketLossRate,
                isConnected = networkSnapshot.IsConnected,
                timestamp = networkSnapshot.Timestamp
            } : null,
            timeSinceLastPacket = timeSinceLastPacket
        };

        var json = JsonConvert.SerializeObject(request);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        var response = await httpClient.PostAsync(
            $"{apiBaseUrl}/api/preservation-core/classify",
            content
        );

        response.EnsureSuccessStatusCode();
        var responseJson = await response.Content.ReadAsStringAsync();
        return JsonConvert.DeserializeObject<ClassificationResult>(responseJson);
    }
}

// Usage in your match disconnect handler
public async void OnPlayerDisconnect(string playerId, MatchState matchState)
{
    // Capture network state before disconnect
    var networkSnapshot = new NetworkSnapshot
    {
        LatencyMs = GetPlayerLatency(playerId),
        PacketLossRate = GetPlayerPacketLoss(playerId),
        IsConnected = IsPlayerConnected(playerId),
        Timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
    };

    // Determine if it was a quit action
    bool quitAction = WasExplicitQuit(playerId);

    // Get time since last packet
    int? timeSinceLastPacket = GetTimeSinceLastPacket(playerId);

    // Classify disconnect
    var client = new PreservationCoreClient("https://your-domain.com");
    var result = await client.ClassifyDisconnect(quitAction, networkSnapshot, timeSinceLastPacket);

    // Apply result
    if (result.LossApplied)
    {
        ApplyLoss(playerId, matchState);
    }
    else
    {
        PreserveMatchState(playerId, matchState);
    }
}
```

#### Example: JavaScript / Node.js

```javascript
async function classifyDisconnect(quitAction, networkSnapshot, timeSinceLastPacket) {
  const response = await fetch('https://your-domain.com/api/preservation-core/classify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      quitAction,
      networkBeforeDisconnect: networkSnapshot,
      timeSinceLastPacket,
    }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  return await response.json();
}

// Usage in your match disconnect handler
async function onPlayerDisconnect(playerId, matchState) {
  // Capture network state before disconnect
  const networkSnapshot = {
    latencyMs: getPlayerLatency(playerId),
    packetLossRate: getPlayerPacketLoss(playerId),
    isConnected: isPlayerConnected(playerId),
    timestamp: Date.now(),
  };

  // Determine if it was a quit action
  const quitAction = wasExplicitQuit(playerId);

  // Get time since last packet
  const timeSinceLastPacket = getTimeSinceLastPacket(playerId);

  // Classify disconnect
  const result = await classifyDisconnect(quitAction, networkSnapshot, timeSinceLastPacket);

  // Apply result
  if (result.lossApplied) {
    applyLoss(playerId, matchState);
  } else {
    preserveMatchState(playerId, matchState);
  }
}
```

### Option 2: Direct Integration (Advanced)

If you prefer to integrate the classification logic directly into your codebase, you can import the core module:

```typescript
import { classifyDisconnect, type DisconnectSignals } from '@/lib/preservation-core';

const result = classifyDisconnect({
  quitAction: false,
  networkBeforeDisconnect: {
    latencyMs: 1200,
    packetLossRate: 0.4,
    isConnected: false,
  },
  timeSinceLastPacket: 6000,
});
```

## When to Call Preservation Core

Call Preservation Core when a disconnect is detected, typically:

1. **During Match**: When a player's connection is lost
2. **On Disconnect Event**: When your networking layer detects a disconnect
3. **Post-Match**: When finalizing match results (if disconnect occurred)

### Recommended Flow

```
1. Match is running
2. Player disconnect detected
3. Capture network state snapshot (latency, packet loss, connection status)
4. Determine if explicit quit action occurred
5. Call Preservation Core API
6. Apply result:
   - If lossApplied = true → Record loss for player
   - If lossApplied = false → Preserve match state (no loss)
```

## Data Requirements

### Minimum Required Data

- `quitAction`: Whether the user explicitly quit

### Recommended Additional Data

- `networkBeforeDisconnect`: Network state before disconnect
  - Helps distinguish network issues from intentional quits
- `timeSinceLastPacket`: Time since last successful packet
  - Helps detect timeouts

### How to Capture Network State

Most game engines provide network monitoring APIs:

- **Unity Netcode**: `NetworkManager.Singleton.NetworkConfig.NetworkTransport.GetCurrentRtt()`
- **Unreal Engine**: `UNetConnection::AvgLag`, `UNetConnection::PacketLoss`
- **Custom Networking**: Track RTT, packet loss, and connection status in your networking layer

## Classification Thresholds

Preservation Core uses the following thresholds:

- **High Packet Loss**: ≥ 25% (`0.25`)
- **High Latency**: ≥ 800ms
- **Timeout**: ≥ 5000ms (5 seconds) since last packet

These thresholds can be customized by modifying the `THRESHOLDS` constant in `lib/preservation-core.ts`.

## Decision Logic

1. **Intentional Disconnect**: If `quitAction = true` → `lossApplied = true`
2. **Unintentional Disconnect**: If timeout, high packet loss, high latency, or hard disconnect detected → `lossApplied = false`
3. **No Disconnect**: If no signals detected → `lossApplied = false`

## Day-1 Integration Checklist

- [ ] Set up API client in your game server/client
- [ ] Implement network state capture before disconnect
- [ ] Detect explicit quit actions (Alt+F4, quit button, etc.)
- [ ] Call Preservation Core API on disconnect
- [ ] Apply `lossApplied` result to match outcome
- [ ] Test with intentional quits (should apply loss)
- [ ] Test with network drops (should preserve state)
- [ ] Monitor API responses and log for debugging

## Basic Day-1 Integration Example

Here's a minimal integration example:

```javascript
// Minimal integration - just the essentials
async function handleDisconnect(playerId) {
  const quitAction = detectQuitAction(playerId);
  const networkState = captureNetworkState(playerId);
  
  const response = await fetch('/api/preservation-core/classify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      quitAction,
      networkBeforeDisconnect: networkState,
    }),
  });
  
  const result = await response.json();
  
  if (result.lossApplied) {
    recordLoss(playerId);
  } else {
    preserveMatch(playerId);
  }
}
```

## API Documentation

For full API documentation, call:

```
GET /api/preservation-core/classify
```

This returns the complete API specification including request/response schemas and examples.

## Support

For questions or issues, contact the Igraverse team or refer to the test harness UI at `/preservation-core` for interactive testing.

