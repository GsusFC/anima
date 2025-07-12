# AnimaGen Figma Plugin - Integración API

> Documentación completa para la integración del plugin de Figma con la API de AnimaGen

## 📋 Resumen de la Arquitectura Existente

### **🔗 API de AnimaGen (Ya desarrollada)**
- **Base URL:** `https://anima-production-3dad.up.railway.app`
- **Endpoint principal:** `POST /upload` - Subir imágenes generales
- **Endpoint específico Figma:** `POST /api/figma/import` - Importar desde Figma
- **Autenticación:** Sistema de API keys con validación en `/api/auth/validate`
- **Formato:** FormData con múltiples imágenes

### **🎯 Plugin Actual (Create Figma Plugin)**
- **Ubicación:** `/Users/gsus/CascadeProjects/AnimaGen/animagen-figma-plugin-new/hello-world/`
- **Estado:** Funcional con autenticación mock y exportación de frames
- **Funcionalidades:** Detección de frames seleccionados, exportación, UI moderna

## 🔧 Servicios Desarrollados (Para Integrar)

### **AnimaGenAPIService** 
```typescript
// Ubicación: figma-plugin/src/plugin/services/AnimaGenAPIService.ts
class AnimaGenAPIService {
  private baseURL = 'https://anima-production-3dad.up.railway.app';
  
  // Métodos disponibles:
  async validateAPIKey(apiKey: string): Promise<APIKeyValidation>
  async uploadFrames(frameResults: FrameExportResult[], settings: any): Promise<AnimaGenUploadResponse>
  async updateProjectSettings(projectId: string, settings: any, apiKey: string): Promise<any>
}
```

### **AuthController**
```typescript
// Ubicación: figma-plugin/src/plugin/controllers/AuthController.ts
class AuthController {
  async initialize(): Promise<AuthState>
  async authenticateWithAPIKey(apiKey: string): Promise<AuthState>
  async logout(): Promise<void>
}
```

## 📤 Endpoints de la API AnimaGen

### **1. Validación de API Key**
```http
POST /api/auth/validate
Authorization: Bearer {apiKey}
Content-Type: application/json

{
  "source": "figma-plugin",
  "version": "2.0.0"
}
```

**Respuesta:**
```json
{
  "valid": true,
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "User Name",
    "plan": "Pro"
  },
  "expiresAt": "2024-12-31T23:59:59Z"
}
```

### **2. Upload de Frames desde Figma**
```http
POST /api/figma/import
Content-Type: multipart/form-data
X-Plugin-Version: 2.0.0
X-Plugin-Source: figma

FormData:
- source: "figma-plugin"
- pluginVersion: "2.0.0"
- sessionId: "session_{timestamp}"
- frames: [archivos de imagen]
- metadata: JSON con información de frames
```

**Respuesta:**
```json
{
  "success": true,
  "sessionId": "session_123",
  "slideshowId": "slideshow_456",
  "slideshowUrl": "https://anima-production-3dad.up.railway.app/slideshow/456",
  "downloadUrl": "https://anima-production-3dad.up.railway.app/download/slideshow_456.mp4",
  "framesProcessed": 4,
  "processingTime": "2.3s"
}
```

### **3. Upload General**
```http
POST /upload
Content-Type: multipart/form-data

FormData:
- images: [archivos]
- sessionId: "session_123"
```

## 🎯 Plan de Integración

### **Fase 1: Autenticación Real**
1. Integrar `AnimaGenAPIService` en el plugin actual
2. Reemplazar autenticación mock con validación real
3. Manejar estados de error y expiración

### **Fase 2: Upload Real**
1. Implementar upload a `/api/figma/import`
2. Convertir frames exportados a FormData
3. Manejar progreso y errores de upload

### **Fase 3: Respuesta y Resultado**
1. Mostrar slideshow creado
2. Proporcionar enlaces de descarga
3. Manejar diferentes formatos de salida

## 📊 Configuraciones de Compresión

### **Configuraciones Recomendadas:**
```typescript
interface CompressionSettings {
  format: 'PNG' | 'JPG';
  scale: 1 | 2 | 3;
  quality: 80 | 90 | 100; // Solo para JPG
  maxWidth: 1920 | 2560 | 3840;
  maxHeight: 1080 | 1440 | 2160;
}
```

### **Optimizaciones:**
- **PNG:** Para frames con transparencias o texto
- **JPG:** Para frames fotográficos (calidad 90%)
- **Escala 2x:** Balance entre calidad y tamaño
- **Max 1920px:** Óptimo para presentaciones web

## 🔄 Flujo Completo de Trabajo

### **1. Usuario en Figma:**
```
Selecciona frames → Abre plugin → Autentica → Configura → Exporta
```

### **2. Plugin:**
```
Detecta frames → Exporta imágenes → Crea FormData → Sube a API → Muestra resultado
```

### **3. API AnimaGen:**
```
Recibe imágenes → Procesa → Crea slideshow → Retorna URLs
```

## 🚀 Próximos Pasos

### **Inmediatos:**
1. **Integrar AnimaGenAPIService** en el plugin actual
2. **Implementar autenticación real** con API keys válidas
3. **Conectar upload** al endpoint `/api/figma/import`

### **Mejoras:**
1. **Configuraciones de compresión** avanzadas
2. **Batch processing** para proyectos grandes
3. **Preview** del slideshow antes de finalizar
4. **Historial** de slideshows creados

## 📝 Notas Técnicas

### **Limitaciones Actuales:**
- Máximo 50 archivos por upload
- Tamaño máximo: 52MB por archivo
- Formatos soportados: JPG, PNG, GIF
- Timeout: 30 segundos por request

### **Consideraciones:**
- Manejar frames muy grandes (>4K)
- Optimizar para conexiones lentas
- Fallback para errores de red
- Cache de autenticación local

---

**Última actualización:** Julio 2024  
**Estado:** Listo para integración  
**Prioridad:** Alta - Funcionalidad core del plugin
