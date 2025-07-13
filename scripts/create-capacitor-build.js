const fs = require('fs');
const path = require('path');

// Crear directorio out si no existe
const outDir = path.join(__dirname, '..', 'out');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Crear index.html básico
const indexHtml = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Claridad - Seguridad Vecinal</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #040910 0%, #1a202c 100%);
            color: white;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
        }
        .container {
            text-align: center;
            padding: 2rem;
        }
        .logo {
            font-size: 2.5rem;
            font-weight: bold;
            color: #B5CCF4;
            margin-bottom: 1rem;
            text-shadow: 0 0 12px rgba(140,200,255,0.8);
        }
        .subtitle {
            font-size: 1.2rem;
            color: #94a3b8;
            margin-bottom: 2rem;
        }
        .message {
            font-size: 1rem;
            color: #64748b;
            margin-bottom: 1rem;
        }
        .spinner {
            border: 3px solid #374151;
            border-top: 3px solid #B5CCF4;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 1rem;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">Claridad</div>
        <div class="subtitle">Seguridad Vecinal</div>
        <div class="spinner"></div>
        <div class="message">Cargando aplicación...</div>
        <div class="message" style="font-size: 0.9rem; margin-top: 2rem;">
            Para desarrollo, inicia el servidor Next.js con <code>npm run dev</code>
        </div>
    </div>

    <script>
        // Intentar conectar con el servidor de desarrollo
        setTimeout(() => {
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                // En desarrollo, redirigir al servidor Next.js
                window.location.href = 'http://localhost:3000';
            } else {
                // En producción, mostrar mensaje
                document.querySelector('.message').textContent = 'Aplicación lista para usar';
                document.querySelector('.spinner').style.display = 'none';
            }
        }, 2000);
    </script>
</body>
</html>`;

// Escribir el archivo
fs.writeFileSync(path.join(outDir, 'index.html'), indexHtml);

console.log('✅ Archivo index.html creado en el directorio out/');
console.log('🔧 Configuración de Capacitor lista para sincronizar');
