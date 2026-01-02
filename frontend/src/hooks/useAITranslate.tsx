// src/hooks/useAITranslate.tsx
import { useState, useEffect, useCallback } from 'react';
// GoogleGenAI import is removed as translation is disabled.

const useAITranslate = (
  originalText: string | undefined | null,
  targetLanguageCode: string, // Kept for signature compatibility, but not used
  sourceLanguageCode: string = 'en' // Kept for signature compatibility
) => {
  const [translatedText, setTranslatedText] = useState(originalText || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Since i18n is removed, we no longer perform translation.
    // We just set the original text.
    setTranslatedText(originalText || '');
    setIsLoading(false);
    setError(null); 
  }, [originalText]);

  // The translateText function is no longer needed as we're not calling an API.
  // Components relying on this hook will now just get the original text.

  return { translatedText, isLoading, error };
};

export default useAITranslate;