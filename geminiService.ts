import { GoogleGenAI, Type, Modality } from "@google/genai";

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API_KEY is not set in process.env");
    throw new Error("API Key is missing. Please ensure process.env.API_KEY is available.");
  }
  return new GoogleGenAI({ apiKey });
};

// Helper to convert blob to base64
export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove data url prefix (e.g. "data:image/jpeg;base64,")
      resolve(base64String.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const translateText = async (
  text: string,
  targetLang: string,
  sourceLang: string = 'auto'
): Promise<{ translatedText: string; detectedLanguage: string }> => {
  const ai = getAiClient();
  const modelId = 'gemini-2.5-flash';

  const prompt = `
    Task: Translate the following text.
    Source Language: ${sourceLang === 'auto' ? 'Auto-detect' : sourceLang}
    Target Language: ${targetLang}
    Text: "${text}"
    
    Output JSON format:
    {
      "translatedText": "string",
      "detectedLanguage": "string (name of language detected)"
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            translatedText: { type: Type.STRING },
            detectedLanguage: { type: Type.STRING },
          },
        },
      },
    });

    const json = JSON.parse(response.text || '{}');
    return {
      translatedText: json.translatedText || "Translation failed",
      detectedLanguage: json.detectedLanguage || "Unknown",
    };
  } catch (error) {
    console.error("Translation Error:", error);
    throw error;
  }
};

export const processImageOrFile = async (
  base64Data: string,
  mimeType: string,
  targetLang: string,
  isDocument: boolean = false
): Promise<{ originalText: string; translatedText: string }> => {
  const ai = getAiClient();
  const modelId = 'gemini-2.5-flash'; // Good for multimodal

  const promptText = isDocument 
    ? `Extract text from this document and translate it to ${targetLang}. Return the original extracted text and the translation.`
    : `Describe/Extract text from this image and translate the text found to ${targetLang}. If no text is found, describe the image in ${targetLang}.`;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          },
          { text: promptText }
        ]
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            originalText: { type: Type.STRING, description: "Extracted text from the file/image" },
            translatedText: { type: Type.STRING, description: "The translation of the extracted text" },
          },
        },
      }
    });

    const json = JSON.parse(response.text || '{}');
    return {
        originalText: json.originalText || "(No text detected)",
        translatedText: json.translatedText || "(No translation generated)"
    };

  } catch (error) {
    console.error("File/Image Processing Error:", error);
    throw error;
  }
};

export const processAudio = async (
  audioBlob: Blob,
  targetLang: string
): Promise<{ transcription: string; translation: string }> => {
  const ai = getAiClient();
  const base64Audio = await blobToBase64(audioBlob);
  // gemini-2.5-flash supports audio input
  const modelId = 'gemini-2.5-flash'; 

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'audio/mp3', // Generic container often accepted, or match source. Chrome MediaRecorder usually produces webm/ogg.
              data: base64Audio
            }
          },
          {
            text: `Transcribe this audio exactly as spoken, and then translate it to ${targetLang}. Return JSON.`
          }
        ]
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                transcription: { type: Type.STRING },
                translation: { type: Type.STRING }
            }
        }
      }
    });

    const json = JSON.parse(response.text || '{}');
    return {
        transcription: json.transcription || "",
        translation: json.translation || ""
    };

  } catch (error) {
    console.error("Audio Processing Error:", error);
    throw error;
  }
};

export const generateSpeech = async (text: string, voiceName: string = 'Kore'): Promise<ArrayBuffer> => {
    const ai = getAiClient();
    // Use the dedicated TTS model
    const modelId = 'gemini-2.5-flash-preview-tts';
    
    try {
        const response = await ai.models.generateContent({
            model: modelId,
            contents: [{ parts: [{ text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName }
                    }
                }
            }
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) {
            throw new Error("No audio data returned");
        }
        
        // Decode base64 to ArrayBuffer for playback
        const binaryString = atob(base64Audio);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;

    } catch (error) {
        console.error("TTS Error:", error);
        throw error;
    }
}
