# Script simplificado para desarrollo con hot reload en Android
# Uso: .\dev-android-simple.ps1 [puerto]

param(
    [int]$Port = 3000
)

Write-Host "=== DESARROLLO CON HOT RELOAD PARA ANDROID ===" -ForegroundColor Green
Write-Host ""

# Verificar dependencias
Write-Host "1. Verificando dependencias..." -ForegroundColor Yellow
if (-not (Get-Command "node" -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Node.js no encontrado" -ForegroundColor Red
    exit 1
}
Write-Host "   Node.js encontrado" -ForegroundColor Green

# Configurar Capacitor
Write-Host ""
Write-Host "2. Configurando Capacitor..." -ForegroundColor Yellow
node scripts/setup-capacitor-dev.js dev $Port
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Fallo al configurar Capacitor" -ForegroundColor Red
    exit 1
}
Write-Host "   Capacitor configurado" -ForegroundColor Green

# Construir aplicación
Write-Host ""
Write-Host "3. Construyendo aplicacion..." -ForegroundColor Yellow
npm run cap:build
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Fallo al construir la aplicacion" -ForegroundColor Red
    exit 1
}
Write-Host "   Aplicacion construida" -ForegroundColor Green

# Mostrar instrucciones
Write-Host ""
Write-Host "=== INSTRUCCIONES ===" -ForegroundColor Cyan
Write-Host "1. Abre una NUEVA terminal y ejecuta:" -ForegroundColor White
Write-Host "   npm run dev -- --port $Port --hostname 0.0.0.0" -ForegroundColor Yellow
Write-Host ""
Write-Host "2. Espera a que el servidor inicie (deberia mostrar 'Ready')" -ForegroundColor White
Write-Host ""
Write-Host "3. En esta terminal, ejecuta:" -ForegroundColor White
Write-Host "   npx cap run android" -ForegroundColor Yellow
Write-Host ""
Write-Host "4. Para detener, presiona Ctrl+C en ambas terminales" -ForegroundColor White
Write-Host ""

# Preguntar si continuar
$response = Read-Host "¿Quieres continuar con npx cap run android? (s/n)"
if ($response -eq "s" -or $response -eq "S" -or $response -eq "y" -or $response -eq "Y") {
    Write-Host ""
    Write-Host "Ejecutando aplicacion en Android..." -ForegroundColor Green
    npx cap run android
} else {
    Write-Host ""
    Write-Host "Ejecuta manualmente: npx cap run android" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Para limpiar la configuracion:" -ForegroundColor Yellow
Write-Host "npm run cap:restore" -ForegroundColor White
