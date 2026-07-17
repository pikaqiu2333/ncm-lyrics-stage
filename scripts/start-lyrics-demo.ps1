$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$scriptPath = Join-Path $root "scripts\start-lyrics-demo.js"
$nodePath = (Get-Command node).Source

& $nodePath $scriptPath @args
