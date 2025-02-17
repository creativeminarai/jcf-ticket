'use client';

import { useState, useEffect } from 'react';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';
import { ArrowPathIcon } from '@heroicons/react/24/solid';

export default function QRReader() {
  const [scannedCode, setScannedCode] = useState<string>('');
  const [scanner, setScanner] = useState<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string>('');

  useEffect(() => {
    const initializeScanner = async () => {
      try {
        // カメラのアクセス許可を要求
        await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { exact: 'environment' }
          }
        });

        // Html5Qrcodeを初期化
        const html5QrCode = new Html5Qrcode('reader');
        setScanner(html5QrCode);

        // カメラを起動してスキャンを開始
        await html5QrCode.start(
          { facingMode: { exact: 'environment' } },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            setScannedCode(decodedText);
            setIsScanning(false);
            html5QrCode.pause(true);
          },
          (error) => {
            console.warn(error);
          }
        );

        setIsScanning(true);
        setCameraError('');
      } catch (error) {
        console.error('カメラの初期化エラー:', error);
        setCameraError('カメラへのアクセスが許可されていません。ブラウザの設定を確認してください。');
      }
    };

    initializeScanner();

    // クリーンアップ
    return () => {
      if (scanner) {
        scanner.stop();
      }
    };
  }, []);



  const handleReset = async () => {
    setScannedCode('');
    if (scanner && !isScanning) {
      try {
        await scanner.start(
          { facingMode: { exact: 'environment' } },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            setScannedCode(decodedText);
            setIsScanning(false);
            scanner.pause(true);
          },
          (error) => {
            console.warn(error);
          }
        );
        setIsScanning(true);
      } catch (error) {
        console.warn('Scanner restart failed:', error);
        setCameraError('カメラの再起動に失敗しました。ページを更新してください。');
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
