# Script para desarrollo en Android con Capacitor
# Inicia el servidor de desarrollo y abre Android Studio

Write-Host "🚀 Iniciando desarrollo para Android..." -ForegroundColor Cyan

# Verificar que el servidor no esté corriendo
$serverProcess = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*next dev*" }
if ($serverProcess) {
    Write-Host "⚠️  Servidor Next.js ya está corriendo (PID: $($serverProcess.Id))" -ForegroundColor Yellow
} else {
    Write-Host "🌐 Iniciando servidor de desarrollo..." -ForegroundColor Green
    Start-Process -FilePath "npm" -ArgumentList "run", "dev" -WindowStyle Minimized
    Start-Sleep -Seconds 5
}

# Sincronizar con Capacitor
Write-Host "📱 Sincronizando con Capacitor..." -ForegroundColor Yellow
cap sync

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Sincronización completada" -ForegroundColor Green

    # Abrir Android Studio
    Write-Host "🔧 Abriendo Android Studio..." -ForegroundColor Cyan
    cap open android

    Write-Host ""
    Write-Host "🎯 Configuración completada!" -ForegroundColor Green
    Write-Host "📋 Pasos siguientes:" -ForegroundColor White
    Write-Host "1. En Android Studio, espera a que se sincronice el proyecto" -ForegroundColor Gray
    Write-Host "2. Conecta tu dispositivo Android o inicia un emulador" -ForegroundColor Gray
    Write-Host "3. Presiona el botón 'Run' (▶️) en Android Studio" -ForegroundColor Gray
    Write-Host "4. La app se instalará y abrirá automáticamente" -ForegroundColor Gray
    Write-Host ""
    Write-Host "🌐 Servidor: http://192.168.0.97:3000" -ForegroundColor Cyan
    Write-Host "📱 Asegúrate de que tu dispositivo esté en la misma red WiFi" -ForegroundColor Yellow
} else {
    Write-Host "❌ Error en la sincronización" -ForegroundColor Red
    exit 1
}
