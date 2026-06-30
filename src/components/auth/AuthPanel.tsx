import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Lock,
  ChevronRight,
  Loader2,
  MapPin,
} from 'lucide-react';
import { AuthService, getNetworkErrorMessage } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import LocationPromptModal from '../location/LocationPromptModal';
import {
  applyPendingLocation,
  profileHasCoordinates,
  wasLocationSkipped,
  getCurrentPosition,
  reverseGeocode,
  stashPendingLocation,
  geolocationErrorMessage,
} from '../../lib/userLocation';
import { cn } from '../../lib/utils';

const LOCATION_PROMPT_SESSION_KEY = 'ssb_location_prompt_session';

export type AuthTab = 'login' | 'signup';

interface AuthPanelProps {
  tab: AuthTab;
  onTabChange: (tab: AuthTab) => void;
  variant?: 'hero' | 'hero-dark' | 'page';
  className?: string;
}

const inputHero =
  'w-full bg-white/90 border border-white/30 rounded-xl py-3 pl-10 pr-3 text-sm text-navy-900 placeholder:text-navy-400 focus:ring-2 focus:ring-accent-400 outline-none';
const inputHeroDark =
  'w-full bg-white/[0.08] border border-white/15 rounded-xl py-3 pl-10 pr-3 text-sm text-white placeholder:text-white/35 focus:ring-2 focus:ring-signal-500/50 focus:border-signal-500/30 outline-none transition-all';
const inputPage =
  'w-full bg-navy-50 border border-navy-200 rounded-xl py-3 pl-10 pr-3 text-sm focus:ring-2 focus:ring-accent-400 outline-none';

const btnPrimary =
  'w-full bg-accent-500 hover:bg-accent-600 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50';
const btnPrimaryDark =
  'w-full bg-signal-500 hover:bg-signal-400 text-midnight-950 font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-signal-500/20';
const btnSecondary =
  'w-full py-2.5 rounded-lg bg-accent-400 hover:bg-accent-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-50 transition-colors';
const btnSecondaryDark =
  'w-full py-2.5 rounded-lg bg-olive-800 hover:bg-olive-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-50 transition-colors border border-white/10';

const AuthPanel: React.FC<AuthPanelProps> = ({
  tab,
  onTabChange,
  variant = 'hero',
  className,
}) => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const isHero = variant === 'hero' || variant === 'hero-dark';
  const isDark = variant === 'hero-dark';
  const inputClass = isDark ? inputHeroDark : isHero ? inputHero : inputPage;
  const btnPrimaryClass = isDark ? btnPrimaryDark : btnPrimary;
  const btnSecondaryClass = isDark ? btnSecondaryDark : btnSecondary;

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('India');
  const [locationStatus, setLocationStatus] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [pendingCoords, setPendingCoords] = useState<{ latitude: number; longitude: number } | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);

  const finishLogin = () => {
    sessionStorage.setItem(LOCATION_PROMPT_SESSION_KEY, '1');
    navigate('/feed');
  };

  const handleUseLocation = async () => {
    setLocationLoading(true);
    setLocationStatus(null);
    const precheck = geolocationErrorMessage();
    if (precheck) {
      setLocationStatus(precheck);
      setLocationLoading(false);
      return;
    }
    try {
      const coords = await getCurrentPosition();
      const place = await reverseGeocode(coords.latitude, coords.longitude);
      setPendingCoords({ latitude: coords.latitude, longitude: coords.longitude });
      if (place) {
        setCity(place.city);
        setState(place.state);
        setCountry(place.country);
        setLocationStatus(`${place.city}${place.state ? `, ${place.state}` : ''}`);
      } else {
        setLocationStatus('GPS saved — will apply after login.');
      }
    } catch (err) {
      setLocationStatus(err instanceof Error ? err.message : 'Could not access location.');
    } finally {
      setLocationLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const response = await AuthService.login(username, password);
      login(response.data.access, response.data.refresh);
      sessionStorage.removeItem(LOCATION_PROMPT_SESSION_KEY);
      await applyPendingLocation();
      const hasCoords = await profileHasCoordinates();
      if (!hasCoords && !wasLocationSkipped()) {
        setShowLocationPrompt(true);
        return;
      }
      finishLogin();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      if (!axiosErr.response) {
        setErrorMsg(getNetworkErrorMessage());
      } else {
        setErrorMsg(axiosErr.response?.data?.detail || 'Invalid username or password.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await AuthService.register({
        first_name: firstName,
        last_name: lastName,
        username,
        email,
        password,
      });
      if (pendingCoords) {
        stashPendingLocation({
          coords: { ...pendingCoords },
          place: city || state ? { city, state, country } : undefined,
        });
      } else if (city || state) {
        stashPendingLocation({ place: { city, state, country } });
      }
      setSuccessMsg('Account created! Log in to enter the community.');
      onTabChange('login');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: Record<string, string | string[]> } };
      if (axiosErr.response?.data) {
        const errors = axiosErr.response.data;
        const messages = Object.keys(errors).map((key) => `${key}: ${errors[key]}`);
        setErrorMsg(messages.join(' | '));
      } else if (!axiosErr.response) {
        setErrorMsg(getNetworkErrorMessage());
      } else {
        setErrorMsg('Registration failed. Please check your inputs.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const switchTab = (next: AuthTab) => {
    setErrorMsg('');
    if (next === 'signup') setSuccessMsg('');
    onTabChange(next);
  };

  return (
    <>
      <div
        id="hero-auth"
        className={cn(
          'w-full max-w-md',
          isHero
            ? isDark
              ? 'bg-white/[0.06] backdrop-blur-xl rounded-2xl border border-white/12 shadow-2xl shadow-black/40'
              : 'bg-white/95 backdrop-blur-md rounded-2xl border border-white/40 shadow-2xl'
            : 'bg-white border border-navy-200/80 rounded-3xl shadow-sm',
          className
        )}
      >
        <div className={cn('p-5 sm:p-6', isHero && 'lg:p-7')}>
          <div className={cn('flex rounded-xl p-1 mb-5', isDark ? 'bg-white/[0.06]' : 'bg-navy-100/80')}>
            {(['login', 'signup'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => switchTab(t)}
                className={cn(
                  'flex-1 py-2.5 text-sm font-bold rounded-lg transition-all',
                  tab === t
                    ? isDark
                      ? 'bg-white/12 text-white shadow-sm'
                      : 'bg-white text-navy-900 shadow-sm'
                    : isDark
                      ? 'text-white/50 hover:text-white/80'
                      : 'text-navy-500 hover:text-navy-800'
                )}
              >
                {t === 'login' ? 'Login' : 'Sign Up'}
              </button>
            ))}
          </div>

          {successMsg && tab === 'login' && (
            <div className="mb-4 text-xs font-semibold text-accent-800 bg-accent-50 border border-accent-200 rounded-xl p-3">
              {successMsg}
            </div>
          )}
          {errorMsg && (
            <div className="mb-4 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">
              {errorMsg}
            </div>
          )}

          {tab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username"
                  className={inputClass}
                  disabled={isLoading}
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className={inputClass}
                  disabled={isLoading}
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className={cn(btnPrimaryClass, 'py-3.5')}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Signing in...
                  </>
                ) : (
                  <>
                    Report for Duty
                    <ChevronRight size={18} />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignup} className="flex flex-col">
              <div className="space-y-3 max-h-[200px] sm:max-h-[220px] overflow-y-auto pr-1">
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First name"
                    className={cn(inputClass, 'pl-3')}
                    disabled={isLoading}
                  />
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last name"
                    className={cn(inputClass, 'pl-3')}
                    disabled={isLoading}
                  />
                </div>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Username"
                    className={inputClass}
                    disabled={isLoading}
                  />
                </div>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    className={inputClass}
                    disabled={isLoading}
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password (min 8 chars)"
                    className={inputClass}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className={cn('mt-5 rounded-xl p-3 space-y-3 shrink-0', isDark ? 'border border-white/10 bg-white/[0.04]' : 'border border-navy-200/80 bg-navy-50/80')}>
                <p className={cn('text-xs font-bold flex items-center gap-1.5', isDark ? 'text-white/70' : 'text-navy-700')}>
                  <MapPin size={14} className={isDark ? 'text-signal-500' : 'text-accent-500'} />
                  Your location
                </p>
                <button
                  type="button"
                  onClick={handleUseLocation}
                  disabled={isLoading || locationLoading}
                  className={btnSecondaryClass}
                >
                  {locationLoading ? (
                    <>
                      <Loader2 className="animate-spin" size={14} />
                      Detecting...
                    </>
                  ) : (
                    <>
                      <MapPin size={14} />
                      Use my location
                    </>
                  )}
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="City"
                    className={cn(inputClass, 'pl-3 py-2 text-xs')}
                    disabled={isLoading}
                  />
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="State"
                    className={cn(inputClass, 'pl-3 py-2 text-xs')}
                    disabled={isLoading}
                  />
                </div>
                {locationStatus && (
                  <p className={cn('text-[10px]', isDark ? 'text-signal-400/90' : 'text-accent-600')}>{locationStatus}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={cn(btnPrimaryClass, 'py-3.5 mt-5 shrink-0')}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Creating account...
                  </>
                ) : (
                  <>
                    Join the Community
                    <ChevronRight size={18} />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>

      <LocationPromptModal
        open={showLocationPrompt}
        title="Enable location for SSB Connect"
        description="Allow location access so others can find you on the Discover map and you can see aspirants near you."
        onClose={finishLogin}
        onSaved={finishLogin}
      />
    </>
  );
};

export default AuthPanel;
