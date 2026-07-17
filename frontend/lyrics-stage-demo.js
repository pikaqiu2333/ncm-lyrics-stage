(() => {
    const { LyricsStageApp, EmptyLyricsProvider, HttpNcmBridgeProvider, MockLyricsProvider, PreviewSongProvider, DEMO_LYRIC_CATALOG } = window.NcmLyricsDemo;
    if (!LyricsStageApp) return;
    const params = new URLSearchParams(window.location.search);
    const mode = params.get("mode");
    const baseUrlParam = params.get("baseUrl");
    const bridgePort = params.get("port") || "3210";
    const previewSongId = params.get("songId");
    const previewAt = Number(params.get("at") || 0);
    const isAuditMode = params.get("audit") === "1";
    const demoTrackKey = params.get("track") || "tiptoes-after-midnight";
    const prefersEmptyFallback = params.get("fallback") === "empty";

    const resolvedBaseUrl = (() => {
        if (baseUrlParam) return baseUrlParam;
        if (window.location.protocol === "http:" || window.location.protocol === "https:") {
            return window.location.origin;
        }
        return `http://127.0.0.1:${bridgePort}`;
    })();

    const fallbackProvider = prefersEmptyFallback
        ? new EmptyLyricsProvider()
        : new MockLyricsProvider({
            catalog: DEMO_LYRIC_CATALOG,
            trackKey: demoTrackKey,
        });

    const provider = mode === "mock"
        ? fallbackProvider
        : params.get("preview") === "1" && previewSongId
        ? new PreviewSongProvider({
            baseUrl: resolvedBaseUrl,
            songId: previewSongId,
            fallbackProvider,
            initialPositionSeconds: previewAt,
        })
        : new HttpNcmBridgeProvider({
            baseUrl: resolvedBaseUrl,
            fallbackProvider,
            lyricSongIdOverride: previewSongId,
        });

    const app = new LyricsStageApp({
        stage: document.getElementById("lyrics-stage"),
        coverImage: document.getElementById("stage-cover-image"),
        emptyState: document.getElementById("stage-empty"),
        emptyTitle: document.getElementById("stage-empty-title"),
        emptyHint: document.getElementById("stage-empty-hint"),
        providerBadge: document.getElementById("provider-status-badge"),
        providerHint: document.getElementById("provider-status-hint"),
        modeSwitchShell: document.getElementById("mode-switch-shell"),
        modeSwitch: document.getElementById("mode-switch"),
        modeSwitchToggle: document.getElementById("mode-switch-toggle"),
        timingDisclaimer: document.getElementById("timing-disclaimer"),
        disclaimerButtons: Array.from(document.querySelectorAll("[data-disclaimer-action]")),
        modeButtons: Array.from(document.querySelectorAll("[data-display-mode]")),
        currentLine: document.getElementById("line-current"),
        currentGlow: document.getElementById("line-current-glow"),
        currentShell: document.querySelector(".line-shell--active"),
        measureLine: document.getElementById("line-measure"),
    }, provider);

    window.lyricsStageApp = app;
    window.auditLyricsStage = () => app.auditTrackLayout();
    window.auditCurrentLyric = () => app.auditCurrentLayout();

    async function publishAuditResult() {
        if (document.fonts?.ready) {
            try {
                await document.fonts.ready;
            } catch (error) {
                // Ignore font readiness failures and continue with the audit.
            }
        }

        await new Promise((resolve) => window.setTimeout(resolve, 240));
        const result = app.auditTrackLayout();
        const existing = document.getElementById("audit-json");
        if (existing) existing.remove();

        const script = document.createElement("script");
        script.id = "audit-json";
        script.type = "application/json";
        script.textContent = JSON.stringify(result);
        document.body.appendChild(script);

        const status = result?.summary?.fail
            ? "fail"
            : result?.summary?.warn
                ? "warn"
                : "pass";
        document.documentElement.setAttribute("data-audit-status", status);
    }

    app.start().then(() => {
        if (isAuditMode) {
            publishAuditResult();
        }
    });
})();
