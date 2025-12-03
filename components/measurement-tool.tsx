'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Ruler, X, Save } from 'lucide-react';

// Usar a interface do storage.ts
import type { Measurement } from '@/lib/storage';

interface MeasurementToolProps {
  imageSrc: string;
  imageType: 'before' | 'after';
  imageIndex: number;
  measurements: Measurement[];
  onMeasurementsChange: (measurements: Measurement[]) => void;
  onClose: () => void;
  className?: string;
}

export function MeasurementTool({
  imageSrc,
  imageType,
  imageIndex,
  measurements,
  onMeasurementsChange,
  onClose,
  className = '',
}: MeasurementToolProps) {
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [currentMeasurement, setCurrentMeasurement] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const [editingMeasurement, setEditingMeasurement] = useState<Measurement | null>(null);
  const [scale, setScale] = useState(10); // 10 pixels = 1cm por padrão
  const [unit, setUnit] = useState<'px' | 'cm' | 'mm'>('cm');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filtrar medidas apenas desta imagem
  const currentImageMeasurements = measurements.filter(
    m => m.imageType === imageType && m.imageIndex === imageIndex
  );

  // Calcular distância em pixels
  const calculateDistance = (x1: number, y1: number, x2: number, y2: number): number => {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  };

  // Converter pixels para unidade selecionada
  const convertToUnit = (pixels: number): number => {
    switch (unit) {
      case 'cm':
        return pixels / scale;
      case 'mm':
        return (pixels / scale) * 10;
      default:
        return pixels;
    }
  };

  // Desenhar medições no canvas
  const drawMeasurements = useCallback(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Limpar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Desenhar todas as medições desta imagem
    currentImageMeasurements.forEach((measurement) => {
      const { startX: x1, startY: y1, endX: x2, endY: y2, length, label } = measurement;
      const mScale = measurement.scale || scale;
      const mUnit = measurement.unit || unit;
      const distance = length ?? calculateDistance(x1, y1, x2, y2);
      
      // Converter distância
      let displayDistance: number;
      switch (mUnit) {
        case 'cm':
          displayDistance = distance / mScale;
          break;
        case 'mm':
          displayDistance = (distance / mScale) * 10;
          break;
        default:
          displayDistance = distance;
      }

      // Desenhar linha
      ctx.strokeStyle = '#00A88F';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      // Desenhar pontos
      ctx.fillStyle = '#00A88F';
      ctx.beginPath();
      ctx.arc(x1, y1, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x2, y2, 4, 0, Math.PI * 2);
      ctx.fill();

      // Desenhar texto com medida
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;
      const text = label || `${displayDistance.toFixed(2)} ${mUnit}`;
      
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Contorno do texto
      ctx.strokeText(text, midX, midY - 20);
      ctx.fillText(text, midX, midY - 20);
    });

    // Desenhar medição atual (se estiver medindo)
    if (currentMeasurement) {
      const { x1, y1, x2, y2 } = currentMeasurement;
      const distance = calculateDistance(x1, y1, x2, y2);
      const displayDistance = convertToUnit(distance);

      // Linha
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Pontos
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.arc(x1, y1, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x2, y2, 4, 0, Math.PI * 2);
      ctx.fill();

      // Texto
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;
      const text = `${convertToUnit(distance).toFixed(2)} ${unit}`;
      
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.strokeText(text, midX, midY - 20);
      ctx.fillText(text, midX, midY - 20);
    }
  }, [currentImageMeasurements, currentMeasurement, scale, unit, calculateDistance, convertToUnit]);

  // Carregar imagem e configurar canvas
  useEffect(() => {
    const image = imageRef.current;
    const canvas = canvasRef.current;
    if (!image || !canvas) return;

    const handleImageLoad = () => {
      canvas.width = image.offsetWidth;
      canvas.height = image.offsetHeight;
      drawMeasurements();
    };

    if (image.complete) {
      handleImageLoad();
    } else {
      image.addEventListener('load', handleImageLoad);
      return () => image.removeEventListener('load', handleImageLoad);
    }
  }, [imageSrc, drawMeasurements]);

  // Atualizar desenho quando necessário
  useEffect(() => {
    drawMeasurements();
  }, [drawMeasurements]);

  // Handlers de mouse
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isMeasuring) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setCurrentMeasurement({ x1: x, y1: y, x2: x, y2: y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isMeasuring || !currentMeasurement) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setCurrentMeasurement({
      ...currentMeasurement,
      x2: x,
      y2: y,
    });
  };

  const handleMouseUp = () => {
    if (!isMeasuring || !currentMeasurement) return;

    const { x1, y1, x2, y2 } = currentMeasurement;
    const distance = calculateDistance(x1, y1, x2, y2);

    if (distance > 5) { // Mínimo de 5 pixels
      const newMeasurement: Measurement = {
        id: `measure_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        imageType,
        imageIndex,
        startX: x1,
        startY: y1,
        endX: x2,
        endY: y2,
        length: distance,
        scale,
        unit: unit || 'px',
      };

      setEditingMeasurement(newMeasurement);
      setIsMeasuring(false);
      setCurrentMeasurement(null);
    }
  };

  const handleSaveMeasurement = () => {
    if (!editingMeasurement) return;

    const label = prompt('Digite um rótulo para esta medida (opcional):');
    const updatedMeasurement = {
      ...editingMeasurement,
      label: label || undefined,
    };

    // Adicionar nova medida mantendo as outras
    const otherMeasurements = measurements.filter(
      m => !(m.imageType === imageType && m.imageIndex === imageIndex)
    );
    onMeasurementsChange([...otherMeasurements, updatedMeasurement]);
    setEditingMeasurement(null);
  };

  const handleDeleteMeasurement = (id: string) => {
    onMeasurementsChange(measurements.filter(m => m.id !== id));
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Controles */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <div 
          className="rounded-lg p-3 border"
          style={{
            backgroundColor: 'rgba(27, 60, 69, 0.95)',
            borderColor: 'rgba(232, 220, 192, 0.2)',
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Ruler className="w-4 h-4" style={{ color: '#E8DCC0' }} />
            <span className="text-sm font-medium" style={{ color: '#E8DCC0' }}>
              Ferramenta de Medição
            </span>
            <button
              onClick={onClose}
              className="ml-auto p-1 rounded hover:bg-white/10 transition-colors"
              style={{ color: '#E8DCC0' }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => {
                setIsMeasuring(!isMeasuring);
                setCurrentMeasurement(null);
              }}
              className={`w-full px-3 py-2 rounded text-sm font-medium transition-all ${
                isMeasuring ? 'opacity-100' : 'opacity-70'
              }`}
              style={{
                backgroundColor: isMeasuring ? '#00A88F' : 'rgba(232, 220, 192, 0.1)',
                color: isMeasuring ? '#FFFFFF' : '#E8DCC0',
              }}
            >
              {isMeasuring ? 'Medindo... (Clique e arraste)' : 'Iniciar Medição'}
            </button>

            <div className="flex gap-2">
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as 'px' | 'cm' | 'mm')}
                className="flex-1 px-2 py-1 rounded text-xs border"
                style={{
                  backgroundColor: 'rgba(232, 220, 192, 0.1)',
                  borderColor: 'rgba(232, 220, 192, 0.2)',
                  color: '#E8DCC0',
                }}
              >
                <option value="px">Pixels</option>
                <option value="cm">Centímetros</option>
                <option value="mm">Milímetros</option>
              </select>
              {unit !== 'px' && (
                <input
                  type="number"
                  value={scale}
                  onChange={(e) => setScale(Number(e.target.value))}
                  className="w-20 px-2 py-1 rounded text-xs border"
                  style={{
                    backgroundColor: 'rgba(232, 220, 192, 0.1)',
                    borderColor: 'rgba(232, 220, 192, 0.2)',
                    color: '#E8DCC0',
                  }}
                  placeholder="Escala"
                  title="Pixels por unidade"
                />
              )}
            </div>
          </div>
        </div>

        {/* Lista de medidas */}
        {currentImageMeasurements.length > 0 && (
          <div 
            className="rounded-lg p-3 border max-h-64 overflow-y-auto"
            style={{
              backgroundColor: 'rgba(27, 60, 69, 0.95)',
              borderColor: 'rgba(232, 220, 192, 0.2)',
            }}
          >
            <div className="text-xs font-medium mb-2" style={{ color: '#E8DCC0', opacity: 0.8 }}>
              Medidas ({currentImageMeasurements.length})
            </div>
            <div className="space-y-1">
              {currentImageMeasurements.map((measurement) => {
                const mScale = measurement.scale || scale;
                const mUnit = measurement.unit || unit;
                const distance = measurement.length ?? calculateDistance(
                  measurement.startX, measurement.startY,
                  measurement.endX, measurement.endY
                );
                let displayDistance: number;
                switch (mUnit) {
                  case 'cm':
                    displayDistance = distance / mScale;
                    break;
                  case 'mm':
                    displayDistance = (distance / mScale) * 10;
                    break;
                  default:
                    displayDistance = distance;
                }

                return (
                  <div
                    key={measurement.id}
                    className="flex items-center justify-between p-2 rounded text-xs hover:bg-white/5"
                    style={{ color: '#E8DCC0' }}
                  >
                    <span>
                      {measurement.label || `${displayDistance.toFixed(2)} ${mUnit}`}
                    </span>
                    <button
                      onClick={() => handleDeleteMeasurement(measurement.id)}
                      className="p-1 rounded hover:bg-white/10 transition-colors"
                      style={{ color: '#E8DCC0' }}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Imagem e Canvas */}
      <div className="relative">
        <img
          ref={imageRef}
          src={imageSrc}
          alt="Imagem para medição"
          className="max-w-full h-auto"
          draggable={false}
        />
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 pointer-events-none"
          style={{ cursor: isMeasuring ? 'crosshair' : 'default' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => {
            if (isMeasuring) {
              setIsMeasuring(false);
              setCurrentMeasurement(null);
            }
          }}
        />
      </div>

      {/* Modal para salvar medida */}
      {editingMeasurement && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
          onClick={() => setEditingMeasurement(null)}
        >
          <div 
            className="rounded-lg p-4 max-w-sm w-full"
            style={{ backgroundColor: '#1B3C45' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3">
              <div className="text-sm mb-2" style={{ color: '#E8DCC0' }}>
                Nova Medida: {editingMeasurement ? convertToUnit(editingMeasurement.length ?? calculateDistance(editingMeasurement.startX, editingMeasurement.startY, editingMeasurement.endX, editingMeasurement.endY)).toFixed(2) : '0.00'} {unit}
              </div>
              <input
                type="text"
                placeholder="Rótulo (opcional)"
                className="w-full px-3 py-2 rounded border text-sm"
                style={{
                  backgroundColor: 'rgba(232, 220, 192, 0.1)',
                  borderColor: 'rgba(232, 220, 192, 0.2)',
                  color: '#E8DCC0',
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveMeasurement();
                  }
                }}
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setEditingMeasurement(null)}
                className="flex-1 px-3 py-2 rounded text-sm font-medium border"
                style={{
                  backgroundColor: 'rgba(232, 220, 192, 0.05)',
                  color: '#E8DCC0',
                  borderColor: 'rgba(232, 220, 192, 0.1)',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveMeasurement}
                className="flex-1 px-3 py-2 rounded text-sm font-medium flex items-center justify-center gap-2"
                style={{ backgroundColor: '#00A88F', color: '#FFFFFF' }}
              >
                <Save className="w-4 h-4" />
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
