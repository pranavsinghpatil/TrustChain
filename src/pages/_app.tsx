import type { AppProps } from 'next/app';
import { Web3Provider } from '../contexts/Web3Context';
import { AuthProvider } from '../contexts/AuthContext';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <Web3Provider>
      <AuthProvider>
        <Component {...pageProps} />
      </AuthProvider>
    </Web3Provider>
  );
} 