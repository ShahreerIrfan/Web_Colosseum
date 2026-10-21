import { authApi } from '@/apis/auth/authApi';
import useToast from '@/hooks/component/useToast';
import type { SignInRequest } from '@/types/api/authTypes';
import { setUserPayload } from '@/utils/localStorageUtils';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const useSignIn = () => {
  const [form, setForm] = useState<SignInRequest>({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await authApi.signIn(form);
      setUserPayload(response.user);
      showSuccess('Welcome Back!', 'You have successfully signed in.');
      navigate('/admin/dashboard');
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Failed to sign in. Please check your credentials.';
      setError(msg);
      showError('Sign In Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return {
    form,
    loading,
    error,
    handleChange,
    handleSubmit,
  };
};
