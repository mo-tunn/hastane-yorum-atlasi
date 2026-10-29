$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

# Ensure Wrangler deploys to the account currently used for this project.
$env:CLOUDFLARE_ACCOUNT_ID = "9850a4282ca9127be7ed809ea1343750"

$dist = Join-Path $PSScriptRoot "dist"
if (Test-Path -LiteralPath $dist) {
    Remove-Item -LiteralPath $dist -Recurse -Force
}
New-Item -ItemType Directory -Force -Path $dist | Out-Null

Copy-Item -LiteralPath (Join-Path $PSScriptRoot "index.html") -Destination (Join-Path $dist "index.html") -Force
Copy-Item -LiteralPath (Join-Path $PSScriptRoot "grafikler.html") -Destination (Join-Path $dist "grafikler.html") -Force
Copy-Item -LiteralPath (Join-Path $PSScriptRoot "site-nav.css") -Destination (Join-Path $dist "site-nav.css") -Force
Copy-Item -LiteralPath (Join-Path $PSScriptRoot "favicon.svg") -Destination (Join-Path $dist "favicon.svg") -Force

# Build a text-free public point dataset and private review chunks for the Worker API.
node (Join-Path $PSScriptRoot "build-public-data.cjs")
if ($LASTEXITCODE -ne 0) {
    throw "Public data build failed."
}

Write-Host "Deploying static assets and on-demand review API from: $dist"
Get-ChildItem -LiteralPath $dist -Recurse -File | ForEach-Object {
    $relative = $_.FullName.Substring($dist.Length + 1)
    Write-Host ("  {0} ({1:N2} MiB)" -f $relative, ($_.Length / 1MB))
}

npm exec --yes --package=wrangler -- wrangler deploy
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}
