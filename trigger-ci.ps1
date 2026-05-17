@{ref='source'} | ConvertTo-Json | Set-Content -Path "$env:TEMP\trigger-ci.json"
gh api repos/mornikar/mornikar.github.io/actions/workflows/deploy.yml/dispatches --method POST --input "$env:TEMP\trigger-ci.json"
