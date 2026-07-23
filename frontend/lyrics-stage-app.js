(function attachNcmLyricsDemo(global) {
    const DEMO_LYRIC_CATALOG = {
        "tiptoes-after-midnight": {
            key: "tiptoes-after-midnight",
            title: "Tiptoes After Midnight",
            artist: "Star Office Radio",
            lines: [
                {
                    accent: "#ff5f8f",
                    accentSoft: "rgba(255, 95, 143, 0.26)",
                    accentCold: "#7a8cff",
                    rows: [["I'MA", "HAVE", "YOU"], ["ON", "TIPTOES"]],
                    durations: [0.54, 0.44, 0.36, 0.84],
                },
                {
                    accent: "#8d7cff",
                    accentSoft: "rgba(141, 124, 255, 0.24)",
                    accentCold: "#54d7ff",
                    rows: [["HEARTBEAT", "MOVING"], ["LIKE", "A", "STROBE"]],
                    durations: [0.72, 0.42, 0.34, 0.58, 0.3],
                },
                {
                    accent: "#ff9363",
                    accentSoft: "rgba(255, 147, 99, 0.22)",
                    accentCold: "#ffd36e",
                    rows: [["EVERY", "WORD", "IS"], ["PULLING", "YOU", "CLOSER"]],
                    durations: [0.38, 0.48, 0.24, 0.64, 0.34, 0.66],
                },
                {
                    accent: "#54d7ff",
                    accentSoft: "rgba(84, 215, 255, 0.22)",
                    accentCold: "#9e86ff",
                    rows: [["LET", "THE"], ["NEON", "BREATHE"], ["THROUGH", "YOUR", "SHADOW"]],
                    durations: [0.28, 0.26, 0.6, 0.48, 0.4, 0.34, 0.66],
                },
                {
                    accent: "#f45bb6",
                    accentSoft: "rgba(244, 91, 182, 0.26)",
                    accentCold: "#8c87ff",
                    rows: [["WE", "CAN", "TURN", "THIS"], ["SCREEN", "INTO", "A", "FEELING"]],
                    durations: [0.26, 0.28, 0.4, 0.32, 0.46, 0.36, 0.24, 0.74],
                },
            ],
        },
        "moonlit-echo": {
            key: "moonlit-echo",
            title: "月色回声",
            artist: "Lyric Stage Demo",
            lines: [
                {
                    accent: "#7ba6ff",
                    accentSoft: "rgba(123, 166, 255, 0.24)",
                    accentCold: "#d7ecff",
                    rows: [["晚风", "掠过", "屋檐"], ["灯火", "落在", "指尖"]],
                    durations: [0.42, 0.46, 0.5, 0.42, 0.46, 0.54],
                },
                {
                    accent: "#8fd6ff",
                    accentSoft: "rgba(143, 214, 255, 0.22)",
                    accentCold: "#f6fbff",
                    rows: [["月光", "落进", "晚风"], ["城市", "慢慢", "入梦"]],
                    durations: [0.46, 0.42, 0.5, 0.42, 0.48, 0.56],
                },
                {
                    accent: "#c2b0ff",
                    accentSoft: "rgba(194, 176, 255, 0.2)",
                    accentCold: "#8fd6ff",
                    rows: [["让", "旋律", "穿过"], ["每一扇", "亮着的", "窗"]],
                    durations: [0.24, 0.46, 0.5, 0.52, 0.54, 0.28],
                },
                {
                    accent: "#7ba6ff",
                    accentSoft: "rgba(123, 166, 255, 0.24)",
                    accentCold: "#f7f7ff",
                    rows: [["等", "下一阵", "风来"], ["把故事", "轻轻", "展开"]],
                    durations: [0.22, 0.54, 0.48, 0.5, 0.42, 0.56],
                },
            ],
        },
    };

    function normalizeTitle(value) {
        return String(value || "")
            .trim()
            .toLowerCase()
            .replace(/[\s_]+/g, "-")
            .replace(/[^\p{L}\p{N}-]+/gu, "")
            .replace(/-+/g, "-");
    }

    function normalizeWhitespace(value) {
        return String(value || "").replace(/\s+/g, " ").trim();
    }

    function cloneTrack(track) {
        return JSON.parse(JSON.stringify(track));
    }

    function hashString(value) {
        const input = String(value || "");
        let hash = 0;
        for (let index = 0; index < input.length; index += 1) {
            hash = ((hash << 5) - hash + input.charCodeAt(index)) | 0;
        }
        return Math.abs(hash);
    }

    function hslColor(hue, saturation, lightness, alpha = 1) {
        const safeHue = ((Number(hue) % 360) + 360) % 360;
        if (alpha >= 1) {
            return `hsl(${safeHue} ${saturation}% ${lightness}%)`;
        }
        return `hsla(${safeHue}, ${saturation}%, ${lightness}%, ${alpha})`;
    }

    function getTrackDisplaySeed(track) {
        return [track?.id, track?.key, track?.title, track?.artist].filter(Boolean).join(" | ");
    }

    function getTrackInitials(track) {
        const source = String(track?.title || track?.artist || "SO").trim();
        const words = source.match(/[\p{L}\p{N}]+/gu) || [];
        if (words.length >= 2) {
            return `${words[0][0] || ""}${words[1][0] || ""}`.toUpperCase();
        }
        return source.slice(0, 2).toUpperCase();
    }

    function buildGeneratedCover(track, theme) {
        const initials = getTrackInitials(track);
        const title = String(track?.title || "Star Office Radio").slice(0, 28);
        const artist = String(track?.artist || "Lyric Stage").slice(0, 28);
        const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 720">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.accent}"/>
      <stop offset="52%" stop-color="${theme.accentCold}"/>
      <stop offset="100%" stop-color="${theme.bgDeep}"/>
    </linearGradient>
    <radialGradient id="flare" cx="24%" cy="22%" r="66%">
      <stop offset="0%" stop-color="${theme.haze}"/>
      <stop offset="100%" stop-color="transparent"/>
    </radialGradient>
  </defs>
  <rect width="720" height="720" rx="54" fill="url(#bg)"/>
  <rect width="720" height="720" rx="54" fill="url(#flare)"/>
  <circle cx="532" cy="176" r="142" fill="${theme.hazeCold}" opacity="0.48"/>
  <circle cx="164" cy="560" r="208" fill="${theme.haze}" opacity="0.32"/>
  <text x="76" y="360" fill="rgba(255,255,255,0.94)" font-size="220" font-weight="800" font-family="Aptos, Segoe UI, sans-serif">${initials}</text>
  <text x="80" y="610" fill="rgba(255,255,255,0.82)" font-size="44" font-weight="700" font-family="Aptos, Segoe UI, sans-serif">${title}</text>
  <text x="80" y="660" fill="rgba(255,255,255,0.58)" font-size="26" font-weight="600" font-family="Aptos, Segoe UI, sans-serif">${artist}</text>
</svg>`;
        return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
    }

    function buildTrackVisualTheme(track) {
        const seed = hashString(getTrackDisplaySeed(track) || "star-office");
        const baseHue = seed % 360;
        const accentHue = (baseHue + 24 + (seed % 48)) % 360;
        const coldHue = (baseHue + 96 + (seed % 36)) % 360;

        const theme = {
            bg: hslColor(baseHue, 38, 10),
            bgDeep: hslColor((baseHue + 18) % 360, 44, 5),
            accent: hslColor(accentHue, 86, 72),
            accentSoft: hslColor(accentHue, 86, 72, 0.24),
            accentCold: hslColor(coldHue, 82, 74),
            haze: hslColor(accentHue, 84, 68, 0.18),
            hazeCold: hslColor(coldHue, 78, 70, 0.16),
            coverOpacity: track?.coverUrl ? 0.34 : 0.24,
        };

        theme.generatedCover = buildGeneratedCover(track, theme);
        return theme;
    }

    function shouldAnimateWholeWord(text) {
        const value = String(text || "").trim();
        if (!value) return false;
        if (/[\u4e00-\u9fff]/.test(value) && !/\s/.test(value)) return false;
        return /[A-Za-z0-9]/.test(value);
    }

    function buildCharTimings(text, start, end) {
        const value = String(text || "");
        const duration = Math.max((end || start + 0.24) - start, 0.12);

        if (shouldAnimateWholeWord(value)) {
            return [{
                text: value,
                start,
                end: start + duration,
            }];
        }

        const characters = Array.from(value);
        const charDuration = duration / Math.max(characters.length, 1);

        return characters.map((char, index) => ({
            text: char,
            start: start + charDuration * index,
            end: start + charDuration * (index + 1),
        }));
    }

    function estimateWordUnits(text) {
        const value = String(text || "").trim();
        if (!value) return 0;
        if (shouldAnimateWholeWord(value)) {
            return Math.max(1.8, value.length * 0.48);
        }
        return Array.from(value).length;
    }

    function splitTimedWordsIntoRows(words, maxUnits, hasLatinWords) {
        const latinMode = typeof hasLatinWords === "boolean"
            ? hasLatinWords
            : words.some((word) => shouldAnimateWholeWord(word.text));
        const viewportWidth = typeof window !== "undefined" ? window.innerWidth : 1440;
        const rowLimit = maxUnits ?? (
            latinMode
                ? (viewportWidth >= 1700 ? 40 : viewportWidth >= 1400 ? 34 : viewportWidth >= 1200 ? 28 : viewportWidth >= 900 ? 22 : 18)
                : (viewportWidth >= 1500 ? 14 : viewportWidth >= 1200 ? 12 : viewportWidth >= 900 ? 11 : 9)
        );
        const rows = [];
        let currentRow = [];
        let currentUnits = 0;

        words.forEach((word) => {
            const size = estimateWordUnits(word.text);
            const gapUnits = currentRow.length ? (latinMode ? 0.45 : 0.4) : 0;
            const nextUnits = currentRow.length ? currentUnits + gapUnits + size : size;

            if (currentRow.length && nextUnits > rowLimit) {
                rows.push(currentRow);
                currentRow = [];
                currentUnits = 0;
            }

            currentRow.push(word);
            currentUnits += size + (currentRow.length > 1 ? gapUnits : 0);
        });

        if (currentRow.length) rows.push(currentRow);
        return rows.length ? rows : [[]];
    }

    function chooseResponsiveRows(words) {
        const viewportWidth = typeof window !== "undefined" ? window.innerWidth : 1440;
        const hasLatinWords = words.some((word) => shouldAnimateWholeWord(word.text));

        if (!hasLatinWords) {
            return splitTimedWordsIntoRows(words, null, false);
        }

        const candidateLimits = viewportWidth >= 1700
            ? [54, 46, 40, 34]
            : viewportWidth >= 1400
                ? [46, 40, 34, 28]
                : viewportWidth >= 1200
                    ? [40, 34, 28, 24]
                    : viewportWidth >= 900
                        ? [34, 28, 24, 20]
                        : [28, 24, 20, 16];
        const preferredRows = viewportWidth >= 1400 ? 3 : viewportWidth >= 900 ? 4 : 5;

        let bestRows = null;
        let bestScore = Number.POSITIVE_INFINITY;

        candidateLimits.forEach((limit) => {
            const rows = splitTimedWordsIntoRows(words, limit, true);
            const rowUnits = rows.map((row) =>
                row.reduce((sum, word, index) => sum + estimateWordUnits(word.text) + (index > 0 ? 0.45 : 0), 0),
            );
            const maxUnits = Math.max(...rowUnits, 0);
            const minUnits = Math.min(...rowUnits, maxUnits);
            const balancePenalty = maxUnits > 0 ? (maxUnits - minUnits) / maxUnits : 0;
            const score = Math.abs(rows.length - preferredRows) + balancePenalty * 0.35;

            if (score < bestScore) {
                bestScore = score;
                bestRows = rows;
            }
        });

        return bestRows || splitTimedWordsIntoRows(words, null, true);
    }

    function buildRowsForTarget(words, targetRows) {
        if (!words.length) return [[]];
        if (targetRows <= 1) return [words.slice()];

        const latinMode = words.some((word) => shouldAnimateWholeWord(word.text));
        const gapUnits = latinMode ? 0.45 : 0.4;
        const totalUnits = words.reduce((sum, word, index) => sum + estimateWordUnits(word.text) + (index > 0 ? gapUnits : 0), 0);
        const targetUnits = totalUnits / targetRows;
        const rows = [];
        let currentRow = [];
        let currentUnits = 0;

        words.forEach((word, index) => {
            const size = estimateWordUnits(word.text);
            const nextUnits = currentRow.length ? currentUnits + gapUnits + size : size;
            const remainingWords = words.length - index;
            const remainingRows = targetRows - rows.length;
            const shouldBreak = currentRow.length
                && rows.length < targetRows - 1
                && nextUnits > targetUnits
                && remainingWords >= remainingRows;

            if (shouldBreak) {
                rows.push(currentRow);
                currentRow = [];
                currentUnits = 0;
            }

            currentRow.push(word);
            currentUnits += size + (currentRow.length > 1 ? gapUnits : 0);
        });

        if (currentRow.length) rows.push(currentRow);
        return rows.filter((row) => row.length);
    }

    function generateRowPartitions(words, targetRows, limit = 48) {
        if (!words.length) return [[]];
        if (targetRows <= 1) return [[words.slice()]];

        const partitions = [];
        const maxStart = words.length - targetRows + 1;

        function walk(startIndex, rowsLeft, currentRows) {
            if (partitions.length >= limit) return;

            if (rowsLeft === 1) {
                currentRows.push(words.slice(startIndex));
                partitions.push(currentRows.map((row) => row.slice()));
                currentRows.pop();
                return;
            }

            const maxEnd = words.length - rowsLeft + 1;
            for (let end = startIndex + 1; end <= maxEnd; end += 1) {
                currentRows.push(words.slice(startIndex, end));
                walk(end, rowsLeft - 1, currentRows);
                currentRows.pop();
                if (partitions.length >= limit) return;
            }
        }

        if (maxStart > 0) {
            walk(0, targetRows, []);
        }

        return partitions.length ? partitions : [[words.slice()]];
    }

    function prepareTimedLine(line, lineIndex) {
        const words = (line.words || []).map((word) => {
            const safeStart = Number(word.start || 0);
            const safeEnd = Number(word.end || safeStart + 0.32);

            return {
                text: String(word.text || "").trim(),
                start: safeStart,
                end: Math.max(safeEnd, safeStart + 0.08),
                lineIndex,
                charTimings: buildCharTimings(word.text, safeStart, safeEnd),
            };
        }).filter((word) => word.text);

        if (!words.length) return null;

        const rows = chooseResponsiveRows(words);
        return {
            ...line,
            index: lineIndex,
            start: Number(line.start ?? words[0].start),
            end: Number(line.end ?? words[words.length - 1].end),
            timedWords: words,
            rows,
        };
    }

    function buildPreparedTrack(track) {
        const preparedTrack = cloneTrack(track);
        if (!Array.isArray(preparedTrack.lines)) {
            preparedTrack.lines = [];
        }

        if (preparedTrack.lines.some((line) => Array.isArray(line.words))) {
            preparedTrack.lines = preparedTrack.lines
                .map((line, lineIndex) => prepareTimedLine(line, lineIndex))
                .filter(Boolean);

            preparedTrack.durationSeconds = preparedTrack.durationSeconds
                || preparedTrack.lines[preparedTrack.lines.length - 1]?.end
                || 0;
            return preparedTrack;
        }

        let accumulated = 0;

        preparedTrack.lines = preparedTrack.lines.map((line, lineIndex) => {
            let wordIndex = 0;
            const rows = line.rows.map((row) =>
                row.map((word) => {
                    const duration = line.durations[wordIndex] ?? 0.4;
                    const item = {
                        text: word,
                        start: accumulated,
                        end: accumulated + duration,
                        lineIndex,
                        charTimings: buildCharTimings(word, accumulated, accumulated + duration),
                    };

                    accumulated += duration;
                    wordIndex += 1;
                    return item;
                }),
            );

            return {
                ...line,
                index: lineIndex,
                start: rows[0][0].start,
                end: rows[rows.length - 1][rows[rows.length - 1].length - 1].end,
                rows,
            };
        });

        preparedTrack.durationSeconds = preparedTrack.lines[preparedTrack.lines.length - 1].end;
        return preparedTrack;
    }

    function resolveCatalogTrack(catalog, candidates, fallbackKey) {
        const keys = Object.keys(catalog);
        const normalizedCandidates = candidates.map(normalizeTitle).filter(Boolean);

        for (const candidate of normalizedCandidates) {
            const direct = keys.find((key) => normalizeTitle(key) === candidate);
            if (direct) return buildPreparedTrack(catalog[direct]);

            const titleMatch = keys.find((key) => normalizeTitle(catalog[key].title) === candidate);
            if (titleMatch) return buildPreparedTrack(catalog[titleMatch]);
        }

        return buildPreparedTrack(catalog[fallbackKey] || catalog[keys[0]]);
    }

    function buildEmptyTrack(track = null, playback = null) {
        return {
            key: track?.id || track?.key || null,
            id: track?.id || track?.key || null,
            title: track?.title || "",
            artist: track?.artist || "",
            coverUrl: track?.coverUrl || null,
            lines: [],
            durationSeconds: playback?.durationSeconds || 0,
        };
    }

    class EmptyLyricsProvider {
        constructor() {
            this.statusOverride = null;
        }

        setStatusOverride(status) {
            this.statusOverride = status || null;
        }

        async connect() {
            return this.statusOverride || {
                source: "empty",
                badge: "LYRIC STAGE",
                hint: "Play a song in ncm-cli and the stage will sync here.",
            };
        }

        async getSnapshot() {
            const status = this.statusOverride || {};
            return {
                source: status.source || "empty",
                badge: status.badge || "LYRIC STAGE",
                hint: status.hint || "Play a song in ncm-cli and the stage will sync here.",
                playback: {
                    isPlaying: false,
                    positionSeconds: 0,
                    durationSeconds: 0,
                },
                track: buildEmptyTrack(),
                emptyState: {
                    title: status.emptyTitle || "等待歌词接入",
                    hint: status.emptyHint || status.hint || "播放一首歌后，这里会自动进入歌词舞台。",
                },
            };
        }

        async togglePlay() {
            return this.getSnapshot();
        }

        async next() {
            return this.getSnapshot();
        }

        async prev() {
            return this.getSnapshot();
        }
    }

    class MockLyricsProvider {
        constructor({ catalog, trackKey }) {
            this.catalog = catalog;
            this.trackKey = trackKey;
            this.track = resolveCatalogTrack(catalog, [trackKey], trackKey);
            this.isPlaying = true;
            this.statusOverride = null;
            this.positionSeconds = 0;
            this.lastTickAt = Date.now();
        }

        setStatusOverride(status) {
            this.statusOverride = status || null;
        }

        syncClock() {
            const now = Date.now();
            if (this.isPlaying && this.track) {
                this.positionSeconds += (now - this.lastTickAt) / 1000;
                if (this.positionSeconds >= this.track.durationSeconds) {
                    this.positionSeconds = 0;
                }
            }
            this.lastTickAt = now;
        }

        async connect() {
            this.lastTickAt = Date.now();
            return this.statusOverride || {
                source: "mock",
                badge: "MOCK DATA",
                hint: "Using local demo lyrics. Start the bridge later to proxy ncm-cli.",
            };
        }

        async getSnapshot() {
            this.syncClock();
            const status = this.statusOverride || {};
            return {
                source: status.source || "mock",
                ...(this.statusOverride || {
                    badge: "MOCK DATA",
                    hint: "Using local demo lyrics. Start the bridge later to proxy ncm-cli.",
                }),
                playback: {
                    isPlaying: this.isPlaying,
                    positionSeconds: this.positionSeconds,
                    durationSeconds: this.track.durationSeconds,
                },
                track: this.track,
            };
        }

        async togglePlay() {
            this.syncClock();
            this.isPlaying = !this.isPlaying;
            return this.getSnapshot();
        }

        async next() {
            this.syncClock();
            const keys = Object.keys(this.catalog);
            const currentIndex = keys.indexOf(this.track.key);
            const nextKey = keys[(currentIndex + 1 + keys.length) % keys.length];
            this.track = resolveCatalogTrack(this.catalog, [nextKey], nextKey);
            this.positionSeconds = 0;
            return this.getSnapshot();
        }

        async prev() {
            this.syncClock();
            const keys = Object.keys(this.catalog);
            const currentIndex = keys.indexOf(this.track.key);
            const prevKey = keys[(currentIndex - 1 + keys.length) % keys.length];
            this.track = resolveCatalogTrack(this.catalog, [prevKey], prevKey);
            this.positionSeconds = 0;
            return this.getSnapshot();
        }
    }

    class HttpNcmBridgeProvider {
        constructor({ baseUrl, fallbackProvider, lyricSongIdOverride = null }) {
            this.baseUrl = baseUrl.replace(/\/$/, "");
            this.fallbackProvider = fallbackProvider;
            this.lyricSongIdOverride = lyricSongIdOverride;
            this.mode = "bridge";
            this.statusFallback = null;
        }

        async fetchJson(path, options) {
            const target = new URL(path, `${this.baseUrl}/`);
            if (this.lyricSongIdOverride && path.startsWith("/api/")) {
                target.searchParams.set("songId", this.lyricSongIdOverride);
            }

            const response = await fetch(target, {
                headers: { "Content-Type": "application/json" },
                ...options,
            });

            if (!response.ok) {
                throw new Error(`Bridge request failed: ${response.status}`);
            }

            return response.json();
        }

        async connect() {
            try {
                const status = await this.fetchJson("/api/status");
                if (!status.ok || !status.cli.available || !status.cli.configured) {
                    this.mode = "fallback";
                    this.statusFallback = {
                        source: status.source || "mock",
                        badge: status.cli?.available ? "DEMO / NCM CLI SETUP" : "DEMO / BRIDGE READY",
                        hint: status.hint || "Bridge is reachable, but ncm-cli still needs setup before real playback can sync. Showing built-in demo lyrics for now.",
                    };
                    this.fallbackProvider.setStatusOverride(this.statusFallback);
                    return this.fallbackProvider.connect();
                }

                return {
                    source: "bridge",
                    badge: "NCM CLI",
                    hint: status.hasLyrics
                        ? "Connected through local bridge. The stage is ready to render real lyrics."
                        : "Connected through local bridge. Waiting for a real lyric file for the current song.",
                };
            } catch (error) {
                this.mode = "fallback";
                this.fallbackProvider.setStatusOverride({
                    source: "mock",
                    badge: "DEMO / BRIDGE OFFLINE",
                    hint: "Bridge is not running yet. Showing built-in demo lyrics.",
                });
                return this.fallbackProvider.connect();
            }
        }

        async getSnapshot() {
            if (this.mode === "fallback") {
                return this.fallbackProvider.getSnapshot();
            }

            try {
                const snapshot = await this.fetchJson("/api/snapshot");
                const hasLyrics = Boolean(snapshot.lyrics);
                const track = hasLyrics
                    ? buildPreparedTrack(snapshot.lyrics)
                    : buildEmptyTrack(snapshot.track, snapshot.playback);

                track.key = snapshot.track?.id || track.key;
                track.id = snapshot.track?.id || track.id;
                track.title = snapshot.track?.title || track.title;
                track.artist = snapshot.track?.artist || track.artist;
                track.coverUrl = snapshot.track?.coverUrl || track.coverUrl;

                return {
                    source: "bridge",
                    badge: snapshot.usedFallback
                        ? "NCM CLI / WAITING LYRICS"
                        : snapshot.lyrics?.timingMode === "yrc" || snapshot.lyrics?.timingMode === "klyric"
                            ? "NCM CLI / WORD TIMED"
                            : "NCM CLI / REAL LYRICS",
                    hint: snapshot.usedFallback
                        ? "Bridge found playback state, but the current track has no lyric cache yet."
                        : snapshot.lyrics?.timingMode === "lrc-estimated"
                            ? "Real lyrics loaded. Word motion is estimated from line timing."
                            : "Real lyrics loaded. Word timing is coming from the cached NetEase lyric data.",
                    playback: {
                        isPlaying: snapshot.playback?.isPlaying ?? true,
                        positionSeconds: snapshot.playback?.positionSeconds ?? 0,
                        durationSeconds: snapshot.playback?.durationSeconds || track.durationSeconds,
                    },
                    track,
                    emptyState: hasLyrics
                        ? null
                        : {
                            title: snapshot.track?.title ? "当前歌曲暂无可用歌词" : "等待歌词接入",
                            hint: snapshot.track?.title
                                ? "已经连上播放状态，但这首歌的歌词暂时还没解析出来。"
                                : "播放一首歌后，这里会自动进入歌词舞台。",
                        },
                };
            } catch (error) {
                this.mode = "fallback";
                this.statusFallback = {
                    source: "mock",
                    badge: "DEMO / BRIDGE OFFLINE",
                    hint: "Bridge is not running yet. Showing built-in demo lyrics.",
                };
                this.fallbackProvider.setStatusOverride(this.statusFallback);
                return this.fallbackProvider.getSnapshot();
            }
        }

        async sendControl(path, fallbackMethod) {
            if (this.mode === "fallback") {
                return this.fallbackProvider[fallbackMethod]();
            }

            try {
                await this.fetchJson(path, { method: "POST", body: "{}" });
                return this.getSnapshot();
            } catch (error) {
                this.mode = "empty";
                return this.fallbackProvider[fallbackMethod]();
            }
        }

        async togglePlay() {
            return this.sendControl("/api/control/toggle", "togglePlay");
        }

        async next() {
            return this.sendControl("/api/control/next", "next");
        }

        async prev() {
            return this.sendControl("/api/control/prev", "prev");
        }
    }

    class PreviewSongProvider {
        constructor({ baseUrl, songId, fallbackProvider, initialPositionSeconds = 0 }) {
            this.baseUrl = baseUrl.replace(/\/$/, "");
            this.songId = songId;
            this.fallbackProvider = fallbackProvider;
            this.track = null;
            this.mode = "preview";
            this.isPlaying = true;
            this.positionSeconds = Math.max(0, Number(initialPositionSeconds) || 0);
            this.lastTickAt = Date.now();
            this.timingMode = "none";
        }

        async fetchTrack() {
            if (this.track) return this.track;

            const target = new URL("/api/lyrics/song", `${this.baseUrl}/`);
            target.searchParams.set("id", this.songId);
            const response = await fetch(target);
            if (!response.ok) {
                throw new Error(`Preview lyrics request failed: ${response.status}`);
            }

            const payload = await response.json();
            this.timingMode = payload.lyrics?.timingMode || "none";
            this.track = buildPreparedTrack(payload.lyrics);
            this.track.key = payload.lyrics?.key || this.track.key;
            this.track.title = payload.lyrics?.title || this.track.title;
            this.track.artist = payload.lyrics?.artist || this.track.artist;
            if (this.track.durationSeconds > 0) {
                this.positionSeconds = Math.min(this.positionSeconds, Math.max(0, this.track.durationSeconds - 0.01));
            }
            return this.track;
        }

        syncClock() {
            const now = Date.now();
            if (this.isPlaying && this.track) {
                this.positionSeconds += (now - this.lastTickAt) / 1000;
                if (this.positionSeconds >= this.track.durationSeconds) {
                    this.positionSeconds = 0;
                }
            }
            this.lastTickAt = now;
        }

        async connect() {
            try {
                await this.fetchTrack();
                return {
                    source: "preview",
                    badge: this.timingMode === "yrc" || this.timingMode === "klyric" ? "LYRIC PREVIEW / WORD TIMED" : "LYRIC PREVIEW",
                    hint: `Previewing cached lyrics for song ${this.songId}.`,
                };
            } catch (error) {
                this.mode = "empty";
                return this.fallbackProvider.connect();
            }
        }

        async getSnapshot() {
            if (this.mode === "empty") {
                return this.fallbackProvider.getSnapshot();
            }

            try {
                const track = await this.fetchTrack();
                this.syncClock();
                return {
                    source: "preview",
                    badge: this.timingMode === "yrc" || this.timingMode === "klyric" ? "LYRIC PREVIEW / WORD TIMED" : "LYRIC PREVIEW",
                    hint: this.timingMode === "lrc-estimated"
                        ? "Previewing real cached lyrics with estimated word motion."
                        : "Previewing real cached lyrics with available word timing.",
                    playback: {
                        isPlaying: this.isPlaying,
                        positionSeconds: this.positionSeconds,
                        durationSeconds: track.durationSeconds,
                    },
                    track,
                };
            } catch (error) {
                this.mode = "empty";
                return this.fallbackProvider.getSnapshot();
            }
        }

        async togglePlay() {
            this.syncClock();
            this.isPlaying = !this.isPlaying;
            return this.getSnapshot();
        }

        async next() {
            this.positionSeconds = 0;
            return this.getSnapshot();
        }

        async prev() {
            this.positionSeconds = 0;
            return this.getSnapshot();
        }
    }

    class LyricsStageApp {
        constructor(elements, provider) {
            this.elements = elements;
            this.provider = provider;
            this.state = {
                playback: { isPlaying: true, positionSeconds: 0, durationSeconds: 0 },
                track: null,
                emptyState: null,
            };
            this.activeIndex = -1;
            this.activeCharElements = [];
            this.glowCharElements = [];
            this.activePlacement = null;
            this.currentLayout = { scale: 1, shiftX: 0, shiftY: 0 };
            this.currentTrackVisual = buildTrackVisualTheme({ title: "Lyric Stage", artist: "Star Office Radio" });
            this.lastFrame = performance.now();
            this.displayMode = this.readStoredDisplayMode();
            this.isModeSwitchOpen = false;
            this.defaultDocumentTitle = document.title || "Lyric Stage Demo";
            this.titleTickerHandle = null;
            this.titleTickerSource = "";
            this.titleTickerFrame = 0;
        }

        async start() {
            this.bindEvents();
            const connection = await this.provider.connect();
            this.updateProviderStatus(connection.badge, connection.hint);
            await this.refreshSnapshot();
            this.showTimingDisclaimerIfNeeded();
            this.setDisplayMode(this.displayMode, { persist: false, rerender: false });
            requestAnimationFrame((now) => {
                this.lastFrame = now;
                requestAnimationFrame(this.tick.bind(this));
            });
            this.pollHandle = setInterval(() => {
                this.refreshSnapshot();
            }, 2500);
            window.addEventListener("resize", () => {
                this.activeIndex = -1;
                this.render(this.state.playback.positionSeconds);
            });
        }

        bindEvents() {
            this.elements.modeSwitchToggle?.addEventListener("click", (event) => {
                event.stopPropagation();
                this.setModeSwitchOpen(!this.isModeSwitchOpen);
            });

            this.elements.modeSwitch?.addEventListener("click", (event) => {
                event.stopPropagation();
            });

            this.elements.modeButtons?.forEach((button) => {
                button.addEventListener("click", () => {
                    const nextMode = button.dataset.displayMode === "line" ? "line" : "word";
                    this.setDisplayMode(nextMode);
                    this.setModeSwitchOpen(false);
                });
            });

            this.elements.disclaimerButtons?.forEach((button) => {
                button.addEventListener("click", () => {
                    const action = button.dataset.disclaimerAction;
                    if (action === "switch-line") {
                        this.setDisplayMode("line");
                    }
                    this.dismissTimingDisclaimer();
                });
            });

            document.addEventListener("click", () => {
                if (this.isModeSwitchOpen) {
                    this.setModeSwitchOpen(false);
                }
            });
        }

        updateProviderStatus(badge, hint) {
            if (this.elements.providerBadge) this.elements.providerBadge.textContent = badge;
            if (this.elements.providerHint) this.elements.providerHint.textContent = hint;
        }

        readStoredDisplayMode() {
            try {
                const stored = window.localStorage.getItem("lyrics-stage-display-mode");
                return stored === "line" ? "line" : "word";
            } catch (error) {
                return "word";
            }
        }

        setDisplayMode(mode, { persist = true, rerender = true } = {}) {
            this.displayMode = mode === "line" ? "line" : "word";
            this.elements.stage.classList.toggle("is-line-mode", this.displayMode === "line");
            this.elements.modeButtons?.forEach((button) => {
                button.classList.toggle("is-active", button.dataset.displayMode === this.displayMode);
            });

            if (persist) {
                try {
                    window.localStorage.setItem("lyrics-stage-display-mode", this.displayMode);
                } catch (error) {
                    // Ignore storage failures and keep the session-only mode.
                }
            }

            if (rerender) {
                this.activeIndex = -1;
                this.render(this.state.playback.positionSeconds);
            }
        }

        setModeSwitchOpen(isOpen) {
            this.isModeSwitchOpen = Boolean(isOpen);
            if (this.elements.modeSwitchShell) {
                this.elements.modeSwitchShell.classList.toggle("is-open", this.isModeSwitchOpen);
            }
            if (this.elements.modeSwitchToggle) {
                this.elements.modeSwitchToggle.setAttribute("aria-expanded", this.isModeSwitchOpen ? "true" : "false");
            }
            if (this.elements.modeSwitch) {
                this.elements.modeSwitch.hidden = !this.isModeSwitchOpen;
            }
        }

        showTimingDisclaimerIfNeeded() {
            if (!this.elements.timingDisclaimer) return;
            try {
                const dismissed = window.localStorage.getItem("lyrics-stage-timing-disclaimer-dismissed");
                this.elements.timingDisclaimer.hidden = dismissed === "1";
            } catch (error) {
                this.elements.timingDisclaimer.hidden = false;
            }
        }

        dismissTimingDisclaimer() {
            if (!this.elements.timingDisclaimer) return;
            this.elements.timingDisclaimer.hidden = true;
            try {
                window.localStorage.setItem("lyrics-stage-timing-disclaimer-dismissed", "1");
            } catch (error) {
                // Ignore storage failures and simply hide it for this session.
            }
        }

        updatePlaybackMode(isPlaying) {
            this.elements.stage.classList.toggle("is-playing", Boolean(isPlaying));
            this.elements.stage.classList.toggle("is-paused", !isPlaying);
        }

        updateEmptyState(snapshot) {
            const hasRenderableLyrics = Boolean(snapshot?.track?.lines?.length);
            const emptyState = snapshot?.emptyState || {
                title: "等待歌词接入",
                hint: "播放一首歌后，这里会自动进入歌词舞台。",
            };

            this.elements.stage.classList.toggle("is-empty", !hasRenderableLyrics);

            if (this.elements.emptyState) {
                this.elements.emptyState.hidden = hasRenderableLyrics;
            }
            if (this.elements.emptyTitle) {
                this.elements.emptyTitle.textContent = emptyState.title || "等待歌词接入";
            }
            if (this.elements.emptyHint) {
                this.elements.emptyHint.textContent = emptyState.hint || "播放一首歌后，这里会自动进入歌词舞台。";
            }

            if (!hasRenderableLyrics) {
                this.stopTitleTicker();
            }
        }

        async refreshSnapshot() {
            const snapshot = await this.provider.getSnapshot();
            this.state = snapshot;

            this.updateProviderStatus(snapshot.badge, snapshot.hint);
            this.updatePlaybackMode(snapshot.playback.isPlaying);
            this.updateEmptyState(snapshot);

            const nextTrackKey = snapshot.track?.key || snapshot.track?.id || snapshot.track?.title || "__empty";
            if (this.currentTrackKey !== nextTrackKey) {
                this.currentTrackKey = nextTrackKey;
                this.activeIndex = -1;
                this.applyTrackVisual(snapshot.track);
            }

            this.render(this.state.playback.positionSeconds);
        }

        formatTime(seconds) {
            const safe = Math.max(0, Math.floor(seconds || 0));
            const minutes = Math.floor(safe / 60);
            const secs = String(safe % 60).padStart(2, "0");
            return `${minutes}:${secs}`;
        }

        getLineIndex(time) {
            const track = this.state.track;
            if (!track?.lines?.length) return -1;
            const duration = track.durationSeconds || 0;
            const clamped = Math.min(Math.max(time, 0), duration - 0.0001);
            return track.lines.findIndex((line) => clamped >= line.start && clamped < line.end);
        }

        getLineProgress(time, line) {
            if (time <= line.start) return 0;
            if (time >= line.end) return 1;
            return (time - line.start) / (line.end - line.start);
        }

        resolveTickerText(time) {
            const track = this.state.track;
            if (!track?.lines?.length) {
                return track?.title || "";
            }

            const activeIndex = this.getLineIndex(time);
            if (activeIndex >= 0) {
                return this.summarizeLineText(track.lines[activeIndex]);
            }

            const previousLine = [...track.lines].reverse().find((line) => time >= line.end);
            if (previousLine) {
                return this.summarizeLineText(previousLine);
            }

            return this.summarizeLineText(track.lines[0]) || track.title || "";
        }

        resolveDisplayLine(time) {
            const track = this.state.track;
            if (!track?.lines?.length) return { index: -1, line: null };

            const activeIndex = this.getLineIndex(time);
            if (activeIndex >= 0) {
                return { index: activeIndex, line: track.lines[activeIndex] };
            }

            const previousIndex = [...track.lines].map((line, index) => ({ line, index })).reverse()
                .find((entry) => time >= entry.line.end)?.index;
            if (typeof previousIndex === "number" && previousIndex >= 0) {
                return { index: previousIndex, line: track.lines[previousIndex] };
            }

            return { index: 0, line: track.lines[0] };
        }

        buildFocusedLine(target, line, className) {
            target.innerHTML = "";
            const lineEl = document.createElement("div");
            lineEl.className = className;
            const charRefs = [];

            line.rows.forEach((row) => {
                const rowEl = document.createElement("div");
                rowEl.className = "lyric-row";

                row.forEach((word) => {
                    const wordEl = document.createElement("span");
                    wordEl.className = "lyric-word";

                    word.charTimings.forEach((charTiming) => {
                        const charEl = document.createElement("span");
                        charEl.className = "lyric-char";
                        charEl.textContent = charTiming.text;
                        wordEl.appendChild(charEl);
                        charRefs.push({ ...charTiming, element: charEl });
                    });

                    rowEl.appendChild(wordEl);
                });

                lineEl.appendChild(rowEl);
            });

            target.appendChild(lineEl);
            return charRefs;
        }

        buildMeasureLine(rows) {
            const target = this.elements.measureLine;
            if (!target) return;

            target.innerHTML = "";
            const lineEl = document.createElement("div");
            lineEl.className = "lyric-line lyric-line--measure";

            rows.forEach((row) => {
                const rowEl = document.createElement("div");
                rowEl.className = "lyric-row";

                row.forEach((word) => {
                    const wordEl = document.createElement("span");
                    wordEl.className = "lyric-word";

                    word.charTimings.forEach((charTiming) => {
                        const charEl = document.createElement("span");
                        charEl.className = "lyric-char";
                        charEl.textContent = charTiming.text;
                        wordEl.appendChild(charEl);
                    });

                    rowEl.appendChild(wordEl);
                });

                lineEl.appendChild(rowEl);
            });

            target.appendChild(lineEl);
        }

        getMetricsElement(target) {
            if (!target) return null;
            return target.firstElementChild || target;
        }

        updateTheme(line) {
            const visual = this.currentTrackVisual || buildTrackVisualTheme(this.state.track || {});
            this.elements.stage.style.setProperty("--stage-accent", line.accent || visual.accent);
            this.elements.stage.style.setProperty("--stage-accent-soft", line.accentSoft || visual.accentSoft);
            this.elements.stage.style.setProperty("--stage-accent-cold", line.accentCold || visual.accentCold);
        }

        applyTrackVisual(track) {
            const visual = buildTrackVisualTheme(track || {});
            this.currentTrackVisual = visual;

            this.elements.stage.style.setProperty("--stage-bg", visual.bg);
            this.elements.stage.style.setProperty("--stage-bg-deep", visual.bgDeep);
            this.elements.stage.style.setProperty("--stage-accent", visual.accent);
            this.elements.stage.style.setProperty("--stage-accent-soft", visual.accentSoft);
            this.elements.stage.style.setProperty("--stage-accent-cold", visual.accentCold);
            this.elements.stage.style.setProperty("--stage-haze", visual.haze);
            this.elements.stage.style.setProperty("--stage-haze-cold", visual.hazeCold);
            this.elements.stage.style.setProperty("--stage-cover-opacity", String(visual.coverOpacity));

            if (this.elements.coverImage) {
                const fallbackCover = visual.generatedCover;
                const nextCover = track?.coverUrl || fallbackCover;
                this.elements.coverImage.onerror = () => {
                    this.elements.coverImage.onerror = null;
                    this.elements.coverImage.src = fallbackCover;
                };
                this.elements.coverImage.src = nextCover;
            }
        }

        pickLinePlacement(line) {
            return {
                x: 50,
                y: 50,
                align: "center",
                justify: "center",
                rotate: 0,
                scale: 1,
                ornamentOneTop: "-10%",
                ornamentOneLeft: "4%",
                ornamentOneRotate: "-7deg",
                ornamentTwoTop: "84%",
                ornamentTwoLeft: "80%",
                ornamentTwoRotate: "10deg",
            };
        }

        applyLinePlacement(placement) {
            if (!this.elements.currentShell) return;

            this.elements.currentShell.style.left = `${placement.x}%`;
            this.elements.currentShell.style.top = `${placement.y}%`;
            this.elements.currentShell.style.setProperty("--ornament-one-top", placement.ornamentOneTop);
            this.elements.currentShell.style.setProperty("--ornament-one-left", placement.ornamentOneLeft);
            this.elements.currentShell.style.setProperty("--ornament-one-rotate", placement.ornamentOneRotate);
            this.elements.currentShell.style.setProperty("--ornament-two-top", placement.ornamentTwoTop);
            this.elements.currentShell.style.setProperty("--ornament-two-left", placement.ornamentTwoLeft);
            this.elements.currentShell.style.setProperty("--ornament-two-rotate", placement.ornamentTwoRotate);
        }

        getSafeLayoutBounds() {
            const safeTop = 132;
            const safeBottom = 132;
            const safeHorizontal = 64;

            return {
                safeTop,
                safeBottom,
                safeHorizontal,
                maxHeight: Math.max(window.innerHeight - safeTop - safeBottom, 120),
                maxWidth: Math.max(window.innerWidth - safeHorizontal * 2, 160),
            };
        }

        measureRows(rows) {
            if (!this.elements.measureLine) {
                return { width: 0, height: 0, rowWidths: [] };
            }

            this.buildMeasureLine(rows);
            const metricsElement = this.getMetricsElement(this.elements.measureLine);
            const rowWidths = metricsElement
                ? Array.from(metricsElement.querySelectorAll(".lyric-row")).map((row) => row.scrollWidth || row.offsetWidth || 0)
                : [];
            return {
                width: metricsElement?.scrollWidth || metricsElement?.offsetWidth || 0,
                height: metricsElement?.scrollHeight || metricsElement?.offsetHeight || 0,
                rowWidths,
            };
        }

        scoreBalancedProfile(rowWidths) {
            if (!rowWidths.length) return 0;
            if (rowWidths.length === 1) return 0.2;

            const maxWidth = Math.max(...rowWidths, 1);
            const normalized = rowWidths.map((width) => width / maxWidth);
            const average = normalized.reduce((sum, width) => sum + width, 0) / normalized.length;
            const variance = normalized.reduce((sum, width) => sum + ((width - average) ** 2), 0) / normalized.length;
            const spread = Math.max(...normalized) - Math.min(...normalized);
            let symmetry = 1;
            let symmetryPairs = 0;
            for (let index = 0; index < Math.floor(normalized.length / 2); index += 1) {
                const mirroredIndex = normalized.length - 1 - index;
                symmetry -= Math.abs(normalized[index] - normalized[mirroredIndex]) * 0.5;
                symmetryPairs += 1;
            }
            if (symmetryPairs > 0) {
                symmetry = Math.max(0, symmetry);
            }

            return (1 - Math.min(1, variance * 4.2)) * 0.5 + (1 - spread) * 0.35 + symmetry * 0.15;
        }

        getLayoutThresholds() {
            return {
                maxOverflowPx: 0,
                minScaleWarn: 0.78,
                minScaleFail: 0.64,
                minWidthUseWarn: 0.34,
                minWidthUseFail: 0.24,
                maxHeightUseWarn: 0.86,
                maxHeightUseFail: 0.94,
                minBalanceWarn: 0.62,
                minBalanceFail: 0.48,
                maxCenterOffsetWarn: 20,
                maxCenterOffsetFail: 40,
            };
        }

        summarizeLineText(line) {
            if (Array.isArray(line?.timedWords) && line.timedWords.length) {
                return line.timedWords.map((word) => word.text).join(" ");
            }

            return (line?.rows || [])
                .flat()
                .map((word) => typeof word === "string" ? word : word?.text)
                .filter(Boolean)
                .join(" ");
        }

        evaluateMeasuredLayout({ width, height, rowWidths, scale, bounds, centerOffsetX = 0, centerOffsetY = 0, source = "measured" }) {
            const thresholds = this.getLayoutThresholds();
            const widthUse = bounds.maxWidth > 0 ? Math.min(width * scale, bounds.maxWidth) / bounds.maxWidth : 0;
            const heightUse = bounds.maxHeight > 0 ? Math.min(height * scale, bounds.maxHeight) / bounds.maxHeight : 0;
            const balance = this.scoreBalancedProfile(rowWidths || []);
            const overflowX = Math.max(0, (width * scale) - bounds.maxWidth);
            const overflowY = Math.max(0, (height * scale) - bounds.maxHeight);
            const centerOffset = Math.hypot(centerOffsetX, centerOffsetY);

            const issues = [];

            if (overflowX > thresholds.maxOverflowPx || overflowY > thresholds.maxOverflowPx) {
                issues.push("overflow");
            }
            if (scale < thresholds.minScaleFail) {
                issues.push("scale-fail");
            } else if (scale < thresholds.minScaleWarn) {
                issues.push("scale-warn");
            }
            if (widthUse < thresholds.minWidthUseFail) {
                issues.push("width-use-fail");
            } else if (widthUse < thresholds.minWidthUseWarn) {
                issues.push("width-use-warn");
            }
            if (heightUse > thresholds.maxHeightUseFail) {
                issues.push("height-use-fail");
            } else if (heightUse > thresholds.maxHeightUseWarn) {
                issues.push("height-use-warn");
            }
            if (balance < thresholds.minBalanceFail) {
                issues.push("balance-fail");
            } else if (balance < thresholds.minBalanceWarn) {
                issues.push("balance-warn");
            }
            if (centerOffset > thresholds.maxCenterOffsetFail) {
                issues.push("center-offset-fail");
            } else if (centerOffset > thresholds.maxCenterOffsetWarn) {
                issues.push("center-offset-warn");
            }

            const status = issues.some((issue) => issue.endsWith("-fail") || issue === "overflow")
                ? "fail"
                : issues.length
                    ? "warn"
                    : "pass";

            return {
                source,
                status,
                issues,
                scale: Number(scale.toFixed(3)),
                widthUse: Number(widthUse.toFixed(3)),
                heightUse: Number(heightUse.toFixed(3)),
                balance: Number(balance.toFixed(3)),
                overflowX: Number(overflowX.toFixed(2)),
                overflowY: Number(overflowY.toFixed(2)),
                centerOffsetX: Number(centerOffsetX.toFixed(2)),
                centerOffsetY: Number(centerOffsetY.toFixed(2)),
                centerOffset: Number(centerOffset.toFixed(2)),
                width: Number(width.toFixed(2)),
                height: Number(height.toFixed(2)),
                rowWidths: (rowWidths || []).map((value) => Number(value.toFixed(2))),
            };
        }

        chooseMeasuredRows(line) {
            const words = Array.isArray(line.timedWords) && line.timedWords.length
                ? line.timedWords
                : (line.rows || []).flat();
            if (!words.length) return line.rows || [[]];

            const hasLatinWords = words.some((word) => shouldAnimateWholeWord(word.text));
            if (!hasLatinWords) {
                return chooseResponsiveRows(words);
            }

            const bounds = this.getSafeLayoutBounds();
            const candidates = [];
            const fallbackRows = chooseResponsiveRows(words);
            const fallbackSignature = fallbackRows.map((row) => row.map((word) => word.text).join(" ")).join("|");
            candidates.push({ rows: fallbackRows, signature: fallbackSignature });

            const maxRows = Math.min(5, Math.max(2, Math.ceil(words.length / 2)));
            for (let targetRows = 1; targetRows <= maxRows; targetRows += 1) {
                const rowSets = words.length <= 12
                    ? generateRowPartitions(words, targetRows, 80)
                    : [buildRowsForTarget(words, targetRows)];

                rowSets.forEach((rows) => {
                    const signature = rows.map((row) => row.map((word) => word.text).join(" ")).join("|");
                    if (!candidates.some((candidate) => candidate.signature === signature)) {
                        candidates.push({ rows, signature });
                    }
                });
            }

            let bestRows = fallbackRows;
            let bestScore = Number.NEGATIVE_INFINITY;

            candidates.forEach(({ rows }) => {
                const measured = this.measureRows(rows);
                if (!measured.width || !measured.height) return;

                const fitScale = Math.min(1, bounds.maxWidth / measured.width, bounds.maxHeight / measured.height);
                const widthUse = Math.min(measured.width * fitScale, bounds.maxWidth) / bounds.maxWidth;
                const heightUse = Math.min(measured.height * fitScale, bounds.maxHeight) / bounds.maxHeight;
                const balancedProfile = this.scoreBalancedProfile(measured.rowWidths);
                const rowPenalty = rows.length > 1 ? (rows.length - 1) * 0.18 : 0;
                const narrowPenalty = widthUse < 0.58 ? (0.58 - widthUse) * 2.6 : 0;
                const crowdPenalty = heightUse > 0.92 ? (heightUse - 0.92) * 4.2 : 0;
                const score = (fitScale * 7.4) + (widthUse * 2.2) + (balancedProfile * 2.7) - (heightUse * 0.34) - rowPenalty - narrowPenalty - crowdPenalty;

                if (score > bestScore) {
                    bestScore = score;
                    bestRows = rows;
                }
            });

            return bestRows;
        }

        computeViewportLayout() {
            if (!this.elements.currentLine || !this.elements.currentShell) {
                return { scale: 1, shiftX: 0, shiftY: 0 };
            }

            const bounds = this.getSafeLayoutBounds();
            const metricsElement = this.getMetricsElement(this.elements.currentLine);
            const width = metricsElement?.scrollWidth || metricsElement?.offsetWidth || 0;
            const height = metricsElement?.scrollHeight || metricsElement?.offsetHeight || 0;
            if (!width || !height) {
                return { scale: 1, shiftX: 0, shiftY: 0 };
            }

            const scale = Math.min(1, bounds.maxWidth / width, bounds.maxHeight / height) * 0.98;
            this.elements.currentShell.style.transform = `translate(-50%, -50%) scale(${scale})`;

            const rect = metricsElement.getBoundingClientRect();
            const visualInset = 18;
            const safeLeft = bounds.safeHorizontal + visualInset;
            const safeRight = window.innerWidth - bounds.safeHorizontal - visualInset;
            const safeTop = bounds.safeTop + visualInset;
            const safeBottom = window.innerHeight - bounds.safeBottom - visualInset;
            const viewportCenterX = window.innerWidth / 2;
            const viewportCenterY = window.innerHeight / 2;
            let shiftX = viewportCenterX - (rect.left + rect.width / 2);
            let shiftY = viewportCenterY - (rect.top + rect.height / 2);

            const shiftedLeft = rect.left + shiftX;
            const shiftedRight = rect.right + shiftX;
            const shiftedTop = rect.top + shiftY;
            const shiftedBottom = rect.bottom + shiftY;

            if (shiftedLeft < safeLeft) {
                shiftX += safeLeft - shiftedLeft;
            }
            if (shiftedRight > safeRight) {
                shiftX -= shiftedRight - safeRight;
            }
            if (shiftedTop < safeTop) {
                shiftY += safeTop - shiftedTop;
            }
            if (shiftedBottom > safeBottom) {
                shiftY -= shiftedBottom - safeBottom;
            }

            return { scale, shiftX, shiftY };
        }

        applyViewportLayout(layout) {
            if (!this.elements.currentShell) return;
            this.elements.currentShell.style.transform = `translate(calc(-50% + ${layout.shiftX}px), calc(-50% + ${layout.shiftY}px)) scale(${layout.scale})`;
        }

        auditCurrentLayout() {
            if (!this.state.track || this.activeIndex < 0) return null;

            const line = this.state.track.lines[this.activeIndex];
            const metricsElement = this.getMetricsElement(this.elements.currentLine);
            if (!metricsElement) return null;

            const bounds = this.getSafeLayoutBounds();
            const rect = metricsElement.getBoundingClientRect();
            const centerOffsetX = (rect.left + rect.width / 2) - (window.innerWidth / 2);
            const centerOffsetY = (rect.top + rect.height / 2) - (window.innerHeight / 2);
            const rowWidths = Array.from(metricsElement.querySelectorAll(".lyric-row"))
                .map((row) => row.scrollWidth || row.offsetWidth || 0);
            const metrics = this.evaluateMeasuredLayout({
                width: rect.width / Math.max(this.currentLayout?.scale || 1, 0.001),
                height: rect.height / Math.max(this.currentLayout?.scale || 1, 0.001),
                rowWidths: rowWidths.map((value) => value / Math.max(this.currentLayout?.scale || 1, 0.001)),
                scale: this.currentLayout?.scale || 1,
                bounds,
                centerOffsetX,
                centerOffsetY,
                source: "live",
            });

            return {
                lineIndex: this.activeIndex,
                text: this.summarizeLineText(line),
                rows: line.rows?.map((row) => row.map((word) => word.text)),
                ...metrics,
            };
        }

        auditTrackLayout() {
            if (!this.state.track?.lines?.length) return null;

            const bounds = this.getSafeLayoutBounds();
            const lines = this.state.track.lines.map((line, index) => {
                const rows = Array.isArray(line.timedWords) && line.timedWords.length
                    ? this.chooseMeasuredRows(line)
                    : (line.rows || [[]]);
                const measured = this.measureRows(rows);
                const scale = measured.width && measured.height
                    ? Math.min(1, bounds.maxWidth / measured.width, bounds.maxHeight / measured.height) * 0.98
                    : 1;
                const metrics = this.evaluateMeasuredLayout({
                    width: measured.width,
                    height: measured.height,
                    rowWidths: measured.rowWidths,
                    scale,
                    bounds,
                    source: "track",
                });

                return {
                    lineIndex: index,
                    text: this.summarizeLineText(line),
                    rows: rows.map((row) => row.map((word) => word.text)),
                    ...metrics,
                };
            });

            const worst = [...lines].sort((left, right) => {
                const severity = { fail: 2, warn: 1, pass: 0 };
                return (
                    severity[right.status] - severity[left.status]
                    || (right.overflowX + right.overflowY) - (left.overflowX + left.overflowY)
                    || left.scale - right.scale
                );
            })[0];

            const summary = {
                total: lines.length,
                pass: lines.filter((line) => line.status === "pass").length,
                warn: lines.filter((line) => line.status === "warn").length,
                fail: lines.filter((line) => line.status === "fail").length,
                avgWidthUse: Number((lines.reduce((sum, line) => sum + line.widthUse, 0) / lines.length).toFixed(3)),
                avgHeightUse: Number((lines.reduce((sum, line) => sum + line.heightUse, 0) / lines.length).toFixed(3)),
                avgBalance: Number((lines.reduce((sum, line) => sum + line.balance, 0) / lines.length).toFixed(3)),
                minScale: Number(Math.min(...lines.map((line) => line.scale)).toFixed(3)),
                maxOverflowX: Number(Math.max(...lines.map((line) => line.overflowX)).toFixed(2)),
                maxOverflowY: Number(Math.max(...lines.map((line) => line.overflowY)).toFixed(2)),
                worstLineIndex: worst?.lineIndex ?? -1,
                worstLineText: worst?.text ?? "",
            };

            return {
                thresholds: this.getLayoutThresholds(),
                summary,
                lines,
            };
        }

        clearRenderedLine({ resetTitle = true } = {}) {
            if (
                this.activeIndex === -1
                && !this.elements.currentLine?.textContent
                && !this.elements.currentGlow?.textContent
            ) {
                return;
            }

            this.activeIndex = -1;
            this.activeCharElements = [];
            this.glowCharElements = [];
            this.currentLayout = { scale: 1, shiftX: 0, shiftY: 0 };

            if (this.elements.currentLine) {
                this.elements.currentLine.innerHTML = "";
                this.elements.currentLine.style.transform = "translate3d(0, 0, 0)";
            }
            if (this.elements.currentGlow) {
                this.elements.currentGlow.innerHTML = "";
            }
            if (this.elements.currentShell) {
                this.elements.currentShell.style.transform = "translate(-50%, -50%) scale(1)";
            }
            this.elements.stage.style.setProperty("--spotlight-scale", "1");
            this.elements.stage.style.setProperty("--spotlight-opacity", "0.56");
            if (resetTitle) {
                this.stopTitleTicker();
            }
        }

        setDocumentTitle(value) {
            document.title = value || this.defaultDocumentTitle;
        }

        stopTitleTicker() {
            if (this.titleTickerHandle) {
                window.clearInterval(this.titleTickerHandle);
                this.titleTickerHandle = null;
            }
            this.titleTickerSource = "";
            this.titleTickerFrame = 0;
            this.setDocumentTitle(this.defaultDocumentTitle);
        }

        startTitleTicker(text) {
            const normalized = normalizeWhitespace(text);
            if (!normalized) {
                this.stopTitleTicker();
                return;
            }

            if (this.titleTickerSource === normalized && this.titleTickerHandle) {
                return;
            }

            if (this.titleTickerHandle) {
                window.clearInterval(this.titleTickerHandle);
                this.titleTickerHandle = null;
            }

            this.titleTickerSource = normalized;
            this.titleTickerFrame = 0;
            const spacer = "   ·   ";
            const marquee = `${normalized}${spacer}`;
            const updateFrame = () => {
                const offset = this.titleTickerFrame % marquee.length;
                const nextTitle = marquee.slice(offset) + marquee.slice(0, offset);
                this.setDocumentTitle(nextTitle);
                this.titleTickerFrame += 1;
            };

            updateFrame();
            this.titleTickerHandle = window.setInterval(updateFrame, 280);
        }

        renderLineState(time, charRefs, { revealAll = false } = {}) {
            charRefs.forEach((charRef) => {
                const isVisible = revealAll || this.displayMode === "line" ? true : time >= charRef.start;
                charRef.element.classList.toggle("is-visible", isVisible);
            });
        }

        render(time) {
            if (!this.state.track?.lines?.length) {
                this.clearRenderedLine();
                return;
            }
            const display = this.resolveDisplayLine(time);
            this.startTitleTicker(this.resolveTickerText(time));
            const index = display.index;
            const line = display.line;
            if (!line) {
                this.clearRenderedLine({ resetTitle: false });
                return;
            }

            const isStrictActive = this.getLineIndex(time) === index;
            const lineProgress = isStrictActive ? this.getLineProgress(time, line) : 1;
            const pulse = Math.sin(lineProgress * Math.PI);

            if (this.activeIndex !== index) {
                this.activeIndex = index;
                if (Array.isArray(line.timedWords) && line.timedWords.length) {
                    line.rows = this.chooseMeasuredRows(line);
                }
                this.activePlacement = this.pickLinePlacement(line);
                this.updateTheme(line);
                this.applyLinePlacement(this.activePlacement);
                this.activeCharElements = this.buildFocusedLine(this.elements.currentLine, line, "lyric-line lyric-line--active");
                this.glowCharElements = [];
                this.currentLayout = this.computeViewportLayout();
            }

            this.renderLineState(time, this.activeCharElements, { revealAll: !isStrictActive });

            this.applyViewportLayout(this.currentLayout);
            this.elements.currentLine.style.transform = "translate3d(0, 0, 0)";
            this.elements.stage.style.setProperty("--spotlight-scale", `${1 + pulse * 0.12}`);
            this.elements.stage.style.setProperty("--spotlight-opacity", `${0.62 + pulse * 0.28}`);
        }

        tick(now) {
            const delta = (now - this.lastFrame) / 1000;
            this.lastFrame = now;

            if (this.state.playback?.isPlaying) {
                this.state.playback.positionSeconds += delta;
                const duration = this.state.playback.durationSeconds || this.state.track?.durationSeconds || 0;
                if (this.state.playback.positionSeconds >= duration) {
                    this.state.playback.positionSeconds = 0;
                }
            }

            this.render(this.state.playback.positionSeconds);
            requestAnimationFrame(this.tick.bind(this));
        }
    }

    global.NcmLyricsDemo = {
        DEMO_LYRIC_CATALOG,
        EmptyLyricsProvider,
        MockLyricsProvider,
        HttpNcmBridgeProvider,
        PreviewSongProvider,
        LyricsStageApp,
    };
})(window);
