$file = Get-ChildItem 'D:\TourAndTravel' -Recurse -File -ErrorAction SilentlyContinue | Where-Object { $_.Name -eq 'page.tsx' -and $_.FullName -match 'rides.*slug' -and $_.FullName -match '\(public\)' } | Select-Object -First 1
if ($file) {
    $content = [System.IO.File]::ReadAllText($file.FullName)
    Write-Host 'Original size:' $content.Length
    
    # Fix the pb-20 to pb-28
    $content = $content.Replace('min-h-screen pb-20', 'min-h-screen pb-28')
    
    # Add RideDetailClient before closing div tag
    $content = $content.Replace('    </div>', '      <RideDetailClient ride={ride} degraded={degraded} />' + [System.Environment]::NewLine + '    </div>')
    
    [System.IO.File]::WriteAllText($file.FullName, $content)
    
    $newContent = [System.IO.File]::ReadAllText($file.FullName)
    Write-Host 'Updated size:' $newContent.Length
    Write-Host 'Has pb-28:' ($newContent -match 'pb-28')
    Write-Host 'Has RideDetailClient usage:' ($newContent -match '<RideDetailClient')
}
