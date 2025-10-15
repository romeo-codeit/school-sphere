Param(
  [string]$TaskName = "SchoolSphere Nightly Backup",
  [string]$WorkingDir = "C:\Users\romeo\Downloads\dev\SchoolSphere",
  [string]$Time = "02:00"
)

# Create or update a scheduled task that runs daily at the specified time
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$WorkingDir\scripts\windows\run-backup.ps1`" -WorkingDirectory "$WorkingDir"
$trigger = New-ScheduledTaskTrigger -Daily -At $Time
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries

try {
  if (Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue) {
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
  }
  Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings -Description "Runs npm backup:db nightly" | Out-Null
  Write-Host "Scheduled task '$TaskName' created to run daily at $Time." -ForegroundColor Green
} catch {
  Write-Error $_
  exit 1
}
