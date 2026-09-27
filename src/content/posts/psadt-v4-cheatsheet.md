---
title: "PSAppDeployToolkit v4 Cheatsheet"
description: "A quick-reference cheatsheet of the most common PSAppDeployToolkit (PSADT) v4 commands used in real-world Intune and MECM deployments."
date: 2025-11-01
lastUpdated: 2026-09-27
author: Jeremy Boyes
categories: ["PSADT", "Packaging"]
tags: ["blog"]
---

PSAppDeployToolkit v4 introduces a fundamental shift in structure and command set compared to v3. Many engineers are still adapting to the differences. After recently transitioning to v4, I created this cheatsheet to capture the most common commands I use in real deployments.

## Commonly Used Variables

| PSADT Variable | Local PC Path | Comments |
| --- | --- | --- |
| `$envProgramFiles` | `C:\Program Files` | |
| `$envProgramFilesX86` | `C:\Program Files (x86)` | |
| `$envProgramData` | `C:\ProgramData` | |
| `$envUserName` | `%UserName%` | UserName for the user that ran PSADT |
| `$envUserProfile` | `C:\Users\%UserName%` | Path to User Profile for the user that ran PSADT |
| `$envCommonDesktop` | `C:\Users\Public\Desktop` | All Users Desktop |
| `$envCommonStartMenu` | `C:\ProgramData\Microsoft\Windows\Start Menu` | All Users Start Menu |
| `$envWinDir` | `C:\Windows` | |
| `$envSystemDrive` | `C:\` | |

### Notes

When PSADT is run via Intune, MECM etc., it will most typically run in System Context. This will result in the following:

- `$envUserName` = `SYSTEM`
- `$envUserProfile` = `C:\Windows\system32\config\systemprofile`


## Source File Location Variables (PSADT v4 vs v3)

| PSADT v4 | PSADT v3 | Location within Toolkit |
| --- | --- | --- |
| `$($adtSession.DirFiles)` | `$DirFiles` | `.\Files` |
| `$($adtSession.DirSupportFiles)` | `$DirSupportFiles` | `.\SupportFiles` |

## Install Applications

```powershell
# Install MSI, create Logfile
Start-ADTMsiProcess -Action 'Install' -FilePath 'MyApp_1.0.msi' -LogFileName "MyApp_1.0" -ArgumentList '/qn'
```

**Notes:** Default location for the MSI file is under `.\Files`

- The name you choose for the logfile will automatically have `_install.log` appended to it. E.g. if you specify `MyApp_install.log` it will become `MyApp_install.log_Install.log`.
- Default location for PSAppDeploy logfiles: `C:\Windows\Logs\Software`

> **Edit:** The Patch My PC team have reached out to me regarding the log file naming behaviour and are looking into potential enhancements for a future version of PSADT.

```powershell
# Install MSI with MST, create Logfile
Start-ADTMsiProcess -Action 'Install' -FilePath 'MyApp_1.0.msi' -Transforms 'MyApp_1.0.mst' -LogFileName "MyApp_1.0" -ArgumentList '/qn'
```

```powershell
# Run EXE Installation
Start-ADTProcess -FilePath "$($adtSession.DirFiles)\Setup.exe" -ArgumentList "/VERYSILENT /NORESTART" -WindowStyle 'Hidden'
```

## Check if a Specific Application is Installed

```powershell
# Check if any version of 7-Zip is installed
$7Zip_Installed = Get-ADTApplication -Name '7-Zip'
If ($7Zip_Installed)
{
    # 7-Zip is INSTALLED, perform related actions
}
Else
{
    # 7-Zip is NOT installed, perform related actions
}
```

```powershell
# Check if 7-Zip version 25.01 or higher is installed
$7Zip_NewInstalled = Get-ADTApplication -Name '7-Zip' -FilterScript { $_.DisplayVersion -ge 25.01 }
If ($7Zip_NewInstalled)
{
    # 7Zip v25.01 or HIGHER is INSTALLED, perform related actions
}
Else
{
    # Installed 7-Zip version is LOWER than v25.01
    # or, no installation exists
    # perform related actions
}
```

## Uninstall Applications

```powershell
# Remove all applications with an EXACT matching app name
# 'TeamViewer' will be uninstalled
# 'TeamViewer Host' will NOT be uninstalled
Uninstall-ADTApplication -Name 'TeamViewer' -NameMatch Exact
```

```powershell
# Remove all applications CONTAINING the specified app name (wildcard)
# Be careful with app name selection.
# E.g. Using: -Name 'Microsoft' will uninstall ALL Microsoft apps.
Uninstall-ADTApplication -Name '7-Zip'
```

```powershell
# Uninstall specific MSI via ProductCode
Start-ADTMsiProcess -Action 'Uninstall' -ProductCode '{23170F69-40C1-2702-2409-000001000000}' -LogFileName "7-Zip_24.09_x64" -ArgumentList '/QN'
```

## Handling Open Applications and Processes

```powershell
# Silently close single app/process (no prompt to user)
Show-ADTInstallationWelcome -CloseProcesses FortiClient -Silent
```

```powershell
# Silently close multiple apps/processes
Show-ADTInstallationWelcome -CloseProcesses Winword, excel -Silent
```

```powershell
# Show the user a prompt to close specific apps/processes if open
# (same as examples above, but with removed -Silent switch)
Show-ADTInstallationWelcome -CloseProcesses Winword, excel
```

## Add a Custom Entry to the PSAppDeploy Logfile

```powershell
# Note: Default folder for logs is: C:\Windows\Logs\Software
# Create custom entry
Write-ADTLogEntry -Message "This is a custom log entry"
```

## Copying and Deleting Files and Folders

```powershell
# Copy Single FILE (creates destination folder if not present)
# - Copies the file '.\Files\File.txt' into 'C:\Destination'
# - Overwrites destination file if it exists
Copy-ADTFile -Path "$($adtSession.DirFiles)\File.txt" -Destination 'C:\Destination\file.txt'
```

```powershell
# Copy single FILE '.\SupportFiles\test.txt' into 'C:\Temp'
Copy-ADTFile -Path "$($adtSession.DirSupportFiles)\test.txt" -Destination "C:\Temp"
```

```powershell
# Copy folder CONTENTS into destination folder recursively
# (creates destination folder if not present)

# Note: By default any existing files will be overwritten
# -ContinueFileCopyOnError = keep copying files if an error occurs
# (e.g. existing file in use)

Copy-ADTFile -Path "$($adtSession.DirFiles)\Prereq\cobol\*" -Destination "C:\cobol" -Recurse -ContinueFileCopyOnError
```

```powershell
# Delete Single File (AllUsers Start Menu Shortcut)
$StartMenuShortcut = "$envCommonStartMenu\Programs\RDC Manager.lnk"
If (Test-Path $StartMenuShortcut)
{
    Remove-ADTFile -Path $StartMenuShortcut -ErrorAction SilentlyContinue
}
```

```powershell
# Delete folder recursively
Remove-ADTFile -LiteralPath "$envProgramFiles\Reskit" -Recurse -ErrorAction SilentlyContinue
```

## Create a Shortcut

```powershell
# Create All Users Shortcut
$StartMenuShortcut = "$envProgramData\Microsoft\Windows\Start Menu\Programs\RDC Manager.lnk"
New-ADTShortcut -Path $StartMenuShortcut -TargetPath "$envProgramFiles\RDCMan\RDCMan.exe" -Description 'Remote Desktop Connection Manager'
```

## UserProfiles - Inject Registry Keys

```powershell
# Add/Delete HKCU RegKey from User Profiles
# takes effect immediately (user does not need to log off/on again)
# default is NOT to copy into System or Service Profiles

Invoke-ADTAllUsersRegistryAction -ScriptBlock {
    # Delete existing RegKey and contents
    Remove-ADTRegistryKey -Key 'HKCU\Software\MyOldApp' -Recurse -SID $_.SID

    # Add RegKey (Suppress License Agreement)
    Set-ADTRegistryKey -Key 'HKCU\Software\MyApp\Prefs' -Type 'String' -Name 'AcceptedEULA' -Value '1.0' -SID $_.SID
}
```

## UserProfiles - Inject Files

```powershell
# Copy file into User Profiles, creates destination folder if required
# takes effect immediately (user does not need to log off/on again)
# default is NOT to copy into System or Service Profiles

# Add preference file into UserProfiles
$PrefsFile = "$($adtSession.DirFiles)\UserProfile\AppPrefs.xml"
Copy-ADTFileToUserProfiles -Path $PrefsFile -Destination "AppData\Roaming\MyApp\" -ContinueFileCopyOnError
```

```powershell
# Copy Folder Contents into path under UserProfiles, recursively
$ConfigFolder = "$($adtSession.DirFiles)\UserProfile\AppConfig"
Copy-ADTFileToUserProfiles -Path $ConfigFolder\* -Destination "AppData\Roaming\MyApp\AppConfig" -Recurse -ContinueFileCopyOnError
```

## Wait for Process to Complete

```powershell
# Useful for an installation which launches asynchronously
# (doesn't wait for completion)
# The key switch is '-WaitForChildProcesses'
Start-ADTProcess -FilePath "Setup.exe" -ArgumentList "/VERYSILENT" -WaitForChildProcesses -WindowStyle 'Hidden'

# Alternatively, this is another option:
Get-Process -Name "setup" -ErrorAction SilentlyContinue | Wait-Process
```
