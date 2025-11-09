import React, { useState, useRef, useEffect } from 'react';
import { generateReview, getLocationNameFromCoords } from '../services/geminiService';
import { saveReview } from '../services/storageService';
import { ReviewData } from '../types';
import { SparklesIcon } from './icons/SparklesIcon';
import { UploadIcon } from './icons/UploadIcon';
import { SaveIcon } from './icons/SaveIcon';
import { LocationIcon } from './icons/LocationIcon';
import { GmapsIcon } from './icons/GmapsIcon';
import exifr from 'exifr';

const ReviewGenerator: React.FC = () => {
  const [lat, setLat] = useState<string>('');
  const [lon, setLon] = useState<string>('');
  const [locationNameInput, setLocationNameInput] = useState<string>('');
  const [review, setReview] = useState<ReviewData | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState<boolean>(false);
  const [isFetchingLocation, setIsFetchingLocation] = useState<boolean>(false);
  const [isFetchingLocationName, setIsFetchingLocationName] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<{data: string, mimeType: string}[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      previewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);
  
  const isValidCoordinate = (val: string): boolean => {
      const num = parseFloat(val);
      return !isNaN(num) && isFinite(num);
  }

  useEffect(() => {
    const fetchLocationName = async () => {
        if (isValidCoordinate(lat) && isValidCoordinate(lon)) {
            setIsFetchingLocationName(true);
            setStatus("Identificando nombre del lugar...");
            setError(null);
            try {
                const name = await getLocationNameFromCoords(parseFloat(lat), parseFloat(lon));
                setLocationNameInput(name);
                setStatus("Nombre del lugar identificado. ¡Listo para generar!");
            } catch (err) {
                setError(err instanceof Error ? err.message : "Error desconocido al obtener el nombre del lugar.");
                setStatus(null);
            } finally {
                setIsFetchingLocationName(false);
            }
        }
    };

    const debounceTimer = setTimeout(() => {
        fetchLocationName();
    }, 500); // Add a small delay to avoid spamming the API while typing

    return () => clearTimeout(debounceTimer);
  }, [lat, lon]);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("La geolocalización no es compatible con tu navegador.");
      return;
    }

    setIsFetchingLocation(true);
    setError(null);
    setStatus('Obteniendo tu ubicación actual...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude.toFixed(6));
        setLon(position.coords.longitude.toFixed(6));
        // The useEffect will now automatically fetch the name
        setStatus('¡Ubicación actual obtenida!');
        setIsFetchingLocation(false);
      },
      (geoError) => {
        let errorMessage = 'No se pudo obtener la ubicación. ';
        switch(geoError.code) {
          case geoError.PERMISSION_DENIED:
            errorMessage += "Has denegado la solicitud de geolocalización.";
            break;
          case geoError.POSITION_UNAVAILABLE:
            errorMessage += "La información de ubicación no está disponible.";
            break;
          case geoError.TIMEOUT:
            errorMessage += "La solicitud para obtener la ubicación del usuario ha caducado.";
            break;
          default:
            errorMessage += "Ha ocurrido un error desconocido.";
            break;
        }
        setError(errorMessage);
        setStatus(null);
        setIsFetchingLocation(false);
      }
    );
  };

  const handlePhotoUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList: File[] = Array.from(files);
    
    setPreviewUrls(prevUrls => {
      prevUrls.forEach(URL.revokeObjectURL);
      return fileList.map(file => URL.createObjectURL(file));
    });

    const filePromises = fileList.map(file => {
        return new Promise<{data: string, mimeType: string}>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = (reader.result as string).split(',')[1];
                resolve({ data: base64String, mimeType: file.type });
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    });

    try {
        const base64Files = await Promise.all(filePromises);
        setImageFiles(base64Files);
    } catch (err) {
        setError("Error reading files.");
        return;
    }

    setIsProcessingPhoto(true);
    setError(null);
    setStatus('Procesando foto(s)...');
    setLat('');
    setLon('');
    setLocationNameInput('');
    setReview(null);

    let gpsFound = false;
    for (const file of fileList) {
      try {
        const gpsData = await exifr.gps(file);
        if (gpsData && gpsData.latitude !== undefined && gpsData.longitude !== undefined) {
          const currentLat = gpsData.latitude;
          const currentLon = gpsData.longitude;
          setLat(currentLat.toFixed(6));
          setLon(currentLon.toFixed(6));
          setStatus(`Datos GPS extraídos.`);
          gpsFound = true;
          break; 
        }
      } catch (err) {
        console.error(`Error procesando el archivo ${file.name} con exifr:`, err);
      }
    }

    if (!gpsFound) {
      setStatus('No se encontraron datos GPS. Por favor, introduce la ubicación de tu foto manualmente.');
      setError(null);
    }
    setIsProcessingPhoto(false);
  };
  
  const clearFiles = (clearInput = true) => {
     setPreviewUrls(urls => {
        urls.forEach(URL.revokeObjectURL);
        return [];
     });
     setImageFiles([]);
     if (clearInput && fileInputRef.current) {
        fileInputRef.current.value = "";
     }
  }

  const handleSave = () => {
    if (review) {
      const reviewToSave: ReviewData = {
        ...review,
        id: Date.now().toString(),
        images: imageFiles,
      };
      saveReview(reviewToSave);
      setStatus(`Reseña para "${review.locationName}" guardada correctamente.`);
      setCopyStatus(null);
      setReview(null);
      setLocationNameInput('');
      setLat('');
      setLon('');
      clearFiles();
    }
  };
  
  const handlePostToGmaps = () => {
      if (review && lat && lon) {
        navigator.clipboard.writeText(review.reviewContent)
          .then(() => {
              setCopyStatus('¡Reseña copiada! Abriendo Google Maps...');
              const query = encodeURIComponent(`${review.locationName} @${lat},${lon}`);
              const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
              window.open(url, '_blank', 'noopener,noreferrer');
              setTimeout(() => setCopyStatus(null), 3000);
          })
          .catch(err => {
              setCopyStatus('Error al copiar la reseña.');
              console.error('Failed to copy text: ', err);
          });
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lat || !lon) {
      setError('Por favor, proporciona latitud y longitud.');
      return;
    }
    if (!locationNameInput) {
        setError('Por favor, espera a que se identifique el nombre del lugar o introdúcelo manualmente.');
        return;
    }

    setIsGenerating(true);
    setError(null);
    setReview(null);
    setStatus('Escribiendo la reseña...');
    setCopyStatus(null);

    try {
      const latNum = parseFloat(lat);
      const lonNum = parseFloat(lon);
      
      const result = await generateReview(latNum, lonNum, locationNameInput, imageFiles.length > 0 ? imageFiles[0] : null);
      setReview(result);
      setStatus(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ha ocurrido un error desconocido.');
      setStatus(null);
    } finally {
      setIsGenerating(false);
    }
  };
  
  const isLoading = isGenerating || isProcessingPhoto || isFetchingLocation || isFetchingLocationName;
  const inputClasses = "w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition duration-200";
  
  const showMap = isValidCoordinate(lat) && isValidCoordinate(lon);

  return (
    <div className="bg-gray-800/50 p-6 rounded-xl shadow-2xl border border-gray-700 backdrop-blur-sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium text-gray-300">Introduce la ubicación</label>
            <button
              type="button"
              onClick={handleGetCurrentLocation}
              disabled={isLoading}
              className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Usar mi ubicación actual"
            >
              <LocationIcon />
              <span>{isFetchingLocation ? 'Obteniendo...' : 'Usar mi ubicación'}</span>
            </button>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <input
              type="text"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              placeholder="Latitud (ej: 40.7128)"
              className={inputClasses}
              disabled={isLoading}
            />
            <input
              type="text"
              value={lon}
              onChange={(e) => setLon(e.target.value)}
              placeholder="Longitud (ej: -74.0060)"
              className={inputClasses}
              disabled={isLoading}
            />
          </div>
           <p className="text-xs text-gray-400 px-1">ⓘ Las coordenadas GPS de las fotos pueden tener un pequeño margen de error. Ajústalas si es necesario.</p>
           <div>
              <label htmlFor="placeName" className="text-sm font-medium text-gray-300 mb-2 block">
                Nombre del lugar {isFetchingLocationName && <span className="text-xs text-indigo-400 animate-pulse"> (Identificando...)</span>}
              </label>
                <input
                  id="placeName"
                  type="text"
                  value={locationNameInput}
                  onChange={(e) => setLocationNameInput(e.target.value)}
                  placeholder="Ej: Museo de Arte Moderno, Café La Esquina"
                  className={inputClasses}
                  disabled={isLoading}
                />
            </div>
        </div>

        {showMap && (
          <div className="mt-4">
            <label className="text-sm font-medium text-gray-300 mb-2 block">Vista previa de la ubicación</label>
            <div className="h-48 rounded-lg overflow-hidden border-2 border-indigo-500 shadow-lg">
              <iframe
                title="Location Map"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${parseFloat(lon) - 0.01},${parseFloat(lat) - 0.01},${parseFloat(lon) + 0.01},${parseFloat(lat) + 0.01}&layer=mapnik&marker=${lat},${lon}`}
              ></iframe>
            </div>
          </div>
        )}

        <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-gray-600"></div>
            <span className="flex-shrink mx-4 text-gray-400 text-sm font-semibold">O</span>
            <div className="flex-grow border-t border-gray-600"></div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <button
            type="button"
            onClick={handlePhotoUploadClick}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <UploadIcon />
            Extraer de una foto
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange}
            multiple
            accept="image/jpeg,image/png,image/heic,image/heif"
            className="hidden"
          />
        </div>
        
        {previewUrls.length > 0 && (
          <div className="mt-4 space-y-2">
            <div className='flex justify-between items-center'>
                <h4 className="text-sm font-medium text-gray-300">Foto(s) seleccionada(s):</h4>
                <button type="button" onClick={() => clearFiles()} className="text-xs text-indigo-400 hover:text-indigo-300">Limpiar</button>
            </div>
            <div className="flex flex-wrap gap-2 p-2 bg-gray-900/50 rounded-lg border border-gray-700">
              {previewUrls.map((url, index) => (
                <img key={index} src={url} alt={`preview ${index}`} className="w-16 h-16 rounded-md object-cover" />
              ))}
            </div>
          </div>
        )}

        {status && <div className="mt-4 bg-blue-900/50 border border-blue-700 text-blue-300 px-4 py-3 rounded-lg text-center">{status}</div>}
        {error && <div className="mt-4 bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-center">{error}</div>}

        <div className="pt-4">
            <button
                type="submit"
                disabled={isLoading || !lat || !lon || !locationNameInput}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-base"
            >
                {isLoading ? (
                <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {status || 'Generando reseña...'}
                </>
                ) : (
                <>
                    <SparklesIcon />
                    Generar Reseña
                </>
                )}
            </button>
        </div>
      </form>
      
      {review && (
        <div className="mt-8 p-6 bg-gray-900/70 rounded-lg border border-gray-700 animate-fade-in">
          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-indigo-400">{review.reviewTitle}</h2>
          <h3 className="text-lg font-semibold text-gray-300 mt-1 mb-4">{review.locationName}</h3>
          <p className="text-gray-300 whitespace-pre-line leading-relaxed">{review.reviewContent}</p>

          {imageFiles.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-300 mb-2">Galería de fotos</h4>
              <div className="flex flex-wrap gap-3 p-2 bg-gray-800/50 rounded-lg border border-gray-700">
                {imageFiles.map((image, index) => (
                  <img
                    key={index}
                    src={`data:${image.mimeType};base64,${image.data}`}
                    alt={`review gallery ${index}`}
                    className="w-24 h-24 rounded-md object-cover"
                  />
                ))}
              </div>
            </div>
          )}

          {copyStatus && <div className="mt-4 bg-blue-900/50 border border-blue-700 text-blue-300 px-4 py-2 rounded-lg text-center text-sm">{copyStatus}</div>}

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={handleSave}
              className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-4 rounded-lg transition duration-200"
            >
              <SaveIcon />
              Guardar Reseña
            </button>
            <button
              type="button"
              onClick={handlePostToGmaps}
              className="w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-200 text-gray-800 font-bold py-3 px-4 rounded-lg transition duration-200"
            >
              <GmapsIcon />
              Publicar en Google Maps
            </button>
          </div>

        </div>
      )}
    </div>
  );
};

export default ReviewGenerator;