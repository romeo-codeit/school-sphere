Param(
  [string]$WorkingDir = "C:\Users\romeo\Downloads\dev\SchoolSphere"
)

# Run a one-off backup with npm
try {
  Set-Location -Path $WorkingDir
  npm run backup:db
  if ($LASTEXITCODE -ne 0) {
    Write-Error "Backup failed with exit code $LASTEXITCODE"
    exit $LASTEXITCODE
  }
  Write-Host "Backup completed successfully." -ForegroundColor Green
} catch {
  Write-Error $_
  exit 1
}
