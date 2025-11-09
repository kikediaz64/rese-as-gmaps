import { GoogleGenAI, GenerateContentResponse, Chat, Part, Type } from "@google/genai";
import { ReviewData } from '../types';

const ai = process.env.API_KEY ? new GoogleGenAI({ apiKey: process.env.API_KEY }) : null;

export const isApiKeySet = (): boolean => !!ai;

/**
 * Uses a reliable, non-AI reverse geocoding service to find a location name.
 */
export const getLocationNameFromCoords = async (lat: number, lon: number): Promise<string> => {
    try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&accept-language=es`;
        const response = await fetch(url, { headers: { 'User-Agent': 'TravelReviewAI/1.0' } });
        
        if (!response.ok) {
            throw new Error(`El servicio de geolocalización falló con el estado: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data && data.display_name) {
            return data.display_name;
        } else if (data.error) {
            throw new Error(`Error del servicio de geolocalización: ${data.error}`);
        } else {
            throw new Error("No se encontró un nombre de lugar en la respuesta del servicio de geolocalización.");
        }

    } catch (error) {
        console.error("Error in reverseGeocode:", error);
        throw new Error("No se pudo encontrar un nombre para estas coordenadas. Por favor, introdúcelo manualmente.");
    }
};


/**
 * Generates the review content using the AI, now that we have a confirmed location name.
 */
export const generateReview = async (lat: number, lon: number, placeName: string, imageFile?: {data: string, mimeType: string} | null): Promise<ReviewData> => {
    if (!ai) {
        throw new Error("El servicio de IA no está inicializado. Revisa la configuración de la API Key.");
    }

    if (!placeName || placeName.trim() === '') {
        throw new Error("El nombre del lugar es obligatorio para generar una reseña.");
    }
    
    try {
        // Stricter, more technical prompt to ensure JSON-only output
        const systemInstruction = `Eres un API de generación de reseñas de viajes. Tu única función es devolver un objeto JSON válido que se ajuste al esquema proporcionado. No incluyas texto explicativo, markdown, ni ningún carácter fuera del objeto JSON. La reseña debe ser creativa y atractiva, en español.`;
        
        let userQuery = `Escribe un título y el contenido de una reseña de viaje para el lugar llamado "${placeName}", ubicado cerca de las coordenadas (latitud: ${lat}, longitud: ${lon}).`;
        if (imageFile) {
            userQuery += ` Usa la foto adjunta como inspiración principal para el tono y los detalles de la reseña.`;
        }

        const parts: Part[] = [{ text: userQuery }];
        if (imageFile) {
            parts.push({ inlineData: { mimeType: imageFile.mimeType, data: imageFile.data } });
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts },
            config: {
                systemInstruction,
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        reviewTitle: { type: Type.STRING, description: "Un título creativo y atractivo para la reseña, en español." },
                        reviewContent: { type: Type.STRING, description: "El contenido completo de la reseña de viaje, escrito en un tono atractivo y en español." }
                    },
                    required: ['reviewTitle', 'reviewContent']
                }
            }
        });
        
        // More robust parsing: clean up potential markdown and trim whitespace
        let responseText = response.text.trim();
        const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (jsonMatch && jsonMatch[1]) {
            responseText = jsonMatch[1].trim();
        }

        const parsedResponse = JSON.parse(responseText);
        const { reviewTitle, reviewContent } = parsedResponse;

        // Stricter validation
        if (!reviewTitle || !reviewContent || reviewTitle.trim() === '' || reviewContent.trim() === '') {
            throw new Error("La IA generó una respuesta incompleta o vacía.");
        }
        
        return { locationName: placeName, reviewTitle, reviewContent };
    } catch (error: any) {
        // Log the full error object for detailed debugging
        console.error("Error detallado en generateReview:", JSON.stringify(error, null, 2));
        
        let errorMessage = "No se pudo generar la reseña. ";
        const errorString = JSON.stringify(error).toLowerCase();

        // Check for specific network/API key errors
        if (errorString.includes('rpc failed') || errorString.includes('xhr error') || errorString.includes('makersuite') || (error.code && error.code === 500)) {
            errorMessage += "Error de comunicación con el servicio de IA. Esto casi siempre se debe a un problema con la API Key. Por favor, revisa que tu clave sea válida y que la 'Generative Language API' esté habilitada en el proyecto de Google Cloud correcto. Si el problema persiste, intenta crear una nueva clave.";
        } else if (errorString.includes('json')) {
            errorMessage += "La IA devolvió un formato de respuesta inesperado. Por favor, intenta de nuevo.";
        } else if (error.message && typeof error.message === 'string' && error.message.includes('incompleta')) {
             errorMessage += "La respuesta de la IA no contenía todos los datos necesarios.";
        } else {
             errorMessage += "Ocurrió un error inesperado. Revisa la consola para más detalles.";
        }
        
        throw new Error(errorMessage);
    }
};


export const createChat = (): Chat => {
  if (!ai) {
    throw new Error("El servicio de IA no está inicializado. Revisa la configuración de la API Key.");
  }
  return ai.chats.create({
    model: 'gemini-2.5-flash',
  });
};