$envFile = ".env"
$lines = Get-Content $envFile
foreach ($line in $lines) {
    if ($line.Trim() -eq "" -or $line.StartsWith("#")) { continue }
    $parts = $line.Split("=", 2)
    $key = $parts[0].Trim()
    $value = $parts[1].Trim(' "')
    Write-Output "$value" | npx vercel env add $key production
    Write-Host "Added $key"
}
Write-Output "https://wide-zoos-feel.loca.lt" | npx vercel env add OLLAMA_URL production
Write-Host "Added OLLAMA_URL"
