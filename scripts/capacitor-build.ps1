# Script de build para Capacitor
# Limpia directorios problematicos y hace el build

Write-Host "Limpiando archivos temporales..." -ForegroundColor Yellow

# Limpiar directorio .next
if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next" -ErrorAction SilentlyContinue
    Write-Host "Directorio .next limpiado" -ForegroundColor Green
}

# Limpiar directorio out
if (Test-Path "out") {
    Remove-Item -Recurse -Force "out" -ErrorAction SilentlyContinue
    Write-Host "Directorio out limpiado" -ForegroundColor Green
}

Write-Host "Creando estructura basica para Capacitor..." -ForegroundColor Yellow

# Crear directorio out con index.html
node scripts/create-capacitor-build.js

Write-Host "Sincronizando con Capacitor..." -ForegroundColor Yellow
npx cap sync

if ($LASTEXITCODE -eq 0) {
    Write-Host "Sincronizacion completada" -ForegroundColor Green
    Write-Host "Build de Capacitor listo!" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Para desarrollo:" -ForegroundColor White
    Write-Host "1. Ejecuta: npm run dev" -ForegroundColor Gray
    Write-Host "2. Abre Android Studio: npm run cap:android" -ForegroundColor Gray
    Write-Host "3. Abre Xcode: npm run cap:ios" -ForegroundColor Gray
} else {
    Write-Host "Error en sincronizacion" -ForegroundColor Red
    exit 1
}
