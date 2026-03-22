$body = @{
  name = "Teste"
  email = "teste+1@fermas.com"
  password = "Senha123!"
} | ConvertTo-Json

try {
  Invoke-RestMethod -Uri "http://localhost:3000/api/auth/register" `
    -Method Post `
    -ContentType "application/json" `
    -Body $body `
    -TimeoutSec 10
} catch {
  Write-Host $_.Exception.Message
  if ($_.Exception.Response) {
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    $bodyText = $reader.ReadToEnd()
    Write-Host $bodyText
  } elseif ($_.ErrorDetails) {
    Write-Host $_.ErrorDetails.Message
  }
}
