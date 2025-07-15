import React, { useState, useRef } from 'react';
import { TransitionType, TransitionConfig } from '../types/slideshow.types';

interface TransitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transition: TransitionConfig) => void;
  currentTransition?: TransitionConfig;
  frameNumber: number;
}

const TransitionModal: React.FC<TransitionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentTransition,
  frameNumber
}) => {
  const [selectedType, setSelectedType] = useState<TransitionType>(
    currentTransition?.type || 'fade'
  );
  const [duration, setDuration] = useState(
    currentTransition?.duration || 500
  );
  const [expandedCategory, setExpandedCategory] = useState<string>('BÁSICAS');
  const [searchTerm, setSearchTerm] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Inicializar canvas cuando se monta el componente
  React.useEffect(() => {
    if (canvasRef.current && isOpen) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#666666';
        ctx.font = 'bold 16px "Space Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Click Play to preview', canvas.width/2, canvas.height/2 - 10);
        ctx.fillText(`${selectedType} transition`, canvas.width/2, canvas.height/2 + 15);
      }
    }
  }, [isOpen, selectedType]);

  // Definición completa de todas las 62 transiciones
  const transitionCategories = [
    {
      name: 'BÁSICAS',
      icon: '🎬',
      transitions: [
        { type: 'fade' as TransitionType, name: 'Fade', description: 'Transición suave de opacidad', recommendedDuration: '400-800ms', mood: 'suave' },
        { type: 'cut' as TransitionType, name: 'Cut', description: 'Cambio instantáneo sin transición', recommendedDuration: '0ms', mood: 'directo' },
        { type: 'dissolve' as TransitionType, name: 'Dissolve', description: 'Disolución granular entre imágenes', recommendedDuration: '500-1000ms', mood: 'orgánico' },
        { type: 'fadeblack' as TransitionType, name: 'Fade to Black', description: 'Fundido a negro intermedio', recommendedDuration: '600-1200ms', mood: 'dramático' },
        { type: 'fadewhite' as TransitionType, name: 'Fade to White', description: 'Fundido a blanco intermedio', recommendedDuration: '600-1200ms', mood: 'limpio' }
      ]
    },
    {
      name: 'DESLIZAMIENTOS',
      icon: '↔️',
      transitions: [
        { type: 'slideleft' as TransitionType, name: 'Slide Left', description: 'Nueva imagen entra desde la izquierda', recommendedDuration: '300-600ms', mood: 'dinámico' },
        { type: 'slideright' as TransitionType, name: 'Slide Right', description: 'Nueva imagen entra desde la derecha', recommendedDuration: '300-600ms', mood: 'dinámico' },
        { type: 'slideup' as TransitionType, name: 'Slide Up', description: 'Nueva imagen entra desde abajo', recommendedDuration: '300-600ms', mood: 'dinámico' },
        { type: 'slidedown' as TransitionType, name: 'Slide Down', description: 'Nueva imagen entra desde arriba', recommendedDuration: '300-600ms', mood: 'dinámico' },
        { type: 'smoothleft' as TransitionType, name: 'Smooth Left', description: 'Deslizamiento suave hacia la izquierda', recommendedDuration: '400-700ms', mood: 'suave' },
        { type: 'smoothright' as TransitionType, name: 'Smooth Right', description: 'Deslizamiento suave hacia la derecha', recommendedDuration: '400-700ms', mood: 'suave' },
        { type: 'smoothup' as TransitionType, name: 'Smooth Up', description: 'Deslizamiento suave hacia arriba', recommendedDuration: '400-700ms', mood: 'suave' },
        { type: 'smoothdown' as TransitionType, name: 'Smooth Down', description: 'Deslizamiento suave hacia abajo', recommendedDuration: '400-700ms', mood: 'suave' }
      ]
    },
    {
      name: 'BARRIDOS',
      icon: '🔲',
      transitions: [
        { type: 'wipeleft' as TransitionType, name: 'Wipe Left', description: 'Barrido horizontal de izquierda a derecha', recommendedDuration: '400-800ms', mood: 'técnico' },
        { type: 'wiperight' as TransitionType, name: 'Wipe Right', description: 'Barrido horizontal de derecha a izquierda', recommendedDuration: '400-800ms', mood: 'técnico' },
        { type: 'wipeup' as TransitionType, name: 'Wipe Up', description: 'Barrido vertical de abajo hacia arriba', recommendedDuration: '400-800ms', mood: 'técnico' },
        { type: 'wipedown' as TransitionType, name: 'Wipe Down', description: 'Barrido vertical de arriba hacia abajo', recommendedDuration: '400-800ms', mood: 'técnico' },
        { type: 'wipetl' as TransitionType, name: 'Wipe Top-Left', description: 'Barrido diagonal desde esquina superior izquierda', recommendedDuration: '500-900ms', mood: 'geométrico' },
        { type: 'wipetr' as TransitionType, name: 'Wipe Top-Right', description: 'Barrido diagonal desde esquina superior derecha', recommendedDuration: '500-900ms', mood: 'geométrico' },
        { type: 'wipebl' as TransitionType, name: 'Wipe Bottom-Left', description: 'Barrido diagonal desde esquina inferior izquierda', recommendedDuration: '500-900ms', mood: 'geométrico' },
        { type: 'wipebr' as TransitionType, name: 'Wipe Bottom-Right', description: 'Barrido diagonal desde esquina inferior derecha', recommendedDuration: '500-900ms', mood: 'geométrico' },
        { type: 'squeezeh' as TransitionType, name: 'Squeeze Horizontal', description: 'Compresión horizontal progresiva', recommendedDuration: '600-1000ms', mood: 'dramático' },
        { type: 'squeezev' as TransitionType, name: 'Squeeze Vertical', description: 'Compresión vertical progresiva', recommendedDuration: '600-1000ms', mood: 'dramático' },
        { type: 'hlslice' as TransitionType, name: 'Horizontal Left Slice', description: 'Corte horizontal desde la izquierda', recommendedDuration: '400-700ms', mood: 'técnico' },
        { type: 'hrslice' as TransitionType, name: 'Horizontal Right Slice', description: 'Corte horizontal desde la derecha', recommendedDuration: '400-700ms', mood: 'técnico' }
      ]
    },
    {
      name: 'CIRCULARES',
      icon: '⭕',
      transitions: [
        { type: 'circlecrop' as TransitionType, name: 'Circle Crop', description: 'Recorte circular progresivo', recommendedDuration: '500-1000ms', mood: 'orgánico' },
        { type: 'circleopen' as TransitionType, name: 'Circle Open', description: 'Apertura circular desde el centro', recommendedDuration: '500-1000ms', mood: 'orgánico' },
        { type: 'circleclose' as TransitionType, name: 'Circle Close', description: 'Cierre circular hacia el centro', recommendedDuration: '500-1000ms', mood: 'orgánico' },
        { type: 'radial' as TransitionType, name: 'Radial', description: 'Transición radial en forma de reloj', recommendedDuration: '600-1200ms', mood: 'técnico' },
        { type: 'rectcrop' as TransitionType, name: 'Rectangle Crop', description: 'Recorte rectangular progresivo', recommendedDuration: '500-900ms', mood: 'geométrico' },
        { type: 'distance' as TransitionType, name: 'Distance', description: 'Transición basada en distancia de píxeles', recommendedDuration: '600-1200ms', mood: 'técnico' }
      ]
    },
    {
      name: 'APERTURAS/CIERRES',
      icon: '🪟',
      transitions: [
        { type: 'vertopen' as TransitionType, name: 'Vertical Open', description: 'Apertura vertical desde el centro', recommendedDuration: '500-900ms', mood: 'geométrico' },
        { type: 'vertclose' as TransitionType, name: 'Vertical Close', description: 'Cierre vertical hacia el centro', recommendedDuration: '500-900ms', mood: 'geométrico' },
        { type: 'horzopen' as TransitionType, name: 'Horizontal Open', description: 'Apertura horizontal desde el centro', recommendedDuration: '500-900ms', mood: 'geométrico' },
        { type: 'horzclose' as TransitionType, name: 'Horizontal Close', description: 'Cierre horizontal hacia el centro', recommendedDuration: '500-900ms', mood: 'geométrico' },
        { type: 'coverleft' as TransitionType, name: 'Cover Left', description: 'Nueva imagen cubre desde la izquierda', recommendedDuration: '400-800ms', mood: 'limpio' },
        { type: 'coverright' as TransitionType, name: 'Cover Right', description: 'Nueva imagen cubre desde la derecha', recommendedDuration: '400-800ms', mood: 'limpio' },
        { type: 'coverup' as TransitionType, name: 'Cover Up', description: 'Nueva imagen cubre desde abajo', recommendedDuration: '400-800ms', mood: 'limpio' },
        { type: 'coverdown' as TransitionType, name: 'Cover Down', description: 'Nueva imagen cubre desde arriba', recommendedDuration: '400-800ms', mood: 'limpio' }
      ]
    },
    {
      name: 'EFECTOS ESPECIALES',
      icon: '✨',
      transitions: [
        { type: 'pixelize' as TransitionType, name: 'Pixelize', description: 'Efecto de pixelación progresiva', recommendedDuration: '700-1400ms', mood: 'digital' },
        { type: 'hblur' as TransitionType, name: 'Horizontal Blur', description: 'Desenfoque horizontal dinámico', recommendedDuration: '500-1000ms', mood: 'artístico' },
        { type: 'fadegrays' as TransitionType, name: 'Fade Grays', description: 'Fundido con escalas de grises', recommendedDuration: '600-1200ms', mood: 'artístico' },
        { type: 'revealleft' as TransitionType, name: 'Reveal Left', description: 'Revelado progresivo desde la izquierda', recommendedDuration: '500-900ms', mood: 'dramático' },
        { type: 'revealright' as TransitionType, name: 'Reveal Right', description: 'Revelado progresivo desde la derecha', recommendedDuration: '500-900ms', mood: 'dramático' },
        { type: 'revealup' as TransitionType, name: 'Reveal Up', description: 'Revelado progresivo desde abajo', recommendedDuration: '500-900ms', mood: 'dramático' },
        { type: 'revealdown' as TransitionType, name: 'Reveal Down', description: 'Revelado progresivo desde arriba', recommendedDuration: '500-900ms', mood: 'dramático' },
        { type: 'zoomin' as TransitionType, name: 'Zoom In', description: 'Nueva imagen aparece escalando desde el centro', recommendedDuration: '400-800ms', mood: 'dinámico' }
      ]
    },
    {
      name: 'DINÁMICAS',
      icon: '⚡',
      transitions: [
        { type: 'hlwind' as TransitionType, name: 'Horizontal Left Wind', description: 'Efecto de viento horizontal izquierdo', recommendedDuration: '600-1000ms', mood: 'dinámico' },
        { type: 'hrwind' as TransitionType, name: 'Horizontal Right Wind', description: 'Efecto de viento horizontal derecho', recommendedDuration: '600-1000ms', mood: 'dinámico' },
        { type: 'vuwind' as TransitionType, name: 'Vertical Up Wind', description: 'Efecto de viento vertical ascendente', recommendedDuration: '600-1000ms', mood: 'dinámico' },
        { type: 'vdwind' as TransitionType, name: 'Vertical Down Wind', description: 'Efecto de viento vertical descendente', recommendedDuration: '600-1000ms', mood: 'dinámico' },
        { type: 'diagtl' as TransitionType, name: 'Diagonal Top-Left', description: 'Transición diagonal superior izquierda', recommendedDuration: '500-800ms', mood: 'geométrico' },
        { type: 'diagtr' as TransitionType, name: 'Diagonal Top-Right', description: 'Transición diagonal superior derecha', recommendedDuration: '500-800ms', mood: 'geométrico' },
        { type: 'diagbl' as TransitionType, name: 'Diagonal Bottom-Left', description: 'Transición diagonal inferior izquierda', recommendedDuration: '500-800ms', mood: 'geométrico' },
        { type: 'diagbr' as TransitionType, name: 'Diagonal Bottom-Right', description: 'Transición diagonal inferior derecha', recommendedDuration: '500-800ms', mood: 'geométrico' },
        { type: 'vuslice' as TransitionType, name: 'Vertical Up Slice', description: 'Corte vertical ascendente', recommendedDuration: '400-700ms', mood: 'técnico' },
        { type: 'vdslice' as TransitionType, name: 'Vertical Down Slice', description: 'Corte vertical descendente', recommendedDuration: '400-700ms', mood: 'técnico' }
      ]
    },
    {
      name: 'VARIACIONES',
      icon: '🔄',
      transitions: [
        { type: 'fadefast' as TransitionType, name: 'Fade Fast', description: 'Fundido rápido y directo', recommendedDuration: '200-400ms', mood: 'rápido' },
        { type: 'fadeslow' as TransitionType, name: 'Fade Slow', description: 'Fundido lento y contemplativo', recommendedDuration: '1000-2000ms', mood: 'contemplativo' },
        { type: 'zoomout' as TransitionType, name: 'Zoom Out', description: 'Efecto de zoom alejándose (fallback a zoomin)', recommendedDuration: '400-800ms', mood: 'dinámico' },
        { type: 'vblur' as TransitionType, name: 'Vertical Blur', description: 'Desenfoque vertical (fallback a hblur)', recommendedDuration: '500-1000ms', mood: 'artístico' },
        { type: 'slide' as TransitionType, name: 'Slide', description: 'Deslizamiento genérico (fallback a slideleft)', recommendedDuration: '300-600ms', mood: 'dinámico' },
        { type: 'zoom' as TransitionType, name: 'Zoom', description: 'Zoom genérico (fallback a zoomin)', recommendedDuration: '400-800ms', mood: 'dinámico' }
      ]
    }
  ];

  // Filtrar transiciones basado en búsqueda
  const filteredCategories = transitionCategories.map(category => ({
    ...category,
    transitions: category.transitions.filter(transition =>
      transition.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transition.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transition.mood.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.transitions.length > 0);

  // Encontrar la transición seleccionada para mostrar info detallada
  const selectedTransition = transitionCategories
    .flatMap(cat => cat.transitions)
    .find(t => t.type === selectedType);

  // Función para crear preview real de transiciones
  const playPreview = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsPlaying(true);
    
    // Configurar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Configurar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Función para dibujar Frame A (azul)
    const drawFrameA = () => {
      ctx.fillStyle = '#2563eb';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px "Space Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Frame A', canvas.width/2, canvas.height/2);
    };

    // Función para dibujar Frame B (verde)
    const drawFrameB = () => {
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px "Space Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Frame B', canvas.width/2, canvas.height/2);
    };

    // Simular diferentes tipos de transiciones
    const animateTransition = (type: TransitionType) => {
      const duration = 2000; // 2 segundos
      const startTime = Date.now();
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
        
        switch (type) {
          case 'fade':
            // Fade: Frame A con opacidad decreciente, Frame B con opacidad creciente
            drawFrameA();
            ctx.globalAlpha = progress;
            drawFrameB();
            break;
            
          case 'slideleft':
            // Slide left: Frame B entra desde la derecha
            drawFrameA();
            ctx.save();
            ctx.translate(canvas.width * (1 - progress), 0);
            drawFrameB();
            ctx.restore();
            break;
            
          case 'slideright':
            // Slide right: Frame B entra desde la izquierda
            drawFrameA();
            ctx.save();
            ctx.translate(-canvas.width * (1 - progress), 0);
            drawFrameB();
            ctx.restore();
            break;
            
          case 'slideup':
            // Slide up: Frame B entra desde abajo
            drawFrameA();
            ctx.save();
            ctx.translate(0, canvas.height * (1 - progress));
            drawFrameB();
            ctx.restore();
            break;
            
          case 'slidedown':
            // Slide down: Frame B entra desde arriba
            drawFrameA();
            ctx.save();
            ctx.translate(0, -canvas.height * (1 - progress));
            drawFrameB();
            ctx.restore();
            break;
            
          case 'wipeleft':
            // Wipe left: Frame B se revela de izquierda a derecha
            drawFrameA();
            ctx.save();
            ctx.beginPath();
            ctx.rect(0, 0, canvas.width * progress, canvas.height);
            ctx.clip();
            drawFrameB();
            ctx.restore();
            break;
            
          case 'wiperight':
            // Wipe right: Frame B se revela de derecha a izquierda
            drawFrameA();
            ctx.save();
            ctx.beginPath();
            ctx.rect(canvas.width * (1 - progress), 0, canvas.width * progress, canvas.height);
            ctx.clip();
            drawFrameB();
            ctx.restore();
            break;
            
          case 'wipeup':
            // Wipe up: Frame B se revela de abajo hacia arriba
            drawFrameA();
            ctx.save();
            ctx.beginPath();
            ctx.rect(0, canvas.height * (1 - progress), canvas.width, canvas.height * progress);
            ctx.clip();
            drawFrameB();
            ctx.restore();
            break;
            
          case 'wipedown':
            // Wipe down: Frame B se revela de arriba hacia abajo
            drawFrameA();
            ctx.save();
            ctx.beginPath();
            ctx.rect(0, 0, canvas.width, canvas.height * progress);
            ctx.clip();
            drawFrameB();
            ctx.restore();
            break;
            
          case 'circleopen':
            // Circle open: Frame B se revela con apertura circular
            drawFrameA();
            ctx.save();
            ctx.beginPath();
            const radius = Math.sqrt(canvas.width * canvas.width + canvas.height * canvas.height) / 2;
            ctx.arc(canvas.width/2, canvas.height/2, radius * progress, 0, 2 * Math.PI);
            ctx.clip();
            drawFrameB();
            ctx.restore();
            break;
            
          case 'circleclose':
            // Circle close: Frame B se revela con cierre circular
            drawFrameB();
            ctx.save();
            ctx.beginPath();
            const radiusClose = Math.sqrt(canvas.width * canvas.width + canvas.height * canvas.height) / 2;
            ctx.arc(canvas.width/2, canvas.height/2, radiusClose * (1 - progress), 0, 2 * Math.PI);
            ctx.clip();
            drawFrameA();
            ctx.restore();
            break;
            
          case 'zoomin':
            // Zoom in: Frame B aparece escalando desde el centro
            drawFrameA();
            ctx.save();
            const scale = progress;
            ctx.translate(canvas.width/2, canvas.height/2);
            ctx.scale(scale, scale);
            ctx.translate(-canvas.width/2, -canvas.height/2);
            drawFrameB();
            ctx.restore();
            break;
            
          case 'pixelize':
            // Pixelize: transición con efecto de pixelación
            const pixelSize = Math.max(1, 20 * (1 - progress));
            drawFrameA();
            ctx.save();
            ctx.imageSmoothingEnabled = false;
            
            // Dibujar Frame B pixelizado
            for (let x = 0; x < canvas.width; x += pixelSize) {
              for (let y = 0; y < canvas.height; y += pixelSize) {
                if (Math.random() < progress) {
                  ctx.fillStyle = '#22c55e';
                  ctx.fillRect(x, y, pixelSize, pixelSize);
                }
              }
            }
            
            // Agregar texto si el progress es suficiente
            if (progress > 0.3) {
              ctx.fillStyle = '#ffffff';
              ctx.font = 'bold 20px "Space Mono", monospace';
              ctx.textAlign = 'center';
              ctx.fillText('Frame B', canvas.width/2, canvas.height/2);
            }
            ctx.restore();
            break;
            
          case 'dissolve':
            // Dissolve: mezcla granular
            drawFrameA();
            ctx.globalAlpha = progress;
            drawFrameB();
            
            // Agregar ruido para simular dissolve
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
              if (Math.random() < (1 - progress) * 0.3) {
                data[i] = 37;     // R (Frame A color)
                data[i + 1] = 99; // G
                data[i + 2] = 235; // B
              }
            }
            ctx.putImageData(imageData, 0, 0);
            break;
            
          default:
            // Fallback: simple fade
            drawFrameA();
            ctx.globalAlpha = progress;
            drawFrameB();
            break;
        }
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          // Mostrar imagen final por un momento
          setTimeout(() => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#666666';
            ctx.font = 'bold 16px "Space Mono", monospace';
            ctx.textAlign = 'center';
            ctx.fillText('Click Play to preview', canvas.width/2, canvas.height/2);
            setIsPlaying(false);
          }, 500);
        }
      };
      
      animate();
    };
    
    // Iniciar animación
    animateTransition(selectedType);
  };

  const handleSave = () => {
    onSave({
      type: selectedType,
      duration: duration
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: '#0f0f0f',
        border: '1px solid #2a2a2b',
        borderRadius: '8px',
        width: '1000px',
        maxHeight: '85vh',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #2a2a2b',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0
        }}>
          <h3 style={{
            margin: 0,
            fontSize: '18px',
            color: '#ffffff',
            fontWeight: 'bold',
            fontFamily: '"Space Mono", monospace'
          }}>
            🎬 Transition Settings (Frame {frameNumber})
          </h3>
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#999999',
              fontSize: '18px',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '4px',
              fontWeight: 'normal'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2a2a2b'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            ✕
          </button>
        </div>

        {/* Main Content - Two Columns */}
        <div style={{
          flex: 1,
          display: 'flex',
          minHeight: 0
        }}>
          {/* Left Panel - Selection */}
          <div style={{
            width: '400px',
            borderRight: '1px solid #2a2a2b',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Search */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #2a2a2b' }}>
              <input
                type="text"
                placeholder="🔍 Search transitions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #333333',
                  borderRadius: '4px',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontFamily: '"Space Mono", monospace',
                  outline: 'none'
                }}
              />
            </div>

            {/* Categories */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px 20px'
            }}>
              {filteredCategories.map((category) => (
                <div key={category.name} style={{ marginBottom: '16px' }}>
                  <div 
                    onClick={() => {
                      setExpandedCategory(expandedCategory === category.name ? '' : category.name);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                      padding: '8px 0',
                      borderBottom: '1px solid #2a2a2b',
                      marginBottom: '8px'
                    }}
                  >
                    <span style={{ marginRight: '8px', fontSize: '14px' }}>
                      {category.icon}
                    </span>
                    <span style={{
                      marginRight: '8px',
                      fontSize: '12px',
                      color: '#999999',
                      transform: expandedCategory === category.name ? 'rotate(90deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease'
                    }}>
                      ▶
                    </span>
                    <span style={{
                      fontSize: '14px',
                      fontWeight: 'bold',
                      color: '#ffffff',
                      fontFamily: '"Space Mono", monospace',
                      flex: 1
                    }}>
                      {category.name}
                    </span>
                    <span style={{
                      fontSize: '12px',
                      color: '#666666',
                      fontFamily: '"Space Mono", monospace'
                    }}>
                      ({category.transitions.length})
                    </span>
                  </div>
                  
                  {expandedCategory === category.name && (
                    <div style={{ marginLeft: '16px' }}>
                      {category.transitions.map((transition) => (
                        <div
                          key={transition.type}
                          onClick={() => setSelectedType(transition.type)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '10px 12px',
                            marginBottom: '4px',
                            backgroundColor: selectedType === transition.type ? '#1a1a1a' : 'transparent',
                            border: selectedType === transition.type ? '1px solid #333333' : '1px solid transparent',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            if (selectedType !== transition.type) {
                              e.currentTarget.style.backgroundColor = '#161616';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (selectedType !== transition.type) {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }
                          }}
                        >
                          <div style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            backgroundColor: selectedType === transition.type ? '#4CAF50' : '#333333',
                            marginRight: '12px',
                            border: '2px solid',
                            borderColor: selectedType === transition.type ? '#4CAF50' : '#555555'
                          }}></div>
                          <div style={{ flex: 1 }}>
                            <div style={{
                              color: '#ffffff',
                              fontSize: '14px',
                              fontWeight: 'bold',
                              marginBottom: '2px',
                              fontFamily: '"Space Mono", monospace'
                            }}>
                              {transition.name}
                            </div>
                            <div style={{
                              color: '#999999',
                              fontSize: '12px',
                              marginBottom: '4px',
                              fontFamily: '"Space Mono", monospace'
                            }}>
                              {transition.description}
                            </div>
                            <div style={{
                              color: '#666666',
                              fontSize: '11px',
                              fontFamily: '"Space Mono", monospace',
                              fontStyle: 'italic'
                            }}>
                              🎭 {transition.mood} • ⏱️ {transition.recommendedDuration}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right Panel - Preview */}
          <div style={{
            flex: 1,
            padding: '20px',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Preview Area */}
            <div style={{
              backgroundColor: '#1a1a1a',
              border: '1px solid #333333',
              borderRadius: '8px',
              padding: '20px',
              marginBottom: '20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              minHeight: '300px'
            }}>
              {/* Canvas for preview - larger */}
              <canvas
                ref={canvasRef}
                width={400}
                height={225}
                style={{
                  border: '1px solid #555555',
                  borderRadius: '8px',
                  backgroundColor: '#0a0a0a',
                  marginBottom: '20px',
                  maxWidth: '100%',
                  height: 'auto'
                }}
              />
              
              {/* Play Button */}
              <button
                onClick={playPreview}
                disabled={isPlaying}
                style={{
                  padding: '12px 24px',
                  backgroundColor: isPlaying ? '#333333' : '#4CAF50',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: isPlaying ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                  fontFamily: '"Space Mono", monospace',
                  fontWeight: 'bold',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isPlaying) {
                    e.currentTarget.style.backgroundColor = '#45a049';
                    e.currentTarget.style.transform = 'scale(1.02)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isPlaying) {
                    e.currentTarget.style.backgroundColor = '#4CAF50';
                    e.currentTarget.style.transform = 'scale(1)';
                  }
                }}
              >
                {isPlaying ? '⏸️ Playing...' : '▶️ Play Preview'}
              </button>
            </div>

            {/* Transition Info */}
            {selectedTransition && (
              <div style={{
                backgroundColor: '#1a1a1a',
                border: '1px solid #333333',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '20px'
              }}>
                <h4 style={{
                  color: '#ffffff',
                  fontSize: '16px',
                  marginBottom: '12px',
                  fontFamily: '"Space Mono", monospace'
                }}>
                  ℹ️ {selectedTransition.name}
                </h4>
                <p style={{
                  color: '#cccccc',
                  fontSize: '14px',
                  marginBottom: '8px',
                  fontFamily: '"Space Mono", monospace'
                }}>
                  {selectedTransition.description}
                </p>
                <div style={{
                  display: 'flex',
                  gap: '16px',
                  fontSize: '12px',
                  color: '#999999',
                  fontFamily: '"Space Mono", monospace'
                }}>
                  <span>🎭 {selectedTransition.mood}</span>
                  <span>⏱️ {selectedTransition.recommendedDuration}</span>
                </div>
              </div>
            )}

            {/* Duration Control */}
            <div style={{
              backgroundColor: '#1a1a1a',
              border: '1px solid #333333',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '20px'
            }}>
              <h4 style={{
                color: '#ffffff',
                fontSize: '16px',
                marginBottom: '12px',
                fontFamily: '"Space Mono", monospace'
              }}>
                ⏱️ Duration
              </h4>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <span style={{
                  color: '#cccccc',
                  fontSize: '14px',
                  fontFamily: '"Space Mono", monospace'
                }}>
                  {duration}ms
                </span>
                <input
                  type="range"
                  min="100"
                  max="2000"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value))}
                  style={{
                    flex: 1,
                    height: '4px',
                    backgroundColor: '#333333',
                    outline: 'none',
                    borderRadius: '2px'
                  }}
                />
              </div>
              <div style={{
                display: 'flex',
                gap: '8px',
                marginTop: '8px'
              }}>
                {[250, 500, 750, 1000, 1500].map(preset => (
                  <button
                    key={preset}
                    onClick={() => setDuration(preset)}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: duration === preset ? '#4CAF50' : '#333333',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '2px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      fontFamily: '"Space Mono", monospace'
                    }}
                  >
                    {preset}ms
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid #2a2a2b',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px',
          flexShrink: 0
        }}>
          <button 
            onClick={onClose}
            style={{
              padding: '8px 16px',
              backgroundColor: 'transparent',
              border: '1px solid #555555',
              borderRadius: '4px',
              color: '#cccccc',
              cursor: 'pointer',
              fontSize: '14px',
              fontFamily: '"Space Mono", monospace'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2a2a2b'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            style={{
              padding: '8px 16px',
              backgroundColor: '#4CAF50',
              border: 'none',
              borderRadius: '4px',
              color: '#ffffff',
              cursor: 'pointer',
              fontSize: '14px',
              fontFamily: '"Space Mono", monospace',
              fontWeight: 'bold'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#45a049'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4CAF50'}
          >
            Apply Transition
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransitionModal;
