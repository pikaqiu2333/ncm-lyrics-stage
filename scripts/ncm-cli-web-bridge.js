#!/usr/bin/env node
"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const PORT = Number(process.env.NCM_WEB_DEMO_PORT || 3210);
const ROOT = path.resolve(__dirname, "..");
const FRONTEND_DIR = path.join(ROOT, "frontend");
const ENTRY_HTML = path.join(FRONTEND_DIR, "lyrics-stage-demo.html");
const CLI_BIN = process.platform === "win32" ? "ncm-cli.cmd" : "ncm-cli";
const NCM_CONFIG_DIR = process.platform === "win32"
    ? path.join(process.env.USERPROFILE || "", ".config", "ncm-cli")
    : path.join(process.env.HOME || "", ".config", "ncm-cli");
const PLAY_SESSION_FILE = path.join(NCM_CONFIG_DIR, "play-session.json");
const LYRIC_CACHE_DIR = process.platform === "win32"
    ? path.join(process.env.LOCALAPPDATA || "", "Netease", "CloudMusic", "webdata", "lyric")
    : "";

const MIME_TYPES = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".woff2": "font/woff2",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
};

const MOCK_SNAPSHOT = {
    ok: true,
    source: "bridge-mock",
    usedFallback: true,
    hint: "The bridge is serving local demo lyrics until ncm-cli is ready.",
    cli: { available: false, configured: false, version: null },
    playback: { isPlaying: true, positionSeconds: 0, durationSeconds: 13 },
    track: { title: "Tiptoes After Midnight", artist: "Star Office Radio", id: "tiptoes-after-midnight" },
};

const lyricPayloadCache = new Map();

function json(res, statusCode, payload) {
    res.writeHead(statusCode, {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-store",
    });
    res.end(JSON.stringify(payload, null, 2));
}

function serveFile(res, filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const mime = MIME_TYPES[ext] || "application/octet-stream";
    fs.readFile(filePath, (error, buffer) => {
        if (error) {
            json(res, 404, { ok: false, error: `Not found: ${path.basename(filePath)}` });
            return;
        }

        res.writeHead(200, {
            "Content-Type": mime,
            "Cache-Control": "no-store",
        });
        res.end(buffer);
    });
}

function runCli(args) {
    return new Promise((resolve) => {
        const child = spawn(CLI_BIN, args, {
            cwd: ROOT,
            shell: process.platform === "win32",
            windowsHide: true,
        });

        let stdout = "";
        let stderr = "";

        child.stdout.on("data", (chunk) => {
            stdout += chunk.toString();
        });

        child.stderr.on("data", (chunk) => {
            stderr += chunk.toString();
        });

        child.on("close", (code) => {
            resolve({ code, stdout: stdout.trim(), stderr: stderr.trim() });
        });

        child.on("error", (error) => {
            resolve({ code: 1, stdout: "", stderr: String(error.message || error) });
        });
    });
}

function readJsonFile(filePath) {
    try {
        if (!fs.existsSync(filePath)) return null;
        return JSON.parse(fs.readFileSync(filePath, "utf8"));
    } catch (error) {
        return null;
    }
}

function readCurrentPlaySession() {
    const session = readJsonFile(PLAY_SESSION_FILE);
    if (!session || typeof session !== "object") return null;
    if (!session.id) return null;
    return session;
}

function normalizeWhitespace(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
}

function normalizeTimeValue(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return 0;
    return numeric > 10000 ? numeric / 1000 : numeric;
}

function parseTimeToken(token) {
    const match = String(token || "").match(/(\d+):(\d{2})(?:[.:](\d{1,3}))?/);
    if (!match) return null;

    const milliseconds = match[3] ? Number(match[3].padEnd(3, "0")) : 0;
    return Number(match[1]) * 60 + Number(match[2]) + milliseconds / 1000;
}

function findField(lines, patterns) {
    const line = lines.find((entry) => patterns.some((pattern) => pattern.test(entry)));
    if (!line) return null;

    const parts = line.split(/[:：]/);
    if (parts.length < 2) return null;
    return parts.slice(1).join(":").trim() || null;
}

function deepFindObject(value, predicate, depth = 0) {
    if (!value || depth > 6) return null;
    if (predicate(value)) return value;

    if (Array.isArray(value)) {
        for (const item of value) {
            const found = deepFindObject(item, predicate, depth + 1);
            if (found) return found;
        }
        return null;
    }

    if (typeof value === "object") {
        for (const entry of Object.values(value)) {
            const found = deepFindObject(entry, predicate, depth + 1);
            if (found) return found;
        }
    }

    return null;
}

function extractArtistName(value) {
    if (!value) return null;
    if (typeof value === "string") return normalizeWhitespace(value);
    if (Array.isArray(value)) {
        const names = value
            .map((item) => extractArtistName(item))
            .filter(Boolean);
        return names.length ? names.join(" / ") : null;
    }
    if (typeof value === "object") {
        return normalizeWhitespace(value.name || value.artistName || value.alias || "");
    }
    return null;
}

function extractTrackFromJson(parsedJson) {
    const candidates = [
        parsedJson,
        parsedJson.state,
        parsedJson.track,
        parsedJson.song,
        parsedJson.currentTrack,
        parsedJson.currentSong,
        parsedJson.playback,
    ].filter((entry) => entry && typeof entry === "object");

    const discovered = deepFindObject(parsedJson, (entry) => {
        if (!entry || typeof entry !== "object" || Array.isArray(entry)) return false;
        return Boolean(
            entry.title ||
            entry.name ||
            entry.songName ||
            entry.trackName ||
            entry.id ||
            entry.songId ||
            entry.trackId ||
            entry.originalId,
        );
    });

    if (discovered) candidates.unshift(discovered);

    const track = {
        id: null,
        title: null,
        artist: null,
        coverUrl: null,
    };

    for (const candidate of candidates) {
        if (!candidate || typeof candidate !== "object") continue;

        track.id ||= candidate.songId || candidate.trackId || candidate.originalId || candidate.id || candidate.lrcid || null;
        track.title ||= candidate.title || candidate.songName || candidate.trackName || candidate.name || null;
        track.artist ||= extractArtistName(candidate.artist)
            || extractArtistName(candidate.artists)
            || extractArtistName(candidate.singer)
            || extractArtistName(candidate.performer);
        track.coverUrl ||= candidate.coverUrl
            || candidate.picUrl
            || candidate.cover
            || candidate.album?.picUrl
            || candidate.album?.cover
            || null;
    }

    const rawStatus = String(
        parsedJson.state?.status
        || parsedJson.status
        || parsedJson.playbackStatus
        || parsedJson.playStatus
        || "",
    ).toLowerCase();

    const rawPosition = parsedJson.state?.position
        ?? parsedJson.position
        ?? parsedJson.progress
        ?? parsedJson.currentTime
        ?? 0;

    const rawDuration = parsedJson.state?.duration
        ?? parsedJson.duration
        ?? parsedJson.total
        ?? parsedJson.length
        ?? 0;

    return {
        track,
        isPlaying: rawStatus ? rawStatus === "playing" : true,
        positionSeconds: normalizeTimeValue(rawPosition),
        durationSeconds: normalizeTimeValue(rawDuration),
        parsedJson,
    };
}

function parseStateOutput(text) {
    const lines = String(text || "")
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

    try {
        const parsedJson = JSON.parse(String(text || "{}"));
        if (parsedJson && typeof parsedJson === "object") {
            const extracted = extractTrackFromJson(parsedJson);
            return {
                ...extracted.track,
                isPlaying: extracted.isPlaying,
                positionSeconds: extracted.positionSeconds,
                durationSeconds: extracted.durationSeconds,
                parsedJson: extracted.parsedJson,
                rawText: text,
            };
        }
    } catch (error) {
        // Fall back to loose text parsing for older CLI output.
    }

    const joined = lines.join(" | ");
    const timeMatches = joined.match(/\d+:\d{2}(?:[.:]\d{1,3})?/g) || [];

    return {
        id: findField(lines, [/song id/i, /track id/i, /\bid\b/i]) || null,
        title: findField(lines, [/song/i, /title/i, /track/i]) || null,
        artist: findField(lines, [/artist/i, /singer/i, /performer/i]) || null,
        coverUrl: null,
        isPlaying: !/pause|paused|stopped/i.test(joined),
        positionSeconds: parseTimeToken(timeMatches[0]) || 0,
        durationSeconds: parseTimeToken(timeMatches[1]) || 0,
        parsedJson: null,
        rawText: text,
    };
}

function isCliConfigured(result) {
    const text = `${result.stderr}\n${result.stdout}`;
    return !/API key|configure|privateKey|appId/i.test(text);
}

function splitDisplayTokens(text) {
    const clean = normalizeWhitespace(text);
    if (!clean) return [];

    if (!/\s/.test(clean) && /[\u4e00-\u9fff]/.test(clean)) {
        return Array.from(clean).filter(Boolean);
    }

    return clean.split(/\s+/).filter(Boolean);
}

const ENGLISH_LIGHT_WORDS = new Set([
    "a", "an", "and", "as", "at", "be", "been", "being", "but", "by", "do", "did", "does",
    "for", "from", "i", "i'm", "i'll", "i've", "if", "in", "into", "is", "it", "it's", "me",
    "my", "of", "on", "or", "our", "so", "that", "the", "their", "them", "there", "they",
    "this", "to", "up", "we", "we'll", "we're", "with", "you", "your", "you're",
]);

const ENGLISH_STRETCH_WORDS = new Set([
    "ah", "aha", "alright", "baby", "drive", "dreams", "fire", "go", "hey", "home", "lights",
    "love", "mine", "night", "no", "oh", "ooh", "oooh", "right", "road", "sorry", "stay",
    "tonight", "worry", "yeah", "you",
]);

function stripOuterPunctuation(token) {
    return String(token || "").replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");
}

function countReadableUnits(token) {
    const core = stripOuterPunctuation(token).toLowerCase();
    if (!core) return 0.3;

    if (/^[\u4e00-\u9fff]+$/u.test(core)) {
        return Array.from(core).length;
    }

    if (/^[a-z0-9'’-]+$/i.test(core)) {
        const vowelRuns = (core.match(/[aeiouy]+/gi) || []).length;
        return Math.max(1, vowelRuns || Math.ceil(core.length / 3));
    }

    return Math.max(1, Array.from(core).length * 0.55);
}

function estimateTokenWeight(token, index, tokens) {
    const value = String(token || "");
    const core = stripOuterPunctuation(value).toLowerCase();

    if (!core) {
        return 0.18;
    }

    let weight = 0.48 + countReadableUnits(core) * 0.34;

    if (ENGLISH_LIGHT_WORDS.has(core)) {
        weight *= 0.72;
    }

    if (ENGLISH_STRETCH_WORDS.has(core)) {
        weight *= 1.18;
    }

    if (/ing$|own$|ight$|ove$|ire$|ore$|ain$|ay$/i.test(core)) {
        weight *= 1.08;
    }

    if (/[,;:，；：]$/.test(value)) {
        weight *= 1.18;
    }

    if (/[.!?。！？]$/.test(value)) {
        weight *= 1.28;
    }

    if (/^[A-Z0-9]+$/.test(core) && core.length > 1) {
        weight *= 1.12;
    }

    const next = tokens[index + 1] || "";
    if (/[,;:，；：]$/.test(value) || /^[,;:，；：]/.test(next)) {
        weight *= 1.08;
    }

    if (index === tokens.length - 1) {
        weight *= 1.1;
    }

    return Math.max(weight, 0.16);
}

function buildEstimatedWords(text, start, end) {
    const tokens = splitDisplayTokens(text);
    if (!tokens.length) return [];

    const duration = Math.max((end || start + 2.4) - start, 0.2);
    const weights = tokens.map((token, index) => estimateTokenWeight(token, index, tokens));
    const totalWeight = weights.reduce((sum, value) => sum + value, 0) || tokens.length;
    const rawDurations = weights.map((weight) => duration * (weight / totalWeight));
    const minimumDuration = Math.min(0.08, duration / Math.max(tokens.length * 3, 1));
    let cursor = start;

    return tokens.map((token, index) => {
        const remaining = Math.max(end - cursor, 0);
        const tokenDuration = index === tokens.length - 1
            ? remaining
            : Math.max(minimumDuration, Math.min(rawDurations[index], remaining));
        const word = {
            text: token,
            start: cursor,
            end: cursor + tokenDuration,
        };
        cursor += tokenDuration;
        return word;
    });
}

function parseLrcLines(text) {
    const entries = [];
    const lines = String(text || "").split(/\r?\n/);

    for (const line of lines) {
        const tags = [...line.matchAll(/\[(\d+):(\d{2})(?:[.:](\d{1,3}))?\]/g)];
        if (!tags.length) continue;

        const content = normalizeWhitespace(line.replace(/\[(\d+):(\d{2})(?:[.:](\d{1,3}))?\]/g, ""));
        for (const tag of tags) {
            const minutes = Number(tag[1]);
            const seconds = Number(tag[2]);
            const milliseconds = tag[3] ? Number(tag[3].padEnd(3, "0")) : 0;
            entries.push({
                start: minutes * 60 + seconds + milliseconds / 1000,
                text: content,
            });
        }
    }

    entries.sort((left, right) => left.start - right.start);

    return entries
        .map((entry, index) => {
            const next = entries[index + 1];
            const end = next ? next.start : entry.start + Math.max(2.6, Math.min(entry.text.length * 0.18, 5));
            return {
                start: entry.start,
                end,
                text: entry.text,
                words: buildEstimatedWords(entry.text, entry.start, end),
            };
        })
        .filter((entry) => entry.text);
}

function parseKaraokeLines(text) {
    const parsedLines = [];
    const lines = String(text || "").split(/\r?\n/);

    for (const rawLine of lines) {
        const lineMatch = rawLine.match(/^\[(\d+),(\d+)\](.*)$/);
        if (!lineMatch) continue;

        const lineStart = Number(lineMatch[1]) / 1000;
        const lineEnd = lineStart + Number(lineMatch[2]) / 1000;
        const content = lineMatch[3];
        const words = [];
        const wordPattern = /\((\d+),(\d+),\d+\)([^()]*)/g;
        let match = wordPattern.exec(content);

        while (match) {
            const textValue = normalizeWhitespace(match[3]);
            if (textValue) {
                const wordStart = Number(match[1]) / 1000;
                const wordEnd = wordStart + Number(match[2]) / 1000;
                words.push({
                    text: textValue,
                    start: wordStart,
                    end: wordEnd,
                });
            }
            match = wordPattern.exec(content);
        }

        if (!words.length) continue;

        parsedLines.push({
            start: lineStart,
            end: Math.max(lineEnd, words[words.length - 1].end),
            text: words.map((word) => word.text).join(" "),
            words,
        });
    }

    return parsedLines;
}

function resolveLyricMode(payload) {
    const yrc = String(payload?.yrc?.lyric || "").trim();
    if (yrc) return { mode: "yrc", lines: parseKaraokeLines(yrc) };

    const klyric = String(payload?.klyric?.lyric || "").trim();
    if (klyric) return { mode: "klyric", lines: parseKaraokeLines(klyric) };

    const lrc = String(payload?.lrc?.lyric || "").trim();
    if (lrc) return { mode: "lrc-estimated", lines: parseLrcLines(lrc) };

    return { mode: "none", lines: [] };
}

function readLyricPayload(songId) {
    if (!songId || !LYRIC_CACHE_DIR) return null;

    const cachePath = path.join(LYRIC_CACHE_DIR, String(songId));
    if (!fs.existsSync(cachePath)) return null;

    try {
        return JSON.parse(fs.readFileSync(cachePath, "utf8"));
    } catch (error) {
        return null;
    }
}

function buildLyricsTrack(songId, payload, trackMeta = {}, source = "netease-local-cache") {
    const resolved = resolveLyricMode(payload);
    if (!resolved.lines.length) return null;

    return {
        key: String(songId),
        title: trackMeta.title || payload?.song?.name || String(songId),
        artist: trackMeta.artist || null,
        coverUrl: trackMeta.coverUrl || null,
        timingMode: resolved.mode,
        source,
        lines: resolved.lines,
        durationSeconds: resolved.lines[resolved.lines.length - 1].end,
    };
}

function getLyricsById(songId, trackMeta) {
    const payload = readLyricPayload(songId);
    if (!payload) return null;
    return buildLyricsTrack(songId, payload, trackMeta);
}

function toCliLyricPayload(lyricData) {
    return {
        lrc: { lyric: lyricData?.lyric || "" },
        tlyric: { lyric: lyricData?.transLyric || "" },
        klyric: { lyric: "" },
        yrc: { lyric: "" },
        song: {
            id: lyricData?.originalId || null,
            name: lyricData?.name || null,
        },
    };
}

async function fetchCliLyricData(songId) {
    if (!songId) return null;
    const cacheKey = String(songId);
    if (lyricPayloadCache.has(cacheKey)) {
        return lyricPayloadCache.get(cacheKey);
    }

    const result = await runCli(["song", "lyric", "--songId", cacheKey]);
    if (result.code !== 0) return null;

    try {
        const parsed = JSON.parse(result.stdout || "{}");
        const data = parsed?.data;
        if (!data || data.noLyric) return null;
        lyricPayloadCache.set(cacheKey, data);
        return data;
    } catch (error) {
        return null;
    }
}

async function getStatusSnapshot(options = {}) {
    const overrideSongId = options.overrideSongId ? String(options.overrideSongId) : null;
    const version = await runCli(["--version"]);
    if (version.code !== 0) {
        return {
            ...MOCK_SNAPSHOT,
            hint: "ncm-cli is not available on PATH. The stage is using local demo lyrics.",
            cli: { available: false, configured: false, version: null, error: version.stderr || version.stdout },
        };
    }

    const state = await runCli(["state"]);
    if (state.code !== 0 || !isCliConfigured(state)) {
        return {
            ...MOCK_SNAPSHOT,
            hint: "ncm-cli is installed, but configure/login still needs to be completed for real sync.",
            cli: { available: true, configured: false, version: version.stdout, error: state.stderr || state.stdout },
        };
    }

    const parsed = parseStateOutput(state.stdout);
    const session = readCurrentPlaySession();
    const encryptedSongId = overrideSongId || parsed.id || session?.id || null;
    const cliLyricData = await fetchCliLyricData(encryptedSongId);
    const originalSongId = cliLyricData?.originalId || null;
    const trackMeta = {
        title: parsed.title,
        artist: parsed.artist,
        coverUrl: parsed.coverUrl,
    };
    const localEnhancedLyrics = originalSongId ? getLyricsById(originalSongId, trackMeta) : null;
    const cliLyrics = cliLyricData
        ? buildLyricsTrack(encryptedSongId, toCliLyricPayload(cliLyricData), trackMeta, "ncm-cli-lyric")
        : null;
    const shouldPreferLocalEnhancement = localEnhancedLyrics
        && (localEnhancedLyrics.timingMode === "yrc" || localEnhancedLyrics.timingMode === "klyric");
    const lyrics = shouldPreferLocalEnhancement
        ? localEnhancedLyrics
        : (cliLyrics || localEnhancedLyrics || null);

    const hasRealLyrics = Boolean(lyrics);
    const timingLabel = lyrics?.timingMode === "yrc" || lyrics?.timingMode === "klyric"
        ? "true-word"
        : lyrics?.timingMode === "lrc-estimated"
            ? "estimated-word"
            : "none";

    return {
        ok: true,
        source: "ncm-cli",
        usedFallback: !hasRealLyrics,
        hint: hasRealLyrics
            ? originalSongId && lyrics.source === "netease-local-cache"
                ? `Connected to ncm-cli. Lyrics are loading in ${timingLabel} mode with local cache enhancement.`
                : "Connected to ncm-cli. Lyrics are loading directly from the CLI lyric command."
            : "Connected to ncm-cli playback state, but the current song lyric payload could not be resolved yet.",
        cli: { available: true, configured: true, version: version.stdout },
        playback: {
            isPlaying: parsed.isPlaying,
            positionSeconds: parsed.positionSeconds,
            durationSeconds: parsed.durationSeconds || lyrics?.durationSeconds || MOCK_SNAPSHOT.playback.durationSeconds,
        },
        track: {
            title: parsed.title || lyrics?.title || MOCK_SNAPSHOT.track.title,
            artist: parsed.artist || lyrics?.artist || MOCK_SNAPSHOT.track.artist,
            id: encryptedSongId || parsed.title || MOCK_SNAPSHOT.track.id,
            coverUrl: parsed.coverUrl || null,
        },
        lyrics,
        lyricsMeta: {
            requestedSongId: overrideSongId,
            resolvedSongId: encryptedSongId,
            originalSongId,
            sessionId: session?.id || null,
        },
        raw: { stateText: parsed.rawText },
    };
}

async function handleControl(action) {
    const directMap = {
        next: ["next"],
        prev: ["prev"],
    };

    if (action === "toggle") {
        const snapshot = await getStatusSnapshot();
        if (!snapshot.cli?.available || !snapshot.cli?.configured) {
            return {
                ok: false,
                action,
                stdout: "",
                stderr: snapshot.hint || "ncm-cli is not ready yet.",
            };
        }

        const command = snapshot.playback?.isPlaying ? ["pause"] : ["resume"];
        const result = await runCli(command);
        return {
            ok: result.code === 0,
            action,
            stdout: result.stdout,
            stderr: result.stderr,
        };
    }

    const result = await runCli(directMap[action] || []);
    return {
        ok: result.code === 0,
        action,
        stdout: result.stdout,
        stderr: result.stderr,
    };
}

const server = http.createServer(async (req, res) => {
    if (req.method === "OPTIONS") {
        res.writeHead(204, {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        });
        res.end();
        return;
    }

    const url = new URL(req.url, `http://${req.headers.host}`);

    if (req.method === "GET" && url.pathname === "/") {
        serveFile(res, ENTRY_HTML);
        return;
    }

    if (req.method === "GET" && url.pathname === "/api/health") {
        json(res, 200, { ok: true, bridge: "ncm-cli-web-bridge", port: PORT });
        return;
    }

    if (req.method === "GET" && url.pathname === "/api/status") {
        const snapshot = await getStatusSnapshot({ overrideSongId: url.searchParams.get("songId") });
        json(res, 200, {
            ok: true,
            cli: snapshot.cli,
            source: snapshot.source,
            usedFallback: snapshot.usedFallback,
            hint: snapshot.hint,
            hasLyrics: Boolean(snapshot.lyrics),
            lyricMode: snapshot.lyrics?.timingMode || "none",
            lyricsMeta: snapshot.lyricsMeta,
        });
        return;
    }

    if (req.method === "GET" && url.pathname === "/api/snapshot") {
        const snapshot = await getStatusSnapshot({ overrideSongId: url.searchParams.get("songId") });
        json(res, 200, snapshot);
        return;
    }

    if (req.method === "GET" && url.pathname === "/api/lyrics/current") {
        const snapshot = await getStatusSnapshot({ overrideSongId: url.searchParams.get("songId") });
        if (!snapshot.lyrics) {
            json(res, 404, {
                ok: false,
                error: "No lyrics available for the current track.",
                track: snapshot.track,
                hint: snapshot.hint,
            });
            return;
        }

        json(res, 200, {
            ok: true,
            track: snapshot.track,
            lyrics: snapshot.lyrics,
        });
        return;
    }

    if (req.method === "GET" && url.pathname === "/api/lyrics/song") {
        const songId = url.searchParams.get("id");
        const lyrics = getLyricsById(songId);
        if (!lyrics) {
            json(res, 404, { ok: false, error: `No cached lyric file found for song ${songId || "<empty>"}.` });
            return;
        }

        json(res, 200, { ok: true, lyrics });
        return;
    }

    if (req.method === "POST" && /^\/api\/control\/(toggle|next|prev)$/.test(url.pathname)) {
        const action = url.pathname.split("/").pop();
        const result = await handleControl(action);
        json(res, result.ok ? 200 : 500, result);
        return;
    }

    if (req.method === "GET") {
        const target = path.join(FRONTEND_DIR, decodeURIComponent(url.pathname));
        if (target.startsWith(FRONTEND_DIR) && fs.existsSync(target) && fs.statSync(target).isFile()) {
            serveFile(res, target);
            return;
        }
    }

    json(res, 404, { ok: false, error: `Unhandled route: ${req.method} ${url.pathname}` });
});

server.listen(PORT, "127.0.0.1", () => {
    console.log(`[ncm-cli-web-bridge] listening on http://127.0.0.1:${PORT}`);
    console.log(`[ncm-cli-web-bridge] open http://127.0.0.1:${PORT}/ to view the lyrics player demo`);
});
