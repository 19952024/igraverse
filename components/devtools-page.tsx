interface DevToolsPageProps {
  active: boolean
}

export default function DevToolsPage({ active }: DevToolsPageProps) {
  return (
    <main id="devtools" className={`view ${active ? "active" : ""}`}>
      <section className="container section">
        <div className="center" style={{ marginBottom: "8px" }}>
          <div className="title" style={{ fontSize: "30px", marginBottom: "6px" }}>
            Developer Tools
          </div>
          <p className="lead" style={{ maxWidth: "980px", margin: "14px auto 26px" }}>
            Dev Tools give game creators AI systems that make development faster, smarter, and more efficient while
            opening the door to entirely new forms of gameplay and immersion, pushing the boundaries of what&apos;s
            possible and expanding how games are created and experienced like never before.
          </p>
        </div>

        <div className="dev-grid">
          <div className="dev-card card">
            <div className="title">AI Asset Generator</div>
            <p className="muted">
              Upload a sketch image or prompt and get a fully rendered rig ready 3D model with real time preview and
              export to Unity Unreal or Blender.
            </p>
          </div>
          <div className="dev-card card">
            <div className="title">Auto Rigging and Motion Retargeting</div>
            <p className="muted">
              Detects limbs builds a clean skeleton and applies motion data. Retarget movement between models seamlessly
              and preview before export.
            </p>
          </div>
          <div className="dev-card card">
            <div className="title">Logic Composer</div>
            <p className="muted">
              Type what you want and the system creates working logic trees you can edit visually. Export straight to
              your engine.
            </p>
          </div>
          <div className="dev-card card">
            <div className="title">BugSmith Core</div>
            <p className="muted">
              Frame by frame analysis finds animation texture physics and logic issues. Time stamped reports and pattern
              tracking for cleaner releases.
            </p>
          </div>
        </div>

        <div className="center" style={{ marginTop: "16px" }}>
          <span className="btn-ghost">Coming Soon</span>
        </div>
      </section>
    </main>
  )
}
