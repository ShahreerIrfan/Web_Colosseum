import { authApi } from '@/apis/auth/authApi';
import useToast from '@/hooks/component/useToast';
import { removeUserPayload } from '@/utils/localStorageUtils';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const useSignOut = () => {
  const [loading, setLoading] = useState(false);
  const { showInfo } = useToast();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await authApi.signOut();
    } finally {
      removeUserPayload();
      showInfo('Signed Out', 'You have been successfully logged out.');
      setLoading(false);
      navigate('/');
    }
  };

  return {
    signOut: handleSignOut,
    loading,
  };
};
