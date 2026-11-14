/**
 * Pluto OS - Desktop Operating System Environment
 * @license Apache-2.0
 */

import React from 'react';
import { FirebaseProvider } from './context/FirebaseContext';
import { OSProvider } from './context/OSContext';
import { Desktop } from './components/desktop/Desktop';

export default function App() {
  return (
    <FirebaseProvider>
      <OSProvider>
        <Desktop />
      </OSProvider>
    </FirebaseProvider>
  );
}
