
import React from 'react';
import { AppProvider } from '../contexts/AppContext';
import { Layout } from '../components/Layout';

const Index = () => {
  return (
    <AppProvider>
      <Layout />
    </AppProvider>
  );
};

export default Index;
