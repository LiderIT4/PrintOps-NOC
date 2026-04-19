while ($true) {
    git add .

    $changes = git status --porcelain
    if ($changes) {

        Write-Host "Escribe un mensaje para el commit (Enter = automático):"
        $userMsg = Read-Host

        if ([string]::IsNullOrWhiteSpace($userMsg)) {
            $msg = "Auto backup $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
        } else {
            $msg = $userMsg
        }

        git commit -m "$msg"
        git pull --rebase
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Conflicto detectado. Resuélvelo manualmente."
            break
        }

        git push
        Write-Host "Backup hecho: $msg"
    } else {
        Write-Host "Sin cambios..."
    }

    Start-Sleep -Seconds 300  # 5 minutos
}