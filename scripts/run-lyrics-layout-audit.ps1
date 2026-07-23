$ErrorActionPreference = "Stop"

$browserCandidates = @(
    "C:\Program Files\Google\Chrome\Application\chrome.exe",
    "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    "C:\Program Files\Microsoft\Edge\Application\msedge.exe"
)

$browser = $browserCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $browser) {
    throw "No supported headless browser found."
}

$baseUrl = if ($env:LYRICS_AUDIT_BASE_URL) { $env:LYRICS_AUDIT_BASE_URL } else { "http://127.0.0.1:3210/" }
$cases = @(
    @{ name = "Tiptoes After Midnight"; mode = "mock"; track = "tiptoes-after-midnight" },
    @{ name = "Moonlit Echo"; mode = "mock"; track = "moonlit-echo" }
)

function Get-AuditJson {
    param(
        [string]$Url
    )

    $html = & $browser --headless=new --disable-gpu --virtual-time-budget=9000 --dump-dom $Url 2>$null
    if (-not $html) {
        throw "Browser returned empty output for $Url"
    }

    $match = [regex]::Match($html, '<script id="audit-json" type="application/json">(?<json>.*?)</script>', [System.Text.RegularExpressions.RegexOptions]::Singleline)
    if (-not $match.Success) {
        throw "Audit payload not found in DOM for $Url"
    }

    return $match.Groups["json"].Value
}

$results = foreach ($case in $cases) {
    $url = if ($case.mode -eq "mock") {
        ('{0}?mode=mock&audit=1&track={1}' -f $baseUrl, $case.track)
    } else {
        ('{0}?preview=1&audit=1&songId={1}' -f $baseUrl, $case.songId)
    }
    try {
        $json = Get-AuditJson -Url $url
        $payload = $json | ConvertFrom-Json -Depth 8
        [pscustomobject]@{
            Name = $case.name
            Target = if ($case.track) { $case.track } else { $case.songId }
            Status = if ($payload.summary.fail -gt 0) { "fail" } elseif ($payload.summary.warn -gt 0) { "warn" } else { "pass" }
            Pass = $payload.summary.pass
            Warn = $payload.summary.warn
            Fail = $payload.summary.fail
            MinScale = $payload.summary.minScale
            AvgWidthUse = $payload.summary.avgWidthUse
            AvgHeightUse = $payload.summary.avgHeightUse
            AvgBalance = $payload.summary.avgBalance
            WorstLineIndex = $payload.summary.worstLineIndex
            WorstLineText = $payload.summary.worstLineText
        }
    } catch {
        [pscustomobject]@{
            Name = $case.name
            Target = if ($case.track) { $case.track } else { $case.songId }
            Status = "error"
            Pass = $null
            Warn = $null
            Fail = $null
            MinScale = $null
            AvgWidthUse = $null
            AvgHeightUse = $null
            AvgBalance = $null
            WorstLineIndex = $null
            WorstLineText = $_.Exception.Message
        }
    }
}

$results | Format-Table -AutoSize
