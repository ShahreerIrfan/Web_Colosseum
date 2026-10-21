import { authApi } from '@/apis/auth/authApi';
import useToast from '@/hooks/component/useToast';
import type { SignUpRequest } from '@/types/api/authTypes';
import { setUserPayload } from '@/utils/localStorageUtils';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const useSignUp = () => {
  const [form, setForm] = useState<SignUpRequest>({
    name: '',
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
      const response = await authApi.signUp(form);
      setUserPayload(response.user);
      showSuccess('Account Created!', 'Welcome to the Colosseum Audio Tour Guide.');
      navigate('/home');
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Failed to create account. Please try again.';
      setError(msg);
      showError('Sign Up Error', msg);
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
