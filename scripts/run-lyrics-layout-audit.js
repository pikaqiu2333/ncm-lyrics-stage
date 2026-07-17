#!/usr/bin/env node
"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");

const BASE_URL = process.env.LYRICS_AUDIT_BASE_URL || "http://127.0.0.1:3210/";
const EXISTING_CDP_PORT = Number(process.env.LYRICS_AUDIT_CDP_PORT || 0);
const CASES = [
    { name: "tiptoes-after-midnight", mode: "mock", track: "tiptoes-after-midnight" },
    { name: "qing-hua-ci", mode: "mock", track: "qing-hua-ci" },
];

function findBrowser() {
    const candidates = [
        "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
        "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
        "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    ];

    return candidates.find((candidate) => fs.existsSync(candidate)) || null;
}

async function delay(ms) {
    await new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForJson(url, timeoutMs = 10000) {
    const startedAt = Date.now();
    let lastError = null;

    while ((Date.now() - startedAt) < timeoutMs) {
        try {
            const response = await fetch(url);
            if (response.ok) {
                return response.json();
            }
            lastError = new Error(`HTTP ${response.status}`);
        } catch (error) {
            lastError = error;
        }
        await delay(200);
    }

    throw lastError || new Error(`Timed out waiting for ${url}`);
}

async function getPageDebuggerUrl(port) {
    const targets = await waitForJson(`http://127.0.0.1:${port}/json/list`, 10000);
    const pageTarget = Array.isArray(targets)
        ? targets.find((target) => target.type === "page" && target.webSocketDebuggerUrl)
        : null;

    if (!pageTarget?.webSocketDebuggerUrl) {
        throw new Error(`No page target found on port ${port}`);
    }

    return pageTarget.webSocketDebuggerUrl;
}

async function sendCdp(ws, method, params = {}) {
    const id = sendCdp.nextId++;
    const payload = JSON.stringify({ id, method, params });

    return new Promise((resolve, reject) => {
        const handleMessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                if (message.id !== id) return;
                ws.removeEventListener("message", handleMessage);
                if (message.error) {
                    reject(new Error(message.error.message || `CDP error: ${method}`));
                    return;
                }
                resolve(message.result || {});
            } catch (error) {
                ws.removeEventListener("message", handleMessage);
                reject(error);
            }
        };

        ws.addEventListener("message", handleMessage);
        ws.send(payload);
    });
}
sendCdp.nextId = 1;

async function stopChildProcess(child) {
    if (!child) return;
    if (child.exitCode !== null || child.killed) return;

    child.kill();
    await new Promise((resolve) => {
        const timeout = setTimeout(resolve, 2000);
        child.once("close", () => {
            clearTimeout(timeout);
            resolve();
        });
        child.once("error", () => {
            clearTimeout(timeout);
            resolve();
        });
    });
}

function buildAuditUrl(testCase) {
    const target = new URL(BASE_URL);
    target.searchParams.set("audit", "1");

    if (testCase.mode === "mock") {
        target.searchParams.set("mode", "mock");
        target.searchParams.set("track", testCase.track);
        return target.toString();
    }

    target.searchParams.set("preview", "1");
    target.searchParams.set("songId", testCase.songId);
    return target.toString();
}

async function runAuditCase(browserPath, testCase, index) {
    const targetUrl = buildAuditUrl(testCase);
    const port = EXISTING_CDP_PORT || (9330 + index);
    const tempProfile = EXISTING_CDP_PORT ? null : fs.mkdtempSync(path.join(os.tmpdir(), "lyrics-audit-"));

    const child = EXISTING_CDP_PORT
        ? null
        : spawn(browserPath, [
            `--remote-debugging-port=${port}`,
            "--headless=new",
            "--disable-gpu",
            "--no-first-run",
            "--no-default-browser-check",
            `--user-data-dir=${tempProfile}`,
            targetUrl,
        ], {
            stdio: "ignore",
            windowsHide: true,
        });

    try {
        if (!EXISTING_CDP_PORT) {
            await waitForJson(`http://127.0.0.1:${port}/json/version`, 15000);
        }

        const ws = new WebSocket(await getPageDebuggerUrl(port));
        await new Promise((resolve, reject) => {
            ws.addEventListener("open", resolve, { once: true });
            ws.addEventListener("error", reject, { once: true });
        });

        await sendCdp(ws, "Runtime.enable");
        await sendCdp(ws, "Page.enable");
        await sendCdp(ws, "Page.navigate", { url: targetUrl });
        await delay(2200);

        const evaluation = await sendCdp(ws, "Runtime.evaluate", {
            expression: "JSON.stringify(window.auditLyricsStage ? window.auditLyricsStage() : null)",
            returnByValue: true,
            awaitPromise: true,
        });

        ws.close();
        const jsonValue = evaluation?.result?.value;
        if (!jsonValue) {
            throw new Error(`Audit returned empty payload for ${testCase.songId}`);
        }

        const payload = JSON.parse(jsonValue);
        return {
            name: testCase.name,
            target: testCase.songId || testCase.track,
            status: payload.summary.fail > 0 ? "fail" : payload.summary.warn > 0 ? "warn" : "pass",
            summary: payload.summary,
        };
    } finally {
        await stopChildProcess(child);
        if (tempProfile) {
            fs.rmSync(tempProfile, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
        }
    }
}

async function main() {
    const browserPath = findBrowser();
    if (!browserPath) {
        throw new Error("No supported browser found.");
    }

    const results = [];
    for (const [index, testCase] of CASES.entries()) {
        try {
            const result = await runAuditCase(browserPath, testCase, index);
            results.push(result);
        } catch (error) {
            results.push({
                name: testCase.name,
                target: testCase.songId || testCase.track,
                status: "error",
                summary: { error: error.message },
            });
        }
    }

    console.log(JSON.stringify(results, null, 2));
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
