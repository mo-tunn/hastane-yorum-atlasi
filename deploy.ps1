$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

# Ensure Wrangler deploys to the account currently used for this project.
$env:CLOUDFLARE_ACCOUNT_ID = "9850a4282ca9127be7ed809ea1343750"

$dist = Join-Path $PSScriptRoot "dist"
New-Item -ItemType Directory -Force -Path $dist | Out-Null

Copy-Item -LiteralPath (Join-Path $PSScriptRoot "index.html") -Destination (Join-Path $dist "index.html") -Force
Copy-Item -LiteralPath (Join-Path $PSScriptRoot "grafikler.html") -Destination (Join-Path $dist "grafikler.html") -Force
Copy-Item -LiteralPath (Join-Path $PSScriptRoot "site-nav.css") -Destination (Join-Path $dist "site-nav.css") -Force
Copy-Item -LiteralPath (Join-Path $PSScriptRoot "favicon.svg") -Destination (Join-Path $dist "favicon.svg") -Force
Copy-Item -LiteralPath (Join-Path $PSScriptRoot "review-universe.json.gz") -Destination (Join-Path $dist "review-universe.json.gz") -Force

Write-Host "Deploying static files from: $dist"
Get-ChildItem -LiteralPath $dist -File | ForEach-Object {
    Write-Host ("  {0} ({1:N2} MiB)" -f $_.Name, ($_.Length / 1MB))
}

npm exec --yes --package=wrangler -- wrangler deploy
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}
