#!/usr/bin/env node
"use strict";

const fs = require("fs");
const http = require("http");
const path = require("path");
const { spawn } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const DIST_DIR = path.join(ROOT, "dist");
const BRIDGE_SCRIPT = path.join(ROOT, "scripts", "ncm-cli-web-bridge.js");
const PORT = Number(process.env.NCM_WEB_DEMO_PORT || 3210);
const HOST = process.env.NCM_WEB_DEMO_HOST || "127.0.0.1";
const HEALTH_URL = `http://${HOST}:${PORT}/api/health`;
const DEMO_URL = `http://${HOST}:${PORT}/`;
const LOG_PATH = path.join(DIST_DIR, "ncm-lyrics-demo.log");
const ERR_PATH = path.join(DIST_DIR, "ncm-lyrics-demo.err.log");
const SHOULD_OPEN = process.argv.includes("--open");

function ensureDistDir() {
    fs.mkdirSync(DIST_DIR, { recursive: true });
}

function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function checkHealth() {
    return new Promise((resolve) => {
        const request = http.get(HEALTH_URL, (response) => {
            let body = "";
            response.on("data", (chunk) => {
                body += chunk;
            });
            response.on("end", () => {
                try {
                    const payload = JSON.parse(body || "{}");
                    resolve(response.statusCode === 200 && payload.ok === true);
                } catch (error) {
                    resolve(false);
                }
            });
        });

        request.on("error", () => resolve(false));
        request.setTimeout(1200, () => {
            request.destroy();
            resolve(false);
        });
    });
}

async function waitForHealth(timeoutMs = 10000) {
    const startedAt = Date.now();
    while ((Date.now() - startedAt) < timeoutMs) {
        if (await checkHealth()) return true;
        await wait(250);
    }
    return false;
}

function openBrowser(url) {
    const opener = process.platform === "win32"
        ? { command: "cmd.exe", args: ["/c", "start", "", url] }
        : process.platform === "darwin"
            ? { command: "open", args: [url] }
            : { command: "xdg-open", args: [url] };

    spawn(opener.command, opener.args, {
        cwd: ROOT,
        detached: true,
        stdio: "ignore",
        windowsHide: true,
    }).unref();
}

async function main() {
    ensureDistDir();

    if (!(await checkHealth())) {
        const out = fs.openSync(LOG_PATH, "a");
        const err = fs.openSync(ERR_PATH, "a");
        const child = spawn(process.execPath, [BRIDGE_SCRIPT], {
            cwd: ROOT,
            detached: true,
            stdio: ["ignore", out, err],
            windowsHide: true,
            env: process.env,
        });
        child.unref();
    }

    const isReady = await waitForHealth();
    if (!isReady) {
        throw new Error(`Lyrics bridge did not become healthy at ${HEALTH_URL}. Check ${ERR_PATH}.`);
    }

    console.log(`Lyrics demo: ${DEMO_URL}`);
    console.log(`Bridge health: ${HEALTH_URL}`);
    console.log(`Mock showcase: ${DEMO_URL}?mode=mock&track=tiptoes-after-midnight`);
    console.log(`Qing Hua Ci showcase: ${DEMO_URL}?mode=mock&track=qing-hua-ci`);
    console.log(`Logs: ${LOG_PATH}`);

    if (SHOULD_OPEN) {
        openBrowser(`${DEMO_URL}?mode=mock&track=tiptoes-after-midnight`);
    }
}

main().catch((error) => {
    console.error(error.message || error);
    process.exitCode = 1;
});
