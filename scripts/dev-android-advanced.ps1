# Script avanzado para desarrollo con hot reload
param(
    [int]$Port = 3000
)

Write-Host "=== DESARROLLO AVANZADO CON HOT RELOAD ===" -ForegroundColor Green
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

# Mostrar instrucciones detalladas
Write-Host ""
Write-Host "=== INSTRUCCIONES DETALLADAS ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "PASO 1: Iniciar servidor de desarrollo" -ForegroundColor Yellow
Write-Host "  Abre una NUEVA terminal y ejecuta:" -ForegroundColor White
Write-Host "  npm run dev -- --port $Port --hostname 0.0.0.0" -ForegroundColor Green
Write-Host ""
Write-Host "  ESPERA hasta que aparezca:" -ForegroundColor White
Write-Host "  ✓ Ready in X.Xs" -ForegroundColor Green
Write-Host ""
Write-Host "PASO 2: Ejecutar en Android" -ForegroundColor Yellow
Write-Host "  En esta terminal, ejecuta:" -ForegroundColor White
Write-Host "  npx cap run android" -ForegroundColor Green
Write-Host ""
Write-Host "PASO 3: Desarrollo" -ForegroundColor Yellow
Write-Host "  • Haz cambios en tu código" -ForegroundColor White
Write-Host "  • Los cambios se reflejan automaticamente" -ForegroundColor White
Write-Host "  • NO cierres las terminales durante el desarrollo" -ForegroundColor White
Write-Host ""
Write-Host "PASO 4: Finalizar" -ForegroundColor Yellow
Write-Host "  • Presiona Ctrl+C en AMBAS terminales" -ForegroundColor White
Write-Host "  • Ejecuta: npm run cap:restore" -ForegroundColor White
Write-Host ""

# Preguntar si continuar
$response = Read-Host "¿Quieres continuar con npx cap run android? (s/n)"
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
Write-Host "Para limpiar Android si hay problemas:" -ForegroundColor Yellow
Write-Host "npm run clean:android" -ForegroundColor White
Write-Host ""
Write-Host "Para ver logs de Android:" -ForegroundColor Yellow
Write-Host "adb logcat | grep -i capacitor" -ForegroundColor White
