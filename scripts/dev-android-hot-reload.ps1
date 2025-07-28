# Script para desarrollo con hot reload en Android
# Uso: .\dev-android-hot-reload.ps1 [puerto]

param(
    [int]$Port = 3000
)

Write-Host "Iniciando desarrollo con hot reload para Android..." -ForegroundColor Green
Write-Host ""

# Función para verificar si un comando existe
function Test-Command($cmdname) {
    return [bool](Get-Command -Name $cmdname -ErrorAction SilentlyContinue)
}

# Verificar dependencias
Write-Host "Verificando dependencias..." -ForegroundColor Yellow

if (-not (Test-Command "node")) {
    Write-Host "ERROR: Node.js no esta instalado o no esta en el PATH" -ForegroundColor Red
    exit 1
}

if (-not (Test-Command "npx")) {
    Write-Host "ERROR: npx no esta disponible" -ForegroundColor Red
    exit 1
}

Write-Host "Dependencias verificadas" -ForegroundColor Green

# Configurar Capacitor para desarrollo
Write-Host ""
Write-Host "Configurando Capacitor para desarrollo..." -ForegroundColor Yellow
node scripts/setup-capacitor-dev.js dev $Port

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Error configurando Capacitor" -ForegroundColor Red
    exit 1
}

# Iniciar servidor de desarrollo
Write-Host ""
Write-Host "Iniciando servidor de desarrollo en puerto $Port..." -ForegroundColor Yellow
Write-Host "El servidor estara disponible en: http://0.0.0.0:$Port" -ForegroundColor Cyan

# Iniciar servidor en una nueva ventana de PowerShell
$serverProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PWD'; `$env:CAPACITOR_BUILD='true'; npm run dev -- --port $Port --hostname 0.0.0.0" -PassThru

# Esperar un momento para que el servidor inicie
Start-Sleep -Seconds 8

# Verificar si el servidor está corriendo
$serverRunning = $false
$attempts = 0
$maxAttempts = 15

while (-not $serverRunning -and $attempts -lt $maxAttempts) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$Port" -TimeoutSec 3 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            $serverRunning = $true
            Write-Host "Servidor iniciado correctamente" -ForegroundColor Green
        }
    } catch {
        $attempts++
        Write-Host "Esperando servidor... (intento $attempts/$maxAttempts)" -ForegroundColor Yellow
        Start-Sleep -Seconds 2
    }
}

if (-not $serverRunning) {
    Write-Host "ERROR: No se pudo iniciar el servidor" -ForegroundColor Red
    Write-Host "Verifica que el puerto $Port no este en uso" -ForegroundColor Yellow
    Write-Host "Intenta ejecutar manualmente: npm run dev -- --port $Port --hostname 0.0.0.0" -ForegroundColor Yellow

    # Terminar proceso del servidor si existe
    if ($serverProcess -and -not $serverProcess.HasExited) {
        $serverProcess.Kill()
    }
    exit 1
}

# Construir y sincronizar Capacitor
Write-Host ""
Write-Host "Construyendo aplicacion para Android..." -ForegroundColor Yellow
npm run cap:build

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Error construyendo la aplicacion" -ForegroundColor Red
    if ($serverProcess -and -not $serverProcess.HasExited) {
        $serverProcess.Kill()
    }
    exit 1
}

# Ejecutar en Android
Write-Host ""
Write-Host "Ejecutando aplicacion en Android..." -ForegroundColor Yellow
Write-Host "Asegurate de tener un dispositivo/emulador conectado" -ForegroundColor Cyan
Write-Host "Los cambios se reflejaran automaticamente" -ForegroundColor Cyan

npx cap run android

# Limpiar al salir
Write-Host ""
Write-Host "Limpiando..." -ForegroundColor Yellow

# Detener el servidor
if ($serverProcess -and -not $serverProcess.HasExited) {
    Write-Host "Deteniendo servidor..." -ForegroundColor Yellow
    $serverProcess.Kill()
}

# Restaurar configuración original
node scripts/setup-capacitor-dev.js restore

Write-Host "Desarrollo finalizado" -ForegroundColor Green
