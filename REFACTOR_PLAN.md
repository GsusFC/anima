# 🔄 PLAN DE REFACTORIZACIÓN SLIDESHOW
## Aplicando lecciones de FilterGraph a componentes frontend

---

## 📊 **ANÁLISIS INICIAL**

**Líneas de código por componente:**
- ❌ **useSlideshow.ts**: 500 líneas (hook monolítico)
- ❌ **Timeline.tsx**: 582 líneas (rendering complejo)  
- ❌ **ExportControls.tsx**: 737 líneas (lógica mixta)
- ✅ **FilterGraph.js**: 200 líneas (después del refactor)

**Problemas identificados:**
1. **Responsabilidades mixtas** (como filter_complex antes)
2. **Escalabilidad limitada** (difícil añadir features)
3. **Testing complejo** (muchas dependencias)
4. **Código repetitivo** (patterns sin abstraer)

---

## 🎯 **ESTRATEGIA DE REFACTORIZACIÓN**

### **Fase 1: Hook Specialization (useSlideshow.ts)**
**Timeline:** 1-2 días | **Riesgo:** Medio | **Impacto:** Alto

**Problema actual:**
```typescript
// 500 líneas monolíticas
const useSlideshow = () => {
  // Upload logic (100 líneas)
  // Timeline logic (150 líneas) 
  // Export logic (120 líneas)
  // Preview logic (80 líneas)
  // State management (50 líneas)
}
```

**Solución propuesta:**
```typescript
// Hook composition pattern
const useSlideshow = () => {
  const images = useImageManagement();
  const timeline = useTimelineManagement(); 
  const export = useExportManagement();
  const preview = usePreviewGeneration();
  
  return { images, timeline, export, preview };
};
```

**Pasos de implementación:**
1. ✅ **Crear hooks especializados** (sin cambiar API externa)
2. ✅ **Migrar lógica gradualmente** (una responsabilidad por vez)
3. ✅ **Validar con MCP navegador** (funcionalidad intacta)
4. ✅ **Cleanup del hook original**

---

### **Fase 2: Component Builder (Timeline.tsx)**
**Timeline:** 2-3 días | **Riesgo:** Alto | **Impacto:** Alto

**Problema actual:**
```typescript
// 150+ líneas JSX por timeline item
{project.timeline.map((item, index) => (
  <div style={{...masiveObject}}>
    <div style={{...anotherMassiveObject}}>
      {/* 100+ líneas de JSX anidado */}
    </div>
  </div>
))}
```

**Solución propuesta:**
```typescript
// ComponentBuilder pattern
class TimelineItemBuilder {
  setImage(image) { return this; }
  setDuration(duration) { return this; }
  setTransition(transition) { return this; }
  setEvents(handlers) { return this; }
  
  build() {
    return <TimelineItem {...this.props} />;
  }
}

// Usage
{project.timeline.map((item, index) => 
  new TimelineItemBuilder()
    .setImage(item.image)
    .setDuration(item.duration)
    .setTransition(item.transition)
    .setEvents(dragHandlers)
    .build()
)}
```

**Pasos de implementación:**
1. ✅ **Extraer TimelineItem component** 
2. ✅ **Crear TimelineItemBuilder class**
3. ✅ **Migrar styling a CSS modules**
4. ✅ **Implementar builder en Timeline**
5. ✅ **Validar drag&drop funciona**

---

### **Fase 3: Strategy Pattern (ExportControls.tsx)**
**Timeline:** 1-2 días | **Riesgo:** Bajo | **Impacto:** Medio

**Problema actual:**
```typescript
// Conditional rendering masivo
if (format === 'gif') {
  return <GifControls />; // 200 líneas
} else if (format === 'mp4') {
  return <VideoControls />; // 200 líneas  
} else if (format === 'webm') {
  return <WebmControls />; // 200 líneas
}
```

**Solución propuesta:**
```typescript
// Strategy pattern
abstract class ExportStrategy {
  abstract renderControls(): JSX.Element;
  abstract getDefaults(): ExportSettings;
  abstract validate(settings): boolean;
}

class GifExportStrategy extends ExportStrategy {
  renderControls() {
    return <GifOptimizationPanel />;
  }
}

// Usage
const strategy = ExportStrategyFactory.create(format);
return strategy.renderControls();
```

---

## 🧪 **ESTRATEGIA DE VALIDACIÓN CON MCP**

### **MCP Browser Testing**
```bash
# Automated validation workflow
1. Navigate to slideshow
2. Upload test images  
3. Add to timeline
4. Test transitions
5. Export GIF/MP4
6. Validate output files
```

### **MCP Sequential Thinking**
```bash
# Step-by-step validation
1. Pre-refactor: capture current behavior
2. During refactor: validate each step
3. Post-refactor: regression testing
4. Performance comparison
```

### **MCP Context7** 
```bash
# Maintain context between refactors
- Store component interfaces
- Track breaking changes
- Document migration paths
- Remember successful patterns
```

---

## 📅 **CRONOGRAMA DE EJECUCIÓN**

### **Semana 1: Hook Specialization**
- **Día 1-2**: Crear hooks especializados
- **Día 3**: Migrar useImageManagement 
- **Día 4**: Migrar useTimelineManagement
- **Día 5**: Validación MCP + cleanup

### **Semana 2: Component Builder**
- **Día 1-2**: Extraer TimelineItem + Builder
- **Día 3**: CSS modules migration
- **Día 4**: Integration testing
- **Día 5**: Performance optimization

### **Semana 3: Strategy Pattern** 
- **Día 1**: Create ExportStrategy classes
- **Día 2**: Migrate GIF/Video strategies
- **Día 3**: Factory implementation
- **Día 4**: Validation + cleanup
- **Día 5**: Documentation

---

## ✅ **CRITERIOS DE ÉXITO**

### **Funcionales**
- ✅ Upload/Timeline/Export funcionan igual
- ✅ Drag & drop mantiene comportamiento
- ✅ Transiciones se aplican correctamente
- ✅ GIF export genera archivos válidos

### **Técnicos**
- ✅ Reducción 40%+ líneas de código
- ✅ Testing coverage >80%
- ✅ Performance igual o mejor
- ✅ Nueva feature easy to add

### **Mantenibilidad**
- ✅ Componentes single responsibility
- ✅ Interfaces claramente definidas
- ✅ Patterns reusables documentados
- ✅ Debugging más simple

---

## 🚨 **RIESGOS Y MITIGACIONES**

### **Alto Riesgo: Timeline refactor**
- **Riesgo**: Romper drag & drop
- **Mitigación**: MCP testing continuo + rollback plan

### **Medio Riesgo: Hook composition**
- **Riesgo**: Context re-renders
- **Mitigación**: useMemo + performance testing

### **Bajo Riesgo: Export strategies**  
- **Riesgo**: Missing edge cases
- **Mitigación**: Comprehensive test matrix

---

## 🔧 **HERRAMIENTAS NECESARIAS**

### **MCP Requeridos**
- ✅ **browsermcp**: E2E validation
- ✅ **sequentialthinking**: Step tracking  
- ✅ **context7**: Pattern memory
- ⚠️ **sentry**: Error monitoring (opcional)

### **Desarrollo**
- VS Code + TypeScript
- React DevTools
- Performance Profiler
- Git feature branches

---

## 🎯 **DECISION POINT**

**¿Empezar con Fase 1 (useSlideshow hook refactor)?**

**Ventajas:**
- Base sólida para siguientes fases
- Menor riesgo de romper UI
- Patterns claros de FilterGraph aplicables

**Desventajas:**  
- No visible impact inmediato
- Requiere testing exhaustivo

**Recomendación:** ✅ Empezar con Fase 1, usando MCP browser para validación continua.
