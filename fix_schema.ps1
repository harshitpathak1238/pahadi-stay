$path = "d:\TourAndTravel\prisma\schema.prisma"
$content = [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)
$old = "`thouseRules   Json?           @default(""[]"")`n`tstatus       ListingStatus    @default(DRAFT)"
$new = "`thouseRules   Json?           @default(""[]"")`n`taccommodations Json?          @default(""[]"")`n`tstatus       ListingStatus    @default(DRAFT)"
$content = $content -replace [regex]::Escape($old), $new
[System.IO.File]::WriteAllText($path, $content, [System.Text.Encoding]::UTF8)
Write-Output "Schema updated"



