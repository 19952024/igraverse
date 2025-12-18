/**
 * Preservation Core - Three Scenarios End-to-End Test
 * 
 * This test verifies that all three disconnect scenarios work correctly
 * and that the API response `lossApplied` is what game servers use to apply or skip losses.
 */

import { classifyDisconnect, type DisconnectSignals } from '../lib/preservation-core'

describe('Preservation Core - Three Scenarios', () => {
  
  /**
   * Scenario A: Normal Match Completion (No Disconnect)
   * 
   * Expected: lossApplied = false (no disconnect detected)
   */
  test('Scenario A: Normal match completion - no disconnect', () => {
    const signals: DisconnectSignals = {
      quitAction: false,
      // No network data provided (normal completion)
    }

    const result = classifyDisconnect(signals)

    // Verify response
    expect(result.type).toBe('none')
    expect(result.lossApplied).toBe(false) // ← Game server uses this to skip loss
    
    // Verify signals
    expect(result.signals.quitDetected).toBe(false)
    expect(result.signals.timeoutDetected).toBe(false)
    expect(result.signals.highPacketLoss).toBe(false)
    expect(result.signals.highLatency).toBe(false)
    expect(result.signals.hardDisconnect).toBe(false)

    // Game server action: preserveMatch() - normal completion
    console.log('✅ Scenario A: Normal completion → lossApplied: false → No loss applied')
  })

  /**
   * Scenario B: Intentional Disconnect (Player Quits)
   * 
   * Situation: Player is losing (e.g., down 2-7) and quits
   * Expected: lossApplied = true (intentional disconnect)
   */
  test('Scenario B: Intentional disconnect - player quits', () => {
    const signals: DisconnectSignals = {
      quitAction: true, // Player explicitly quit
    }

    const result = classifyDisconnect(signals)

    // Verify response
    expect(result.type).toBe('intentional_disconnect')
    expect(result.lossApplied).toBe(true) // ← Game server uses this to apply loss
    
    // Verify signals
    expect(result.signals.quitDetected).toBe(true)
    expect(result.signals.timeoutDetected).toBe(false)
    expect(result.signals.highPacketLoss).toBe(false)
    expect(result.signals.highLatency).toBe(false)
    expect(result.signals.hardDisconnect).toBe(false)

    // Game server action: applyLoss() - player quit intentionally
    console.log('✅ Scenario B: Player quits → lossApplied: true → Loss applied')
  })

  /**
   * Scenario C: Unintentional Disconnect (Network Issue While Winning)
   * 
   * Situation: Player is winning (e.g., up 7-2) and connection drops
   * Expected: lossApplied = false (unintentional disconnect - prevents unfair loss)
   */
  test('Scenario C: Unintentional disconnect - network issue while winning', () => {
    const signals: DisconnectSignals = {
      quitAction: false, // Player did NOT quit
      networkBeforeDisconnect: {
        latencyMs: 1200, // High latency (network problem)
        packetLossRate: 0.4, // High packet loss (40%)
        isConnected: false, // Connection dropped
      },
    }

    const result = classifyDisconnect(signals)

    // Verify response
    expect(result.type).toBe('unintentional_disconnect')
    expect(result.lossApplied).toBe(false) // ← Game server uses this to skip loss
    
    // Verify signals
    expect(result.signals.quitDetected).toBe(false)
    expect(result.signals.timeoutDetected).toBe(false)
    expect(result.signals.highPacketLoss).toBe(true) // Detected high packet loss
    expect(result.signals.highLatency).toBe(true) // Detected high latency
    expect(result.signals.hardDisconnect).toBe(true) // Detected hard disconnect

    // Game server action: preserveMatch() - prevents unfair loss
    // Player was winning, connection issue was not their fault
    // Opponent doesn't get a free win
    console.log('✅ Scenario C: Network issue while winning → lossApplied: false → Loss prevented (unfair win prevented)')
  })

  /**
   * Additional Test: Network Issue with Timeout
   */
  test('Scenario C variant: Network timeout while winning', () => {
    const signals: DisconnectSignals = {
      quitAction: false,
      networkBeforeDisconnect: {
        latencyMs: 50, // Normal latency
        packetLossRate: 0.05, // Normal packet loss
        isConnected: true, // Connection was active
      },
      timeSinceLastPacket: 6000, // 6 seconds since last packet (timeout)
    }

    const result = classifyDisconnect(signals)

    // Verify response
    expect(result.type).toBe('unintentional_disconnect')
    expect(result.lossApplied).toBe(false) // ← Game server uses this to skip loss
    
    // Verify signals
    expect(result.signals.timeoutDetected).toBe(true) // Timeout detected

    console.log('✅ Scenario C variant: Timeout detected → lossApplied: false → Loss prevented')
  })
})

/**
 * Game Server Integration Example
 * 
 * This shows exactly how a game server would use the API response
 */
describe('Game Server Integration Example', () => {
  test('Game server uses lossApplied to decide', async () => {
    // Simulate API call
    const apiResponse = {
      type: 'unintentional_disconnect',
      lossApplied: false, // ← THIS IS WHAT THE GAME SERVER USES
      signals: {
        quitDetected: false,
        timeoutDetected: false,
        highPacketLoss: true,
        highLatency: true,
        hardDisconnect: true,
      },
    }

    // Game server logic
    if (apiResponse.lossApplied) {
      // Apply loss
      console.log('Applying loss...')
      expect(apiResponse.lossApplied).toBe(true)
    } else {
      // Skip loss (preserve match)
      console.log('Skipping loss - preserving match...')
      expect(apiResponse.lossApplied).toBe(false)
    }

    // Verify: lossApplied is the decision field
    expect(typeof apiResponse.lossApplied).toBe('boolean')
    expect(apiResponse.lossApplied).toBe(false) // In this case, loss is prevented
  })
})

