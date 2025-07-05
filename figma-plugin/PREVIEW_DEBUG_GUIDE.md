# 🔍 Guía de Debug del Preview

## ❓ Problemas Comunes del Preview

### 1. ✅ **Backend No Ejecutándose**
```bash
# En el directorio backend/
npm start
```
**Verificar**: `curl http://localhost:3001/api/health`

### 2. ✅ **Endpoint Preview Existe**
El endpoint `/preview` está implementado en `backend/index.js:892`

### 3. 🔧 **Condiciones para Preview**
El preview se habilita cuando:
```javascript
const canGeneratePreview = Boolean(
  !previewState.isGenerating &&    // No generando actualmente
  project.timeline.length > 0 &&   // Hay frames en timeline
  !isUploading &&                  // No subiendo imágenes
  sessionId                         // Hay sesión activa
);
```

## 🐛 **Debugging Step by Step**

### Paso 1: Verificar Backend
```bash
# Backend ejecutándose?
curl http://localhost:3001/api/health

# Endpoint preview disponible?
curl -X POST http://localhost:3001/preview \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"test","images":[],"transitions":[],"frameDurations":[]}'
```

### Paso 2: Verificar SessionId
En el plugin:
1. **Cargar frames** desde Figma
2. **Esperar upload** completo
3. **Verificar console**: Debe mostrar sessionId
4. **Botón Preview**: Debe estar habilitado

### Paso 3: Verificar Payload del Preview
Abrir Developer Console en Figma:
```javascript
// Buscar este log:
"🔍 Preview payload being sent:"
```

### Paso 4: Verificar Response del Backend
En el backend debe aparecer:
```
🔍 Preview request received: { sessionId: "...", ... }
```

## 🔧 **Problemas Específicos y Soluciones**

### ❌ "No session ID. Upload images first."
**Causa**: No hay sessionId
**Solución**: 
1. Seleccionar frames en Figma
2. Hacer clic en "Refresh" 
3. Esperar que termine la subida
4. Verificar sessionId en console

### ❌ "No images in timeline."
**Causa**: Timeline vacío
**Solución**:
1. Agregar frames al timeline
2. Verificar que `project.timeline.length > 0`

### ❌ "X images missing filenames. Re-upload images."
**Causa**: Imágenes no tienen nombre de archivo
**Solución**:
1. Re-hacer upload de imágenes
2. Verificar que cada imagen tenga `uploadedInfo.filename`

### ❌ "Preview generation failed"
**Causa**: Error en backend
**Solución**:
1. Verificar logs del backend
2. Verificar que FFmpeg esté disponible
3. Verificar que las imágenes existan en `uploads/`

## 🧪 **Test Manual del Preview**

### 1. Setup Inicial
```bash
# Terminal 1: Backend
cd backend && npm start

# Terminal 2: Plugin
cd figma-plugin && npm run build
```

### 2. En Figma
1. **Cargar plugin**: Import from manifest
2. **Crear frames**: 2-3 frames con contenido
3. **Seleccionar frames** en canvas
4. **Refresh plugin**: Esperar upload completo
5. **Verificar timeline**: Debe mostrar frames

### 3. Generar Preview
1. **Botón Preview**: Debe estar habilitado
2. **Clic en Preview**: Debe mostrar "⏳ Generating..."
3. **Esperar resultado**: Video debe aparecer
4. **Verificar video**: Debe reproducirse

### 4. Debug Console
**En Figma Developer Console**:
```javascript
// Verificar estado del preview
console.log('Preview state:', {
  canGeneratePreview: /* valor */,
  sessionId: /* valor */,
  timelineLength: /* valor */,
  isUploading: /* valor */
});
```

## 📋 **Checklist de Preview**

- [ ] Backend ejecutándose en puerto 3001
- [ ] Endpoint `/preview` responde
- [ ] SessionId presente después de upload
- [ ] Timeline tiene frames (length > 0)
- [ ] No hay upload en progreso
- [ ] Botón "🔍 Quick Preview" habilitado
- [ ] Console muestra payload del preview
- [ ] Backend recibe request del preview
- [ ] Video generado correctamente
- [ ] Video se reproduce en la UI

## 🎯 **Preview Funcionando Correctamente**

Cuando todo funciona:
1. ✅ Botón preview habilitado
2. ✅ Clic genera request al backend
3. ✅ Backend procesa imágenes con FFmpeg
4. ✅ Retorna URL del video preview
5. ✅ Frontend muestra video con controles
6. ✅ Video reproduce la secuencia con transiciones

¡El sistema de preview está completamente implementado! 🚀
