'use client';

import { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { ArrowPathIcon } from '@heroicons/react/24/solid';

export default function QRReader() {
  const [scannedCode, setScannedCode] = useState<string>('');
  const [scanner, setScanner] = useState<Html5QrcodeScanner | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string>('');

  // カメラのアクセス許可を要求する
  useEffect(() => {
    const requestCameraPermission = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: { exact: 'environment' } // 背面カメラを指定
          } 
        });
        // 許可された後にカメラを停止
        const tracks = await navigator.mediaDevices.getUserMedia({ video: true });
        tracks.getTracks().forEach(track => track.stop());
        setCameraError('');
      } catch (error) {
        console.error('カメラのアクセス許可が拒否されました:', error);
        setCameraError('カメラへのアクセスが許可されていません。ブラウザの設定を確認してください。');
      }
    };

    requestCameraPermission();
  }, []);

  useEffect(() => {
    const qrScanner = new Html5QrcodeScanner(
      'reader',
      {
        qrbox: {
          width: 250,
          height: 250,
        },
        fps: 10,
        videoConstraints: {
          facingMode: { exact: 'environment' }, // 背面カメラを指定
        },
      },
      false
    );

    setIsScanning(true);
    
    qrScanner.render(
      (decodedText) => {
        setScannedCode(decodedText);
        setIsScanning(false);
        try {
          qrScanner.pause(true);
        } catch (error) {
          console.warn('Scanner pause failed:', error);
        }
      },
      (error) => {
        console.warn(error);
      }
    );

    setScanner(qrScanner);

    return () => {
      if (qrScanner) {
        qrScanner.clear();
      }
    };
  }, []);

  const handleReset = () => {
    setScannedCode('');
    if (scanner && !isScanning) {
      try {
        scanner.resume();
        setIsScanning(true);
      } catch (error) {
        console.warn('Scanner resume failed:', error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="relative px-4 py-10 bg-white mx-8 md:mx-0 shadow rounded-3xl sm:p-10">
          <div className="max-w-md mx-auto">
            <div className="divide-y divide-gray-200">
              <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                <h2 className="text-2xl font-bold mb-8 text-center text-gray-800">
                  QRコードリーダー
                </h2>
                {cameraError && (
                  <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-200 dark:text-red-800" role="alert">
                    {cameraError}
                  </div>
                )}
                <div id="reader" className="w-full"></div>
                {scannedCode && (
                  <div className="mt-4">
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700">
                        スキャン結果:
                      </label>
                      <input
                        type="text"
                        value={scannedCode}
                        readOnly
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                      />
                    </div>
                    <button
                      onClick={handleReset}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <ArrowPathIcon className="h-5 w-5 mr-2" />
                      再スキャン
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
