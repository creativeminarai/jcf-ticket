'use client';

import { useState, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { ArrowPathIcon } from '@heroicons/react/24/solid';

export default function QRReader() {
  const [scannedCode, setScannedCode] = useState<string>('');
  const [scanner, setScanner] = useState<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string>('');

  useEffect(() => {
    let currentScanner: Html5Qrcode | null = null;

    const initializeScanner = async (): Promise<void> => {
      try {
        if (!document.getElementById('reader')) {
          console.error('Reader element not found');
          return;
        }

        // カメラの初期化を試みる
        currentScanner = new Html5Qrcode('reader');
        setScanner(currentScanner);

        // カメラを起動してスキャンを開始
        await currentScanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText: string) => {
            setScannedCode(decodedText);
            setIsScanning(false);
            currentScanner?.pause(true);
          },
          (error: string) => {
            console.warn('QRスキャンエラー:', error);
          }
        );

        setIsScanning(true);
        setCameraError('');
      } catch (error) {
        console.error('カメラの初期化エラー:', error);
        if (error instanceof Error && error.message.includes('NotAllowedError')) {
          setCameraError('カメラへのアクセスが許可されていません。ブラウザの設定を確認してください。');
        } else {
          setCameraError('カメラの初期化中にエラーが発生しました。ページを更新してください。');
        }
      }
    };

    initializeScanner();

    // クリーンアップ
    return () => {
      if (currentScanner) {
        currentScanner.stop().catch((error) => {
          console.error('Scanner cleanup error:', error);
        });
      }
    };
  }, []); // 依存配列を空にする

  const handleReset = async (): Promise<void> => {
    try {
      setScannedCode('');
      setCameraError('');

      if (!scanner) {
        throw new Error('スキャナーが初期化されていません');
      }

      if (isScanning) {
        await scanner.pause(true);
      }

      await scanner.resume();
      
      setIsScanning(true);
    } catch (error) {
      console.error('再スキャン時のエラー:', error);
      setCameraError('カメラの再起動に失敗しました。ページを更新してください。');
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
