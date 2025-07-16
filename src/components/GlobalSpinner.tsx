import React from 'react';
import { useLoading } from '../context/LoadingContext';
import '../assets/css/Spinner.css'; // Ensure you have a spinner.css file for styling   

const GlobalSpinner: React.FC = () => {
  const { loading } = useLoading();

  if (!loading) return null;

  return (
    <div className="spinner-overlay">
      <div className="spinner" />
    </div>
  );
};

export default GlobalSpinner;
