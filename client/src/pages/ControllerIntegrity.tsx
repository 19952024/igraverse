import { useEffect, useState } from "react";
import {
  analyzeInputRhythm,
  evaluateControllerIntegrity,
  type InputPressSample,
} from "@shared/controller-integrity";

export default function ControllerIntegrityPage() {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
  }, []);

  return (
    <main id="controller-integrity" className="view active">
      <section className="container section pt-28 pb-32">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10">
            <p className="text-sm uppercase tracking-[0.25em] text-primary mb-3">
              Controller Integrity – Console MVP
            </p>
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
              Controller Integrity
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl">
              Detects macro behavior, turbo inputs, and scripted controller patterns that
              provide unfair advantages by analyzing input rhythm instead of hardware.
            </p>
          </div>

          <div className="space-y-10">
            <div className="glass-panel rounded-3xl border border-primary/20 p-8 md:p-10">
              <h2 className="text-2xl font-semibold mb-4">
                1. Input Rhythm Consistency Detection
              </h2>
              <p className="text-muted-foreground mb-4">
                The system tracks the timing between repeated button presses and measures
                how consistent the intervals are. Human players naturally have variation
                in their timing, even when pressing quickly, while macro or turbo inputs
                tend to have extremely consistent intervals.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-muted-foreground mb-4">
                <div>
                  <p className="font-semibold mb-2">Example human input timing</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>28ms</li>
                    <li>34ms</li>
                    <li>30ms</li>
                    <li>37ms</li>
                    <li>29ms</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold mb-2">Example suspicious input timing</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>32ms</li>
                    <li>32ms</li>
                    <li>32ms</li>
                    <li>32ms</li>
                    <li>32ms</li>
                  </ul>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Controller Integrity records timestamps for button presses, calculates the
                time interval between presses, and analyzes how often identical intervals
                repeat.{" "}
                <strong>
                  If identical timing intervals repeat more than 10 times consecutively,
                </strong>{" "}
                the pattern is flagged as suspicious.
              </p>
            </div>

            <div className="glass-panel rounded-3xl border border-primary/20 p-8 md:p-10">
              <h2 className="text-2xl font-semibold mb-4">2. Suspicious Input Flag</h2>
              <p className="text-muted-foreground mb-4">
                When suspicious input patterns occur during a match, Controller Integrity
                generates a simple integrity flag. The system itself does not ban players
                or apply penalties — it only records a signal that can be consumed by
                your wider integrity and rules systems.
              </p>
              <p className="text-sm text-muted-foreground mb-2">
                Example result when suspicious patterns are detected:
              </p>
              <p className="font-mono text-xs md:text-sm bg-background/60 border border-yellow-400/60 rounded-xl px-4 py-3 text-yellow-300">
                Controller Integrity Status: Suspicious
              </p>
              <p className="text-sm text-muted-foreground mt-3">
                If no such patterns are found, the status remains{" "}
                <span className="font-mono">normal</span>, indicating that the observed
                input rhythm is consistent with human play.
              </p>
            </div>

            <ControllerIntegrityTestHarness />
          </div>
        </div>
      </section>
    </main>
  );
}

function ControllerIntegrityTestHarness() {
  const [scenarioName, setScenarioName] = useState<string | null>(null);
  const [intervals, setIntervals] = useState<number[] | null>(null);
  const [analysisSummary, setAnalysisSummary] = useState<string | null>(null);
  const [statusLabel, setStatusLabel] = useState<string | null>(null);
  const [customInput, setCustomInput] = useState<string>("");
  const [customError, setCustomError] = useState<string | null>(null);

  const runScenarioWithIntervals = (intervalsMs: number[], label: string) => {
    const start = Date.now() - intervalsMs.length * 10; // compact timeline
    const presses: InputPressSample[] = [];
    let currentTime = start;

    // First press
    presses.push({ timestampMs: currentTime });
    // Subsequent presses spaced by the provided intervals
    for (const dt of intervalsMs) {
      currentTime += dt;
      presses.push({ timestampMs: currentTime });
    }

    const analysis = analyzeInputRhythm(presses);
    const result = evaluateControllerIntegrity(presses);

    setScenarioName(label);
    setIntervals(analysis.intervalsMs);

    setAnalysisSummary(
      `totalPresses=${analysis.totalPresses}, totalIntervals=${analysis.totalIntervals}, maxIdenticalIntervalRun=${analysis.maxIdenticalIntervalRun}`
    );

    if (result.suspicious) {
      setStatusLabel("Controller Integrity Status: Suspicious");
    } else {
      setStatusLabel("Controller Integrity Status: Normal");
    }

    // eslint-disable-next-line no-console
    console.log("[ControllerIntegrityTest]", { label, analysis, result, presses });
  };

  const handleHumanLikeExample = () => {
    // Slightly varied human-like intervals
    runScenarioWithIntervals(
      [28, 34, 30, 37, 29, 33, 31, 36, 27, 35],
      "Human-like input timing (varied intervals)"
    );
  };

  const handleSuspiciousTurboExample = () => {
    // Identical intervals repeated many times
    const intervals = Array.from({ length: 15 }, () => 32);
    runScenarioWithIntervals(
      intervals,
      "Suspicious macro/turbo timing (identical intervals)"
    );
  };

  const clearResults = () => {
    setScenarioName(null);
    setIntervals(null);
    setAnalysisSummary(null);
    setStatusLabel(null);
    setCustomError(null);
  };

  return (
    <div className="glass-panel rounded-3xl border border-primary/30 p-6 md:p-8">
      <h2 className="text-xl font-semibold mb-3">Interactive Controller Integrity Test</h2>
      <p className="text-sm text-muted-foreground mb-4">
        These examples simulate timing between repeated button presses. Controller
        Integrity converts them into press timestamps, analyzes the rhythm, and shows
        whether the pattern would be flagged as suspicious.
      </p>

      <div className="flex flex-wrap gap-3 mb-4">
        <button
          type="button"
          onClick={handleHumanLikeExample}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-background border border-primary/40 hover:border-primary text-primary transition-colors"
        >
          Run human-like timing example
        </button>
        <button
          type="button"
          onClick={handleSuspiciousTurboExample}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-background border border-primary/40 hover:border-primary text-primary transition-colors"
        >
          Run suspicious turbo example
        </button>
      </div>

      <div className="mb-4 space-y-2">
        <div className="text-xs font-semibold text-muted-foreground">
          Or enter your own timing intervals (ms), separated by commas:
        </div>
        <textarea
          className="w-full min-h-[80px] rounded-md bg-background border border-primary/30 px-3 py-2 text-xs font-mono resize-y focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="e.g. 28, 34, 30, 37, 29"
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
              const intervals = raw.map((v) => Number(v)).filter((n) => !Number.isNaN(n));

              if (!intervals.length) {
                setCustomError("Please enter at least one numeric interval value.");
                return;
              }

              runScenarioWithIntervals(intervals, "Custom interval input");
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

      {scenarioName && intervals && analysisSummary && statusLabel && (
        <div className="mt-4 space-y-3 text-xs md:text-sm bg-background/60 border border-primary/20 rounded-xl px-4 py-3 text-foreground">
          <div className="font-semibold text-primary mb-1">Scenario: {scenarioName}</div>

          <div className="space-y-1">
            <div className="font-semibold">Intervals between presses (ms):</div>
            <div className="font-mono">{intervals.join(", ")}</div>
          </div>

          <div className="space-y-1">
            <div className="font-semibold">Rhythm analysis:</div>
            <div className="font-mono">{analysisSummary}</div>
          </div>

          <div
            className={
              statusLabel.endsWith("Suspicious")
                ? "font-mono text-yellow-300"
                : "font-mono text-emerald-400"
            }
          >
            {statusLabel}
          </div>

          <div className="text-xs text-muted-foreground">
            Note: Controller Integrity only outputs this integrity status. Any enforcement
            or action based on this signal is handled by your game or tournament rules,
            not by this system itself.
          </div>
        </div>
      )}
    </div>
  );
}

