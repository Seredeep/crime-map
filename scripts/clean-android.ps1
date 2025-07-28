# Script para limpiar completamente Android
Write-Host "Limpiando archivos de build de Android..." -ForegroundColor Yellow

# Detener procesos de Gradle si están corriendo
Write-Host "Deteniendo procesos de Gradle..." -ForegroundColor Cyan
Get-Process -Name "java" -ErrorAction SilentlyContinue | Where-Object {$_.ProcessName -eq "java"} | Stop-Process -Force -ErrorAction SilentlyContinue

# Esperar un momento
Start-Sleep -Seconds 2

# Limpiar directorios de build
Write-Host "Eliminando directorios de build..." -ForegroundColor Cyan

$directories = @(
    "android\app\build",
    "android\build",
    "android\.gradle",
    "android\app\src\main\assets\public"
)

foreach ($dir in $directories) {
    if (Test-Path $dir) {
        try {
            Remove-Item -Recurse -Force $dir -ErrorAction Stop
            Write-Host "  Eliminado: $dir" -ForegroundColor Green
        } catch {
            Write-Host "  Error eliminando: $dir" -ForegroundColor Red
        }
    }
}

# Limpiar cache de Gradle
Write-Host "Limpiando cache de Gradle..." -ForegroundColor Cyan
if (Test-Path "$env:USERPROFILE\.gradle\caches") {
    try {
        Remove-Item -Recurse -Force "$env:USERPROFILE\.gradle\caches" -ErrorAction Stop
        Write-Host "  Cache de Gradle eliminado" -ForegroundColor Green
    } catch {
        Write-Host "  Error eliminando cache de Gradle" -ForegroundColor Red
    }
}

Write-Host "Limpieza completada!" -ForegroundColor Green
Write-Host ""
Write-Host "Ahora puedes ejecutar:" -ForegroundColor Yellow
Write-Host "  npm run cap:build" -ForegroundColor White
Write-Host "  npm run dev:android:simple" -ForegroundColor White
