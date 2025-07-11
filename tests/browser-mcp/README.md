# BrowserMCP Tests para AnimaGen

Este directorio contiene tests automatizados usando BrowserMCP para validar las mejoras de UI/UX implementadas en el componente ImageUpload.

## 🎯 Objetivo

Validar automáticamente las mejoras específicas que implementamos:

1. **Zonas de hover separadas**: Verificar que el botón "+" y el botón de eliminar aparecen en zonas específicas
2. **Funcionalidad del botón eliminar**: Confirmar que elimina imágenes correctamente
3. **Prevención de conflictos**: Asegurar que las acciones no interfieren entre sí
4. **Consistencia visual**: Validar que los elementos se ven correctamente

## 🚀 Instalación y Configuración

### Prerrequisitos

1. **BrowserMCP Server** (ya instalado):
   ```bash
   npm install -g @agent-infra/mcp-server-browser
   ```

2. **AnimaGen ejecutándose**:
   ```bash
   npm run dev
   ```

### Ejecutar Tests

```bash
# Ejecutar todos los tests de UI
npm run test:ui

# Ejecutar específicamente tests de ImageUpload
npm run test:imageupload

# Ejecutar tests de browser directamente
npm run test:browser
```

## 📋 Tests Implementados

### 1. **Separated Hover Zones Test**
- **Objetivo**: Verificar que solo aparece un botón a la vez
- **Validaciones**:
  - Hover en área principal → Solo botón "+" visible
  - Hover en esquina → Solo botón eliminar visible
  - No superposición de botones

### 2. **Remove Button Functionality Test**
- **Objetivo**: Confirmar que el botón eliminar funciona correctamente
- **Validaciones**:
  - Click en botón eliminar → Imagen se remueve de la lista
  - No se activa "agregar a timeline"
  - Contador de imágenes se actualiza correctamente

### 3. **Add to Timeline Functionality Test**
- **Objetivo**: Verificar que agregar a timeline sigue funcionando
- **Validaciones**:
  - Click en área principal → Imagen se agrega al timeline
  - Contador de timeline se actualiza
  - No interfiere con funcionalidad de eliminar

### 4. **Visual Consistency Test**
- **Objetivo**: Documentar visualmente los estados
- **Validaciones**:
  - Captura screenshots de todos los estados de hover
  - Verifica posicionamiento correcto de elementos
  - Documenta la experiencia visual

## 📁 Estructura de Archivos

```
tests/browser-mcp/
├── README.md                           # Este archivo
├── image-upload-improvements.test.js   # Tests principales
├── run-tests.js                       # Runner de tests
└── screenshots/                       # Screenshots generados
    ├── add-button-hover.png
    ├── remove-button-hover.png
    └── no-hover-state.png
```

## 🔧 Configuración

### mcp-config.json
```json
{
  "mcpServers": {
    "browser": {
      "command": "npx",
      "args": ["@agent-infra/mcp-server-browser"],
      "env": {
        "BROWSER_TYPE": "chromium",
        "HEADLESS": "false"
      }
    }
  }
}
```

## 📊 Interpretación de Resultados

### Estados de Test
- ✅ **PASSED**: Test ejecutado exitosamente
- ❌ **FAILED**: Test falló, revisar detalles
- ⏳ **PENDING**: Test en ejecución

### Ejemplo de Output
```
🧪 Running ImageUpload improvement tests...
  📋 Testing separated hover zones...
    🌐 Navigating to AnimaGen app...
    🖼️  Checking for uploaded images...
    🎯 Testing main area hover (add button)...
    🎯 Testing corner area hover (remove button)...
  ✅ Separated hover zones test passed

📊 Test Results Summary:
========================
✅ Separated Hover Zones: PASSED
    Main area hover: ✅ Add button appears, remove button hidden
    Corner area hover: ✅ Remove button appears, add button hidden
```

## 🐛 Troubleshooting

### Problemas Comunes

1. **"MCP Server not starting"**
   - Verificar que @agent-infra/mcp-server-browser está instalado
   - Comprobar que no hay otros procesos usando el puerto

2. **"App not accessible"**
   - Asegurar que AnimaGen está ejecutándose en localhost:3000
   - Verificar que el frontend está compilado y servido

3. **"Images not found"**
   - Los tests asumen que hay imágenes cargadas
   - Cargar al menos una imagen antes de ejecutar tests

### Debug Mode

Para ejecutar con más información de debug:
```bash
DEBUG=true npm run test:browser
```

## 🔄 Integración Continua

Estos tests están diseñados para:
- Ejecutarse después de cambios en el componente ImageUpload
- Validar que las mejoras siguen funcionando
- Generar documentación visual automática
- Detectar regresiones en la funcionalidad

## 📝 Próximos Pasos

1. **Integrar con CI/CD**: Ejecutar automáticamente en cada PR
2. **Expandir cobertura**: Agregar tests para otros componentes
3. **Performance testing**: Medir tiempos de respuesta de hover
4. **Cross-browser testing**: Validar en diferentes navegadores
