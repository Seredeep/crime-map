# Script robusto para desarrollo con hot reload (evita problemas de Gradle)
param(
    [int]$Port = 3000
)

Write-Host "=== DESARROLLO ROBUSTO CON HOT RELOAD ===" -ForegroundColor Green
Write-Host ""

# Verificar dependencias
Write-Host "1. Verificando dependencias..." -ForegroundColor Yellow
if (-not (Get-Command "node" -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Node.js no encontrado" -ForegroundColor Red
    exit 1
}
Write-Host "   Node.js encontrado" -ForegroundColor Green

# Limpiar Android antes de empezar (preventivo)
Write-Host ""
Write-Host "2. Limpieza preventiva de Android..." -ForegroundColor Yellow
$directories = @(
    "android\app\build",
    "android\build",
    "android\.gradle",
    "android\app\src\main\assets\public"
)

foreach ($dir in $directories) {
    if (Test-Path $dir) {
        try {
            Remove-Item -Recurse -Force $dir -ErrorAction SilentlyContinue
            Write-Host "   Limpiado: $dir" -ForegroundColor Green
        } catch {
            Write-Host "   Error limpiando: $dir" -ForegroundColor Red
        }
    }
}

# Configurar Capacitor
Write-Host ""
Write-Host "3. Configurando Capacitor..." -ForegroundColor Yellow
node scripts/setup-capacitor-dev.js dev $Port
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Fallo al configurar Capacitor" -ForegroundColor Red
    exit 1
}
Write-Host "   Capacitor configurado" -ForegroundColor Green

# Construir aplicación con limpieza previa
Write-Host ""
Write-Host "4. Construyendo aplicacion..." -ForegroundColor Yellow

# Limpiar Next.js antes del build
if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next" -ErrorAction SilentlyContinue
    Write-Host "   Cache de Next.js limpiado" -ForegroundColor Green
}

if (Test-Path "out") {
    Remove-Item -Recurse -Force "out" -ErrorAction SilentlyContinue
    Write-Host "   Directorio out limpiado" -ForegroundColor Green
}

npm run cap:build
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Fallo al construir la aplicacion" -ForegroundColor Red
    Write-Host "Ejecuta: npm run fix-gradle-issue" -ForegroundColor Yellow
    exit 1
}
Write-Host "   Aplicacion construida" -ForegroundColor Green

# Mostrar instrucciones
Write-Host ""
Write-Host "=== INSTRUCCIONES ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "PASO 1: Iniciar servidor de desarrollo" -ForegroundColor Yellow
Write-Host "  Abre una NUEVA terminal y ejecuta:" -ForegroundColor White
Write-Host "  npm run dev -- --port $Port --hostname 0.0.0.0" -ForegroundColor Green
Write-Host ""
Write-Host "  ESPERA hasta que aparezca:" -ForegroundColor White
Write-Host "  Ready in X.Xs" -ForegroundColor Green
Write-Host ""
Write-Host "PASO 2: Ejecutar en Android" -ForegroundColor Yellow
Write-Host "  En esta terminal, ejecuta:" -ForegroundColor White
Write-Host "  npx cap run android" -ForegroundColor Green
Write-Host ""
Write-Host "PASO 3: Si hay error de Gradle" -ForegroundColor Yellow
Write-Host "  Ejecuta: npm run fix-gradle-issue" -ForegroundColor White
Write-Host "  Luego: npm run dev:android:robust" -ForegroundColor White
Write-Host ""

# Preguntar si continuar
$response = Read-Host "Quieres continuar con npx cap run android? (s/n)"
if ($response -eq "s" -or $response -eq "S" -or $response -eq "y" -or $response -eq "Y") {
    Write-Host ""
    Write-Host "Ejecutando aplicacion en Android..." -ForegroundColor Green
    Write-Host "IMPORTANTE: Asegurate de que el servidor este corriendo en otra terminal" -ForegroundColor Yellow
    Write-Host ""
    
    npx cap run android
} else {
    Write-Host ""
    Write-Host "Ejecuta manualmente cuando el servidor este listo:" -ForegroundColor Yellow
    Write-Host "npx cap run android" -ForegroundColor White
}

Write-Host ""
Write-Host "=== COMANDOS UTILES ===" -ForegroundColor Cyan
Write-Host "Para limpiar la configuracion:" -ForegroundColor Yellow
Write-Host "npm run cap:restore" -ForegroundColor White
Write-Host ""
Write-Host "Para solucionar problemas de Gradle:" -ForegroundColor Yellow
Write-Host "npm run fix-gradle-issue" -ForegroundColor White
Write-Host ""
Write-Host "Para desarrollo robusto:" -ForegroundColor Yellow
Write-Host "npm run dev:android:robust" -ForegroundColor White
