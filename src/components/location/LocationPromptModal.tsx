import React, { useState } from 'react';
import { MapPin, Loader2, X } from 'lucide-react';
import {
  captureAndSaveUserLocation,
  geolocationErrorMessage,
  markLocationSkipped,
} from '../../lib/userLocation';

interface LocationPromptModalProps {
  open: boolean;
  title?: string;
  description?: string;
  onClose: () => void;
  onSaved?: () => void;
  allowSkip?: boolean;
}

const LocationPromptModal: React.FC<LocationPromptModalProps> = ({
  open,
  title = 'Share your location',
  description = 'We use your location to show you on the Discover map and help you find nearby SSB aspirants. Your exact location is only stored on your profile.',
  onClose,
  onSaved,
  allowSkip = true,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleAllow = async () => {
    setLoading(true);
    setError(null);
    const precheck = geolocationErrorMessage();
    if (precheck) {
      setError(precheck);
      setLoading(false);
      return;
    }
    try {
      await captureAndSaveUserLocation();
      onSaved?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not get your location.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    markLocationSkipped();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-navy-900/40 backdrop-blur-sm">
      <div
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="location-prompt-title"
      >
        <div className="p-6">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-accent-100 flex items-center justify-center text-accent-600">
              <MapPin size={24} />
            </div>
            <button
              type="button"
              onClick={allowSkip ? handleSkip : onClose}
              className="p-2 text-navy-400 hover:text-navy-700 rounded-lg"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>

          <h2 id="location-prompt-title" className="text-xl font-display font-bold text-navy-900">
            {title}
          </h2>
          <p className="text-sm text-navy-600 mt-2 leading-relaxed">{description}</p>

          {error && (
            <p className="mt-4 text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl p-3">
              {error}
            </p>
          )}

          <div className="mt-6 flex flex-col gap-3">
            <button
              type="button"
              onClick={handleAllow}
              disabled={loading}
              className="w-full bg-accent-500 text-white font-bold py-3.5 rounded-xl hover:bg-accent-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Getting location...
                </>
              ) : (
                <>
                  <MapPin size={18} />
                  Allow location access
                </>
              )}
            </button>
            {allowSkip && (
              <button
                type="button"
                onClick={handleSkip}
                disabled={loading}
                className="w-full text-navy-500 text-sm font-medium py-2 hover:text-navy-800"
              >
                Not now
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationPromptModal;
