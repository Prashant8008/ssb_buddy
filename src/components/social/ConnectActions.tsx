import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, UserCheck, MessageCircle, Loader2, Clock, Users } from 'lucide-react';
import { cn } from '../../lib/utils';
import { NetworkService, ChatService, ProfileService } from '../../services/api';

export interface ConnectionStatus {
  is_self: boolean;
  is_following: boolean;
  followers_count: number;
  following_count: number;
  is_friend: boolean;
  friend_request: {
    id: number;
    status: string;
    direction: 'sent' | 'received';
  } | null;
}

interface ConnectActionsProps {
  userId: number;
  username: string;
  connection: ConnectionStatus | null;
  onConnectionChange?: (connection: ConnectionStatus) => void;
  size?: 'sm' | 'md';
  className?: string;
}

const ConnectActions: React.FC<ConnectActionsProps> = ({
  userId,
  username,
  connection,
  onConnectionChange,
  size = 'md',
  className,
}) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<'follow' | 'friend' | 'message' | 'accept' | null>(null);
  const [error, setError] = useState('');

  if (!connection || connection.is_self) return null;

  const refreshConnection = async () => {
    const res = await ProfileService.getConnectionStatus(username);
    onConnectionChange?.(res.data);
    return res.data as ConnectionStatus;
  };

  const handleFollow = async () => {
    setLoading('follow');
    setError('');
    try {
      await NetworkService.toggleFollow(userId);
      await refreshConnection();
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Failed to update follow status.');
    } finally {
      setLoading(null);
    }
  };

  const handleFriendRequest = async () => {
    setLoading('friend');
    setError('');
    try {
      await NetworkService.sendFriendRequest(userId);
      await refreshConnection();
    } catch (e: any) {
      const data = e.response?.data;
      const msg = typeof data === 'object'
        ? (data.detail || Object.values(data).flat().join(' '))
        : 'Failed to send friend request.';
      setError(String(msg));
    } finally {
      setLoading(null);
    }
  };

  const handleAccept = async () => {
    if (!connection.friend_request) return;
    setLoading('accept');
    setError('');
    try {
      await NetworkService.respondToFriendRequest(connection.friend_request.id, 'ACCEPTED');
      await refreshConnection();
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Failed to accept request.');
    } finally {
      setLoading(null);
    }
  };

  const handleMessage = async () => {
    setLoading('message');
    setError('');
    try {
      const res = await ChatService.getOrCreateDM(userId);
      navigate(`/chat?user=${userId}&conversation=${res.data.id}`);
    } catch {
      setError('Could not open chat. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const btnClass = size === 'sm'
    ? 'px-3 py-1.5 text-xs rounded-lg'
    : 'px-4 py-2 text-sm rounded-xl';

  const fr = connection.friend_request;

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {error && (
        <p className="w-full text-xs text-red-500 font-medium">{error}</p>
      )}

      <button
        type="button"
        onClick={handleMessage}
        disabled={!!loading}
        className={cn(
          btnClass,
          'font-bold flex items-center gap-1.5 bg-navy-900 text-white hover:bg-navy-800 transition-colors disabled:opacity-50'
        )}
      >
        {loading === 'message' ? <Loader2 className="animate-spin" size={14} /> : <MessageCircle size={14} />}
        Message
      </button>

      <button
        type="button"
        onClick={handleFollow}
        disabled={!!loading}
        className={cn(
          btnClass,
          'font-bold flex items-center gap-1.5 border transition-colors disabled:opacity-50',
          connection.is_following
            ? 'bg-navy-50 border-navy-200 text-navy-700 hover:bg-navy-100'
            : 'bg-white border-navy-200 text-navy-900 hover:border-gold-500'
        )}
      >
        {loading === 'follow' ? (
          <Loader2 className="animate-spin" size={14} />
        ) : connection.is_following ? (
          <UserCheck size={14} />
        ) : (
          <UserPlus size={14} />
        )}
        {connection.is_following ? 'Following' : 'Follow'}
      </button>

      {connection.is_friend ? (
        <span className={cn(btnClass, 'font-bold flex items-center gap-1.5 bg-green-50 text-green-700 border border-green-200')}>
          <Users size={14} /> Connected
        </span>
      ) : fr?.status === 'PENDING' && fr.direction === 'sent' ? (
        <span className={cn(btnClass, 'font-bold flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200')}>
          <Clock size={14} /> Request Sent
        </span>
      ) : fr?.status === 'PENDING' && fr.direction === 'received' ? (
        <button
          type="button"
          onClick={handleAccept}
          disabled={!!loading}
          className={cn(
            btnClass,
            'font-bold flex items-center gap-1.5 bg-gold-500 text-navy-900 hover:bg-gold-600 transition-colors disabled:opacity-50'
          )}
        >
          {loading === 'accept' ? <Loader2 className="animate-spin" size={14} /> : <UserPlus size={14} />}
          Accept Request
        </button>
      ) : (
        <button
          type="button"
          onClick={handleFriendRequest}
          disabled={!!loading}
          className={cn(
            btnClass,
            'font-bold flex items-center gap-1.5 bg-gold-500 text-navy-900 hover:bg-gold-600 transition-colors disabled:opacity-50'
          )}
        >
          {loading === 'friend' ? <Loader2 className="animate-spin" size={14} /> : <UserPlus size={14} />}
          Connect
        </button>
      )}
    </div>
  );
};

export default ConnectActions;
