import React, { useState } from 'react';

interface APIKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface APIKeyResult {
  success: boolean;
  apiKey?: string;
  user?: {
    email: string;
    name: string;
  };
  message?: string;
  error?: string;
}

const APIKeyModal: React.FC<APIKeyModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    purpose: ''
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<APIKeyResult | null>(null);
  const [showResult, setShowResult] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.email.trim()) {
      setResult({
        success: false,
        error: 'Nombre y email son requeridos'
      });
      setShowResult(true);
      return;
    }

    setIsGenerating(true);
    setResult(null);
    setShowResult(false);

    try {
      const response = await fetch('/api/auth/generate-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      setResult(data);
      setShowResult(true);

      if (data.success) {
        // Clear form on success
        setFormData({
          name: '',
          email: '',
          purpose: ''
        });
      }
    } catch (error) {
      setResult({
        success: false,
        error: 'Error de conexión. Inténtalo de nuevo.'
      });
      setShowResult(true);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Could add a toast notification here
      console.log('✅ API key copied to clipboard');
    } catch (error) {
      console.error('❌ Failed to copy to clipboard:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  };

  const handleClose = () => {
    setResult(null);
    setShowResult(false);
    setFormData({
      name: '',
      email: '',
      purpose: ''
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-dark-800 rounded-lg shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-700">
          <h2 className="text-xl font-bold text-pink-500">🔑 Generar API Key</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Instructions */}
          <div className="bg-dark-700 border-l-4 border-pink-500 p-4 mb-6 rounded">
            <div className="text-sm text-gray-300">
              <strong className="text-white">Para usar el plugin de Figma:</strong><br />
              1. Genera tu API key aquí<br />
              2. Copia la key generada<br />
              3. Pégala en el plugin de Figma AnimaGen Exporter
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                Nombre completo:
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="Tu nombre"
                className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email:
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                placeholder="tu@email.com"
                className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="purpose" className="block text-sm font-medium text-gray-300 mb-2">
                Propósito (opcional):
              </label>
              <input
                type="text"
                id="purpose"
                name="purpose"
                value={formData.purpose}
                onChange={handleInputChange}
                placeholder="Ej: Plugin de Figma para presentaciones"
                className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={isGenerating}
              className="w-full py-3 px-4 bg-pink-500 text-white rounded-lg font-medium hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 focus:ring-offset-dark-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isGenerating ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generando...
                </div>
              ) : (
                'Generar API Key'
              )}
            </button>
          </form>

          {/* Result */}
          {showResult && result && (
            <div className={`mt-6 p-4 rounded-lg ${
              result.success 
                ? 'bg-green-900 border border-green-700 text-green-100' 
                : 'bg-red-900 border border-red-700 text-red-100'
            }`}>
              {result.success ? (
                <div>
                  <div className="font-medium mb-3">✅ API Key generada exitosamente!</div>
                  
                  <div className="mb-3">
                    <strong>Tu API Key:</strong>
                    <div className="bg-dark-700 p-3 rounded mt-2 font-mono text-sm break-all border border-dark-600">
                      {result.apiKey}
                    </div>
                    <button
                      onClick={() => copyToClipboard(result.apiKey!)}
                      className="mt-2 px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                    >
                      📋 Copiar
                    </button>
                  </div>
                  
                  <div className="text-sm">
                    <strong>⚠️ Importante:</strong> Guarda esta key en un lugar seguro. No la compartas con nadie.
                  </div>
                </div>
              ) : (
                <div>
                  <strong>❌ Error:</strong> {result.error}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default APIKeyModal;
