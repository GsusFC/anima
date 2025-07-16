# AnimaGen Improvement Plan

Este documento rastrea las mejoras propuestas para el proyecto AnimaGen, priorizadas por impacto y esfuerzo.

## Prioridad Alta: Mejoras Críticas y "Quick Wins"
*(Alto impacto, esfuerzo bajo a moderado)*

- [ ] **1. Mejorar la Gestión de Secretos (Backend)**: Mover las claves de API de `api-keys.json` a variables de entorno para prevenir la exposición de credenciales.
- [ ] **2. Consolidar la Lógica de Exportación (Backend)**: Refactorizar la lógica duplicada de las rutas de exportación en un servicio reutilizable para simplificar el mantenimiento.
- [ ] **3. Implementar Manejo de Errores Centralizado (Backend)**: Crear un middleware de Express para un manejo de errores consistente y robusto en toda la API.

## Prioridad Media: Mejoras Estructurales Importantes
*(Alto impacto, esfuerzo moderado a alto)*

- [ ] **4. Migrar el Backend a TypeScript**: Unificar el stack tecnológico, añadiendo seguridad de tipos y mejorando la experiencia de desarrollo.
- [ ] **5. Abstraer Componentes y Hooks Compartidos (Frontend)**: Mover lógica y componentes duplicados entre los editores de `slideshow` y `video-editor` al directorio `src/shared/` para maximizar la reutilización.
- [ ] **6. Adoptar una Librería de Gestión de Estado (Frontend)**: Integrar una herramienta como Zustand o Redux Toolkit para simplificar la gestión del estado global y el flujo de datos.

## Prioridad Baja: Iniciativas Estratégicas a Largo Plazo
*(Impacto muy alto, esfuerzo alto)*

- [ ] **7. Migrar la Persistencia de Datos a una Base de Datos (Backend)**: Reemplazar el almacenamiento de composiciones en archivos JSON por una base de datos (SQL o NoSQL) para mejorar la escalabilidad y las capacidades de consulta.
- [ ] **8. Convertir el Proyecto en un Monorepo**: Reestructurar el repositorio usando `pnpm workspaces` o `Nx` para simplificar la gestión de dependencias y la compartición de código entre los paquetes.