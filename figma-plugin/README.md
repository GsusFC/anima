# Slideshow Exporter – Figma Plugin

Este plugin permite exportar los nodos seleccionados en Figma como imágenes PNG y crear un slideshow con control de duración por imagen y transiciones personalizadas.

## ✨ Características

- 📸 **Exportación automática**: Rasteriza la selección de Figma a PNG
- ⏱️ **Control de duración**: Ajusta el tiempo de cada imagen (0.3s - 5s)
- 🎬 **Transiciones**: Fade, Cut, Slide, Zoom entre imágenes
- 🎨 **Vista previa en tiempo real**: Ve cómo quedará tu slideshow
- 📱 **Formatos múltiples**: MP4, GIF, WebM
- 🔧 **Interfaz optimizada**: Diseñada para el panel de Figma

## 🚀 Instalación

### Paso 1: Preparar el plugin

```bash
cd figma-plugin
npm install
npm run build
```

### Paso 2: Instalar en Figma

1. Abre **Figma Desktop** (el plugin NO funciona en la versión web)
2. Ve a **Plugins** → **Development** → **Import plugin from manifest…**
3. Navega a la carpeta `figma-plugin/` y selecciona `manifest.json`
4. El plugin aparecerá en **Plugins** → **Development** → **Slideshow Exporter**

## 📖 Cómo usar

### 1. Seleccionar contenido
- Selecciona **frames**, **componentes** o **grupos** en Figma
- Pueden ser múltiples elementos (se exportarán en orden de selección)
- Recomendado: Frames con mismo tamaño para mejor resultado

### 2. Ejecutar el plugin
- **Plugins** → **Development** → **Slideshow Exporter**
- O usa el atajo **Cmd/Ctrl + P** → "Slideshow Exporter"

### 3. Configurar slideshow
- **Duración por imagen**: Arrastra el slider (0.3s - 5s)
- **Transiciones**: Selecciona tipo y duración entre imágenes
  - **Fade**: Fundido suave (recomendado)
  - **Cut**: Cambio instantáneo
  - **Slide**: Deslizamiento lateral
  - **Zoom**: Escalado desde el centro
- **Quitar frames**: Botón ❌ en cada elemento

### 4. Exportar
- Selecciona formato: **MP4**, **GIF**, o **WebM**
- Presiona **🚀 EXPORT** 
- *Nota: Actualmente muestra placeholder, pendiente conexión con backend*

## 🔧 Desarrollo

### Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run build` | Compila una vez para producción |
| `npm run watch` | Compilación continua (desarrollo) |
| `npm run clean` | Limpia archivos generados |

### Estructura del proyecto

```
figma-plugin/
├─ build/                    # Archivos compilados para Figma
│  ├─ main.js               # Lógica del plugin (sandbox)
│  ├─ ui.js                 # Interfaz React (iframe)
│  └─ ui.html               # HTML del iframe
├─ src/
│  ├─ main.ts               # Plugin principal (Figma API)
│  └─ ui/
│     ├─ index.html         # Plantilla HTML
│     ├─ index.tsx          # Punto de entrada React
│     └─ FigmaSlideshow.tsx # Componente principal
├─ manifest.json            # Configuración del plugin
└─ esbuild.config.js        # Build system
```

## 🎯 Próximos pasos

- [ ] **Conexión con backend**: Integrar con AnimaGen para generar videos reales
- [ ] **Preview en tiempo real**: Mostrar vista previa del slideshow
- [ ] **Más transiciones**: Wipe, Circle, Radial, etc.
- [ ] **Ajustes avanzados**: Resolución, FPS, quality presets
- [ ] **Persistencia**: Guardar proyectos entre sesiones
- [ ] **Drag & drop**: Reordenar timeline arrastrando

## 🐛 Troubleshooting

**Plugin no aparece**
- Asegúrate de usar Figma Desktop (no web)
- Verifica que `npm run build` se ejecutó sin errores

**No se exportan imágenes**
- Selecciona elementos con contenido visual
- Algunos nodos pueden no ser exportables (ej: texto sin fill)

**Error al compilar**
- Ejecuta `npm run clean && npm run build`
- Verifica que tienes Node.js 16+ instalado

## 📝 Notas técnicas

- Las imágenes se exportan a **escala 1:1** desde Figma
- El plugin usa **React 18** con renderizado en iframe
- Comunicación **plugin ↔ UI** vía `postMessage`
- Build system: **esbuild** para rapidez y tamaño reducido 