import { ToastProvider } from '@/providers/ToastProvider';
import { router } from '@/utils/route';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import './index.css';

// Ensure dark mode is disabled across the app
document.documentElement.classList.remove('dark');
try {
  localStorage.removeItem('theme');
} catch {
  // Ignore in environments where localStorage is restricted
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <RouterProvider router={router} />
    </ToastProvider>
  </StrictMode>
);
