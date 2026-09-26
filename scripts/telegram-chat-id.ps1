$ErrorActionPreference = 'Stop'
$telegramSecureToken = Read-Host 'Paste BotFather token (hidden)' -AsSecureString
$telegramToken = [System.Net.NetworkCredential]::new('', $telegramSecureToken).Password
try {
    $telegramBot = Invoke-RestMethod -Method Post -Uri ('https://api.telegram.org/bot' + $telegramToken + '/getMe')
    if ($telegramBot.result.username -ine 'StayOneMoreDayBot') { throw 'Unexpected bot' }
    $telegramCode = '/connect_' + [guid]::NewGuid().ToString('N').Substring(0, 12)
    Write-Host ('Open https://t.me/StayOneMoreDayBot, press Start, then send: ' + $telegramCode)
    Read-Host 'Press Enter AFTER sending that command from your own Telegram account' | Out-Null
    $telegramUpdates = Invoke-RestMethod -Method Post -Uri ('https://api.telegram.org/bot' + $telegramToken + '/getUpdates') -Body @{limit=100;timeout=0}
    $telegramMatch = @($telegramUpdates.result | Where-Object { $_.message.chat.type -eq 'private' -and $_.message.text -eq $telegramCode })
    if ($telegramMatch.Count -ne 1) { Write-Host 'No unique matching message found. Run this script again and send the new command.'; exit 1 }
    Write-Host ('TELEGRAM_CHAT_ID=' + $telegramMatch[0].message.chat.id)
} catch {
    Write-Host 'Could not verify the bot or read the message. Check the token and connection. No token or Telegram messages were printed.'
    exit 1
} finally {
    $telegramToken = $null
    $telegramSecureToken = $null
    $telegramUpdates = $null
}
