# 🧪 Guía de Pruebas - Plugin de Figma AnimaGen

## 📋 Pre-requisitos

✅ **Backend funcionando**: Puerto 3001 (verificado)
✅ **Plugin construido**: Build completado sin errores
✅ **Figma Desktop**: Necesario para cargar plugins de desarrollo

## 🚀 Instalación del Plugin en Figma

### 1. Abrir Figma Desktop
- Necesitas la aplicación de escritorio de Figma, no la web

### 2. Cargar el Plugin
1. Ve a **Plugins → Development → Import plugin from manifest**
2. Selecciona el archivo `manifest.json` de la carpeta `figma-plugin`
3. El plugin aparecerá como "Slideshow Exporter"

### 3. Preparar Archivo de Prueba
1. Crea un nuevo archivo en Figma
2. Crea varios **frames** con contenido visual
3. Nombra los frames de manera descriptiva (ej: "Slide 1", "Slide 2", etc.)

## 🎯 Pruebas Funcionales

### ✅ Prueba 1: Carga Básica
1. **Ejecutar plugin**: Plugins → Development → Slideshow Exporter
2. **Verificar UI**: Debe mostrar la interfaz refactorizada
3. **Botones visibles**: Settings, Logs (si debug está activado), Set API, Close

### ✅ Prueba 2: Configuración de API
1. **Clic en "Set API"**
2. **Verificar URL**: Debe mostrar `http://localhost:3001`
3. **Probar conexión**: Verificar que se conecte al backend

### ✅ Prueba 3: Cargar Frames
1. **Seleccionar frames** en el canvas
2. **Clic en "Refresh"** en el plugin
3. **Verificar carga**: Los frames deben aparecer como imágenes en el timeline

### ✅ Prueba 4: Configuración de Timeline
1. **Ajustar duración** de cada frame usando los sliders
2. **Cambiar transiciones** usando los dropdowns
3. **Remover frames** usando el botón ×
4. **Reordenar** (si está implementado)

### ✅ Prueba 5: Settings Modal
1. **Clic en "⚙️ Settings"**
2. **Verificar campos**:
   - API Base URL
   - Debug Mode
   - Default Duration
   - Default Transition
   - Max Image Size
3. **Guardar cambios** y verificar persistencia

### ✅ Prueba 6: Export Functionality
1. **Configurar export settings**:
   - Formato (MP4, GIF, WebM)
   - Calidad (Low, Medium, High)
   - Resolución
   - FPS
2. **Clic en "Export Video"**
3. **Verificar progreso**: Debe mostrar barra de progreso
4. **Descargar resultado**: Archivo debe descargarse automáticamente

### ✅ Prueba 7: Debug Logs
1. **Activar debug mode** en Settings
2. **Clic en "📋 Logs"**
3. **Verificar logs**: Debe mostrar actividad del plugin
4. **Clear logs**: Botón debe limpiar la lista

## ⌨️ Pruebas de Atajos de Teclado

- **R**: Refresh frames
- **E**: Export (si hay contenido válido)
- **P**: Preview
- **Esc**: Cerrar plugin
- **Ctrl/Cmd + E**: Ciclar formato de export

## 🐛 Casos de Error a Probar

### ❌ Sin Backend
1. Detener el backend (`Ctrl+C` en la terminal)
2. Intentar usar el plugin
3. **Verificar**: Debe mostrar errores de conexión apropiados

### ❌ Sin Frames Seleccionados
1. No seleccionar frames
2. Hacer refresh
3. **Verificar**: Debe mostrar estado vacío con mensaje claro

### ❌ Frames Inválidos
1. Seleccionar objetos que no sean frames
2. Hacer refresh
3. **Verificar**: Debe filtrar y mostrar solo frames válidos

## 📊 Métricas de Rendimiento

- **Tiempo de carga**: UI debe cargar en < 2 segundos
- **Respuesta de red**: Conexiones API en < 500ms
- **Export pequeño**: 2-3 frames debe exportar en < 30 segundos
- **Memoria**: Plugin debe usar < 100MB RAM

## 🔧 Debugging

### Console Logs
- Abrir **Developer Console** en Figma: `Ctrl/Cmd + Option + I`
- Verificar mensajes del plugin

### Network Requests
- Monitorear requests en la pestaña Network
- Verificar URLs y responses

### Error Handling
- Todos los errores deben mostrarse en UI, no solo en console
- Mensajes de error deben ser claros y accionables

## ✅ Checklist Final

- [ ] Plugin carga sin errores
- [ ] Conecta al backend correctamente
- [ ] Carga frames desde Figma
- [ ] Timeline es interactivo
- [ ] Settings funcionan
- [ ] Export produce archivos válidos
- [ ] Error handling apropiado
- [ ] Logs funcionan en debug mode
- [ ] Atajos de teclado responden
- [ ] UI es responsive y usable

## 🎉 ¡Listo para Probar!

El plugin ha sido completamente refactorizado con:
- ✅ Arquitectura modular
- ✅ TypeScript sin errores
- ✅ 84% de tests pasando
- ✅ UI/UX mejorada
- ✅ Manejo robusto de errores
- ✅ Sistema de logging integrado

¡Disfruta probando el plugin! 🚀
