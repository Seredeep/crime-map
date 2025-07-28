# Script para solucionar el problema recurrente de Gradle
Write-Host "Solucionando problema recurrente de Gradle..." -ForegroundColor Yellow

# 1. Detener todos los procesos de Java/Gradle
Write-Host "1. Deteniendo procesos de Java/Gradle..." -ForegroundColor Cyan
Get-Process -Name "java" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Process -Name "gradle" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

Start-Sleep -Seconds 3

# 2. Limpiar completamente Android
Write-Host "2. Limpiando Android completamente..." -ForegroundColor Cyan
$directories = @(
    "android\app\build",
    "android\build",
    "android\.gradle",
    "android\app\src\main\assets\public",
    "android\app\src\main\assets\public\*"
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

# 3. Limpiar cache de Gradle
Write-Host "3. Limpiando cache de Gradle..." -ForegroundColor Cyan
$gradleCache = "$env:USERPROFILE\.gradle\caches"
if (Test-Path $gradleCache) {
    try {
        Remove-Item -Recurse -Force $gradleCache -ErrorAction Stop
        Write-Host "  Cache de Gradle eliminado" -ForegroundColor Green
    } catch {
        Write-Host "  Error eliminando cache de Gradle" -ForegroundColor Red
    }
}

# 4. Limpiar cache de npm
Write-Host "4. Limpiando cache de npm..." -ForegroundColor Cyan
npm cache clean --force
Write-Host "  Cache de npm limpiado" -ForegroundColor Green

# 5. Reconstruir desde cero
Write-Host "5. Reconstruyendo proyecto..." -ForegroundColor Cyan

# Limpiar Next.js
if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next" -ErrorAction SilentlyContinue
    Write-Host "  Cache de Next.js eliminado" -ForegroundColor Green
}

if (Test-Path "out") {
    Remove-Item -Recurse -Force "out" -ErrorAction SilentlyContinue
    Write-Host "  Directorio out eliminado" -ForegroundColor Green
}

# 6. Reinstalar dependencias si es necesario
Write-Host "6. Verificando dependencias..." -ForegroundColor Cyan
if (-not (Test-Path "node_modules")) {
    Write-Host "  Reinstalando dependencias..." -ForegroundColor Yellow
    npm install
} else {
    Write-Host "  Dependencias OK" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== SOLUCION APLICADA ===" -ForegroundColor Green
Write-Host "Ahora ejecuta:" -ForegroundColor Yellow
Write-Host "  npm run cap:build" -ForegroundColor White
Write-Host "  npm run dev:android:simple" -ForegroundColor White
Write-Host ""
Write-Host "Si el problema persiste, ejecuta:" -ForegroundColor Yellow
Write-Host "  npm run fix-gradle-issue" -ForegroundColor White
