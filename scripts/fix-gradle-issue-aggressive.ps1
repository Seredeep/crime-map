# Solución AGRESIVA para problemas de Gradle en Windows
Write-Host "=== SOLUCION AGRESIVA PARA GRADLE ===" -ForegroundColor Red
Write-Host ""

# 1. Detener TODOS los procesos relacionados
Write-Host "1. Deteniendo TODOS los procesos..." -ForegroundColor Yellow
Get-Process -Name "java" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Process -Name "gradle" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Process -Name "adb" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Process -Name "studio64" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

Start-Sleep -Seconds 5

# 2. Limpiar TODOS los directorios de build
Write-Host "2. Limpiando TODOS los directorios de build..." -ForegroundColor Yellow

$directories = @(
    "android\app\build",
    "android\build",
    "android\.gradle",
    "android\app\src\main\assets\public",
    "node_modules\@capacitor\camera\android\build",
    "node_modules\@capacitor\app\android\build",
    "node_modules\@capacitor\android\capacitor\build",
    "node_modules\@capacitor\geolocation\android\build",
    "node_modules\@capacitor\keyboard\android\build",
    "node_modules\@capacitor\local-notifications\android\build",
    "node_modules\@capacitor\splash-screen\android\build",
    "node_modules\@capacitor\status-bar\android\build"
)

foreach ($dir in $directories) {
    if (Test-Path $dir) {
        try {
            # Forzar eliminación con robocopy (técnica de Windows)
            $tempDir = "temp_delete_$(Get-Random)"
            robocopy $dir $tempDir /MOVE /E /NFL /NDL /NJH /NJS /NC /NS /NP
            if (Test-Path $tempDir) {
                Remove-Item -Recurse -Force $tempDir -ErrorAction SilentlyContinue
            }
            Write-Host "  Eliminado: $dir" -ForegroundColor Green
        } catch {
            Write-Host "  Error eliminando: $dir" -ForegroundColor Red
        }
    }
}

# 3. Limpiar cache de Gradle completamente
Write-Host "3. Limpiando cache de Gradle..." -ForegroundColor Yellow
$gradleCache = "$env:USERPROFILE\.gradle"
if (Test-Path $gradleCache) {
    try {
        Remove-Item -Recurse -Force $gradleCache -ErrorAction Stop
        Write-Host "  Cache de Gradle eliminado completamente" -ForegroundColor Green
    } catch {
        Write-Host "  Error eliminando cache de Gradle" -ForegroundColor Red
    }
}

# 4. Limpiar cache de npm
Write-Host "4. Limpiando cache de npm..." -ForegroundColor Yellow
npm cache clean --force
Write-Host "  Cache de npm limpiado" -ForegroundColor Green

# 5. Limpiar Next.js
Write-Host "5. Limpiando Next.js..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next" -ErrorAction SilentlyContinue
    Write-Host "  Cache de Next.js eliminado" -ForegroundColor Green
}

if (Test-Path "out") {
    Remove-Item -Recurse -Force "out" -ErrorAction SilentlyContinue
    Write-Host "  Directorio out eliminado" -ForegroundColor Green
}

# 6. Reinstalar dependencias si es necesario
Write-Host "6. Verificando dependencias..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules")) {
    Write-Host "  Reinstalando dependencias..." -ForegroundColor Yellow
    npm install
} else {
    Write-Host "  Dependencias OK" -ForegroundColor Green
}

# 7. Forzar limpieza de Android Studio
Write-Host "7. Limpieza de Android Studio..." -ForegroundColor Yellow
if (Test-Path "android\app\src\main\assets\public") {
    Remove-Item -Recurse -Force "android\app\src\main\assets\public" -ErrorAction SilentlyContinue
    Write-Host "  Assets de Android limpiados" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== SOLUCION AGRESIVA APLICADA ===" -ForegroundColor Green
Write-Host "Ahora ejecuta:" -ForegroundColor Yellow
Write-Host "  npm run dev:android:robust" -ForegroundColor White
Write-Host ""
Write-Host "Si el problema persiste:" -ForegroundColor Yellow
Write-Host "  1. Reinicia Android Studio" -ForegroundColor White
Write-Host "  2. Reinicia el emulador" -ForegroundColor White
Write-Host "  3. Ejecuta: npm run fix-gradle-issue-aggressive" -ForegroundColor White
