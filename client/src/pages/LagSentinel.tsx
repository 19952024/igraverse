import { useEffect, useState } from "react";
import {
  analyzePingSpikes,
  decideMercyDisconnect,
  type PingSample,
} from "@shared/lag-sentinel";

export default function LagSentinelPage() {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
  }, []);

  return (
    <main id="lag-sentinel" className="view active">
      <section className="container section pt-28 pb-32">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10">
            <p className="text-sm uppercase tracking-[0.25em] text-primary mb-3">
              Lag Sentinel – Console MVP
            </p>
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
              Lag Sentinel
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl">
              Detects abnormal network latency patterns and possible lag manipulation on
              console matches by watching simple ping telemetry and protecting players
              from unplayable connections.
            </p>
          </div>

          <div className="space-y-10">
            <div className="glass-panel rounded-3xl border border-primary/20 p-8 md:p-10">
              <h2 className="text-2xl font-semibold mb-4">1. Ping Spike Detection</h2>
              <p className="text-muted-foreground mb-4">
                During a match, Lag Sentinel continuously tracks ping samples (in
                milliseconds). When ping exceeds the threshold of{" "}
                <strong>200ms</strong>, the sample is recorded as a spike. If multiple
                spikes occur within a short time window, the connection is considered
                unstable.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-muted-foreground mb-4">
                <div>
                  <p className="font-semibold mb-2">Example: normal ping</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>30ms</li>
                    <li>34ms</li>
                    <li>32ms</li>
                    <li>33ms</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold mb-2">Example: unstable ping</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>35ms</li>
                    <li>38ms</li>
                    <li>280ms</li>
                    <li>36ms</li>
                    <li>300ms</li>
                    <li>34ms</li>
                  </ul>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Any ping value where <strong>ping &gt; 200ms</strong> is treated as a{" "}
                <strong>spike</strong>. When at least two spikes occur within a 10‑second
                window, Lag Sentinel flags the connection as unstable due to ping spikes.
              </p>
            </div>

            <div className="glass-panel rounded-3xl border border-primary/20 p-8 md:p-10">
              <h2 className="text-2xl font-semibold mb-4">
                2. Mercy Disconnect (Match Protection)
              </h2>
              <p className="text-muted-foreground mb-4">
                When connection quality becomes too poor for gameplay, Lag Sentinel can
                automatically terminate the match early instead of forcing players to sit
                through a clearly unplayable experience.
              </p>
              <p className="text-sm text-muted-foreground mb-3">
                A match is protected by a mercy disconnect if{" "}
                <strong>any</strong> of the following becomes true:
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground mb-4">
                <li>
                  <strong>Ping &gt; 200ms</strong> sustained for more than{" "}
                  <strong>15 seconds</strong>.
                </li>
                <li>
                  Multiple severe ping spikes (ping &gt; 200ms) occur within a short{" "}
                  <strong>10‑second</strong> window.
                </li>
              </ul>
              <p className="text-sm text-muted-foreground mb-2">
                When either condition is met, Lag Sentinel issues the decision:
              </p>
              <p className="font-mono text-xs md:text-sm bg-background/60 border border-destructive/30 rounded-xl px-4 py-3 text-destructive">
                Match terminated due to unstable connection.
              </p>
            </div>

            {/* Simple in-browser test harness */}
            <LagSentinelTestHarness />
          </div>
        </div>
      </section>
    </main>
  );
}

function LagSentinelTestHarness() {
  const [scenarioName, setScenarioName] = useState<string | null>(null);
  const [samples, setSamples] = useState<PingSample[] | null>(null);
  const [spikeValues, setSpikeValues] = useState<
    | {
        totalSpikes: number;
        recentWindowSpikes: number;
        unstable: boolean;
      }
    | null
  >(null);
  const [decisionValues, setDecisionValues] = useState<
    | {
        shouldTerminateMatch: boolean;
        sustainedHighPing: boolean;
        multipleSpikesInWindow: boolean;
        reason: string | null;
      }
    | null
  >(null);
  const [connectionLabel, setConnectionLabel] = useState<string | null>(null);
  const [decisionLabel, setDecisionLabel] = useState<string | null>(null);
  const [ruleLabel, setRuleLabel] = useState<string | null>(null);
  const [customInput, setCustomInput] = useState<string>("");
  const [customError, setCustomError] = useState<string | null>(null);

  const clearResults = () => {
    setScenarioName(null);
    setSamples(null);
    setSpikeValues(null);
    setDecisionValues(null);
    setConnectionLabel(null);
    setDecisionLabel(null);
    setRuleLabel(null);
    setCustomError(null);
  };

  const runScenario = (samples: PingSample[], label: string) => {
    const now = Date.now();
    const spikes = analyzePingSpikes(samples, now);
    const decision = decideMercyDisconnect(samples, now);

    setScenarioName(label);
    setSamples(samples);
    setSpikeValues(spikes);
    setDecisionValues(decision);

    if (spikes.unstable) {
      setConnectionLabel(
        `Connection status: Unstable (detected ${spikes.recentWindowSpikes} spike${
          spikes.recentWindowSpikes === 1 ? "" : "s"
        } above 200ms in the last 10 seconds).`
      );
    } else if (spikes.totalSpikes > 0) {
      setConnectionLabel(
        `Connection status: Mostly stable (occasional spike above 200ms, but not enough to be considered unstable).`
      );
    } else {
      setConnectionLabel("Connection status: Stable (no spikes above 200ms detected).");
    }

    if (decision.shouldTerminateMatch) {
      setDecisionLabel(
        decision.reason ?? "Match terminated due to unstable connection."
      );

      if (decision.sustainedHighPing && decision.multipleSpikesInWindow) {
        setRuleLabel(
          "Triggered by BOTH rules: sustained high ping (>200ms for more than 15s) AND multiple severe spikes in a 10-second window."
        );
      } else if (decision.sustainedHighPing) {
        setRuleLabel(
          "Triggered by Rule A: ping stayed above 200ms for more than 15 seconds (sustained high ping)."
        );
      } else if (decision.multipleSpikesInWindow) {
        setRuleLabel(
          "Triggered by Rule B: multiple severe ping spikes above 200ms within a 10-second window."
        );
      } else {
        setRuleLabel(null);
      }
    } else {
      setDecisionLabel("Match continues (no mercy disconnect needed).");
      setRuleLabel(null);
    }

    // Also log full details for debugging
    // eslint-disable-next-line no-console
    console.log("[LagSentinelTest]", { label, spikes, decision, samples });
  };

  const handleNormalPing = () => {
    const base = Date.now() - 20_000;
    const samples: PingSample[] = [30, 34, 32, 33].map((ping, idx) => ({
      timestampMs: base + idx * 1_000,
      pingMs: ping,
    }));
    runScenario(samples, "Normal ping (no spikes)");
  };

  const handleUnstableSpikes = () => {
    const base = Date.now() - 10_000;
    const pings = [35, 38, 280, 36, 300, 34];
    const samples: PingSample[] = pings.map((ping, idx) => ({
      timestampMs: base + idx * 1_000,
      pingMs: ping,
    }));
    runScenario(samples, "Unstable ping (multiple spikes in 10s window)");
  };

  const handleSustainedHighPing = () => {
    const base = Date.now() - 20_000;
    // 4 seconds of normal, then 18 seconds above 200ms
    const pings: number[] = [
      40, 38, 35, 39, // first 4s normal
      ...Array.from({ length: 18 }, () => 250), // next 18s sustained high ping (>15s)
    ];
    const samples: PingSample[] = pings.map((ping, idx) => ({
      timestampMs: base + idx * 1_000,
      pingMs: ping,
    }));
    runScenario(samples, "Sustained high ping (>200ms for >15s)");
  };

  return (
    <div className="glass-panel rounded-3xl border border-primary/30 p-6 md:p-8">
      <h2 className="text-xl font-semibold mb-3">Interactive Lag Sentinel Test</h2>
      <p className="text-sm text-muted-foreground mb-4">
        You can either run one of the fixed examples or paste your own ping values. Lag
        Sentinel will use those values to calculate spikes and the mercy-disconnect
        decision in real time.
      </p>

      <div className="flex flex-wrap gap-3 mb-4">
        <button
          type="button"
          onClick={handleNormalPing}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-background border border-primary/40 hover:border-primary text-primary transition-colors"
        >
          Run normal ping example
        </button>
        <button
          type="button"
          onClick={handleUnstableSpikes}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-background border border-primary/40 hover:border-primary text-primary transition-colors"
        >
          Run unstable spikes example
        </button>
        <button
          type="button"
          onClick={handleSustainedHighPing}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-background border border-primary/40 hover:border-primary text-primary transition-colors"
        >
          Run sustained high ping example
        </button>
      </div>

      <div className="mb-4 space-y-2">
        <div className="text-xs font-semibold text-muted-foreground">
          Or enter your own ping values (ms), separated by commas:
        </div>
        <textarea
          className="w-full min-h-[80px] rounded-md bg-background border border-primary/30 px-3 py-2 text-xs font-mono resize-y focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="e.g. 35, 42, 210, 220, 180, 260"
          value={customInput}
          onChange={(e) => {
            setCustomInput(e.target.value);
            setCustomError(null);
          }}
        />
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={clearResults}
            className="px-4 py-1.5 rounded-lg text-xs font-medium bg-background border border-white/10 hover:border-white/20 text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear results
          </button>
          <button
            type="button"
            onClick={() => {
              const raw = customInput
                .split(/[, \n\r]+/)
                .map((v) => v.trim())
                .filter(Boolean);
              const pings = raw.map((v) => Number(v)).filter((n) => !Number.isNaN(n));

              if (!pings.length) {
                setCustomError("Please enter at least one numeric ping value.");
                return;
              }

              const base = Date.now() - pings.length * 1_000;
              const samples: PingSample[] = pings.map((ping, idx) => ({
                timestampMs: base + idx * 1_000,
                pingMs: ping,
              }));

              runScenario(samples, "Custom ping input");
            }}
            className="px-4 py-1.5 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Run custom test
          </button>
        </div>
        {customError && (
          <div className="text-[11px] text-destructive mt-1">{customError}</div>
        )}
      </div>

      {scenarioName && samples && spikeValues && decisionValues && (
        <div className="mt-4 space-y-3 text-xs md:text-sm bg-background/60 border border-primary/20 rounded-xl px-4 py-3 text-foreground">
          <div className="font-semibold text-primary mb-1">Scenario: {scenarioName}</div>

          <div className="space-y-1">
            <div className="font-semibold">Ping samples (ms):</div>
            <div className="font-mono">
              {samples.map((s) => s.pingMs).join(", ")}
            </div>
          </div>

          <div className="space-y-1">
            <div className="font-semibold">Spike analysis:</div>
            <div className="font-mono">
              totalSpikes={spikeValues.totalSpikes} · recentWindowSpikes=
              {spikeValues.recentWindowSpikes} · unstable=
              {String(spikeValues.unstable)}
            </div>
          </div>

          <div className="space-y-1">
            <div className="font-semibold">Mercy disconnect decision:</div>
            <div className="font-mono">
              shouldTerminateMatch={String(decisionValues.shouldTerminateMatch)} ·
              sustainedHighPing={String(decisionValues.sustainedHighPing)} ·
              multipleSpikesInWindow={String(decisionValues.multipleSpikesInWindow)}
            </div>
            <div className="font-mono">
              reason={decisionValues.reason ?? "null"}
            </div>
          </div>

          {connectionLabel && <div className="pt-1">{connectionLabel}</div>}
          {decisionLabel && (
            <div
              className={
                decisionLabel.startsWith("Match continues")
                  ? "text-emerald-400"
                  : "text-destructive"
              }
            >
              {decisionLabel}
            </div>
          )}
          {ruleLabel && <div className="text-xs text-muted-foreground">{ruleLabel}</div>}
        </div>
      )}
    </div>
  );
}


