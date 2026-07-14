'use client';
import React from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function ToastProvider() {
  return (
    <ToastContainer
      position="bottom-center"
      autoClose={4500}
      hideProgressBar
      closeOnClick
      pauseOnHover={false}
      draggable={false}
      limit={3}
      toastStyle={{
        fontSize: '14px',
        borderRadius: '8px',
        fontFamily: 'Pretendard, sans-serif',
      }}
    />
  );
}
