# Local static server for Maloy OS (runs on this computer only). ASCII only on purpose.
$port = 8765
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$mime = @{ '.html'='text/html; charset=utf-8'; '.json'='application/json'; '.js'='application/javascript'; '.png'='image/png'; '.css'='text/css' }
$l = New-Object System.Net.HttpListener
$l.Prefixes.Add("http://localhost:$port/")
try { $l.Start() } catch {
  Write-Host "Port $port is busy (the server may already be running). Opening the app..."
  Start-Process "http://localhost:$port/index.html"
  Start-Sleep -Seconds 3
  exit
}
Write-Host "Maloy OS is running at http://localhost:$port/index.html"
Write-Host "Keep this window open while you install the app. Close it when done."
Start-Process "http://localhost:$port/index.html"
while ($l.IsListening) {
  $c = $l.GetContext()
  $p = [Uri]::UnescapeDataString($c.Request.Url.LocalPath.TrimStart('/'))
  if ($p -eq '') { $p = 'index.html' }
  $f = [IO.Path]::GetFullPath((Join-Path $root ($p -replace '/', '\')))
  if ($f.StartsWith($root) -and (Test-Path $f -PathType Leaf)) {
    $b = [IO.File]::ReadAllBytes($f)
    $e = [IO.Path]::GetExtension($f).ToLower()
    if ($mime.ContainsKey($e)) { $c.Response.ContentType = $mime[$e] } else { $c.Response.ContentType = 'application/octet-stream' }
    $c.Response.ContentLength64 = $b.Length
    $c.Response.OutputStream.Write($b, 0, $b.Length)
  } else { $c.Response.StatusCode = 404 }
  $c.Response.Close()
}
