while ($true) {
    git add .

    $changes = git status --porcelain
    if ($changes) {
        $msg = "Auto backup $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
        
        git commit -m "$msg"
        git pull --rebase
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Conflicto detectado. Resuélvelo manualmente."
            break
        }

        git push
        Write-Host "🚀 Backup automático hecho: $msg"
    } else {
        Write-Host "🟢 Sin cambios..."
    }

    Start-Sleep -Seconds 300  # 5 minutos
}