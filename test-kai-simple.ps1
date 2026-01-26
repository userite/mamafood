$url = "https://mamafood.onrender.com/api/records/KAI"
Write-Host "Testing: $url"
try {
    $response = Invoke-WebRequest -Uri $url -UseBasicParsing
    Write-Host "Status: $($response.StatusCode)"
    Write-Host "Response:"
    Write-Host $response.Content
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response body: $responseBody"
    }
}

