$ErrorActionPreference = 'Stop'
$botSecureToken = Read-Host 'Paste BotFather token (hidden)' -AsSecureString
$botToken = [System.Net.NetworkCredential]::new('', $botSecureToken).Password
$hookUrl = 'https://stay-one-more-day.vercel.app/api/telegram'
try {
    $botInfo = Invoke-RestMethod -Method Post -Uri ('https://api.telegram.org/bot' + $botToken + '/getMe')
    if ($botInfo.result.username -ine 'StayOneMoreDayBot') { throw 'Unexpected bot' }
    $hookHmac = New-Object System.Security.Cryptography.HMACSHA256
    $hookHmac.Key = [System.Text.Encoding]::UTF8.GetBytes($botToken)
    $hookHash = $hookHmac.ComputeHash([System.Text.Encoding]::UTF8.GetBytes('stay-one-more-day:webhook:v1'))
    $hookSecret = ([System.BitConverter]::ToString($hookHash)).Replace('-', '').ToLowerInvariant()
    $hookHmac.Dispose()
    $hookReady = Invoke-RestMethod -Uri $hookUrl -Headers @{'X-Telegram-Bot-Api-Secret-Token'=$hookSecret}
    if ($hookReady.ready -ne $true) { throw 'Deploy first' }
    $hookBody = @{url=$hookUrl;secret_token=$hookSecret;max_connections=1;allowed_updates=@('message','callback_query')} | ConvertTo-Json -Compress
    $hookResult = Invoke-RestMethod -Method Post -Uri ('https://api.telegram.org/bot' + $botToken + '/setWebhook') -ContentType 'application/json' -Body $hookBody
    if ($hookResult.ok -ne $true) { throw 'Registration failed' }
    $hookInfo = Invoke-RestMethod -Method Post -Uri ('https://api.telegram.org/bot' + $botToken + '/getWebhookInfo')
    if ($hookInfo.result.url -ne $hookUrl) { throw 'Verification failed' }
    Write-Host 'Webhook connected. Open @StayOneMoreDayBot and send /start.'
} catch {
    Write-Host 'Setup failed. Deploy the latest project first; check the bot token and that the production endpoint is publicly reachable. No secrets were printed.'
    exit 1
} finally {
    $botToken=$null
    $botSecureToken=$null
    $hookSecret=$null
    $hookBody=$null
}
