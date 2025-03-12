"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

type EventDate = {
  date: string;
  time: string;
};

export default function NewEventPage() {
  const router = useRouter();
  const [eventDates, setEventDates] = useState<EventDate[]>([{ date: "", time: "" }]);
  const [formData, setFormData] = useState({
    name: "",
    theme: "",
    country: "日本",
    prefecture: "",
    city: "",
    receptionLocation: "",
    venueUrl: "",
    venuePhone: "",
  });
  
  // 画像アップロード関連の状態
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addEventDate = () => {
    setEventDates([...eventDates, { date: "", time: "" }]);
  };

  const removeEventDate = (index: number) => {
    setEventDates(eventDates.filter((_, i) => i !== index));
  };

  const updateEventDate = (index: number, field: keyof EventDate, value: string) => {
    const newDates = [...eventDates];
    newDates[index][field] = value;
    setEventDates(newDates);
  };

  // 画像選択ハンドラー
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setUploadError(null);
    
    if (file) {
      // 画像ファイルのみ許可
      if (!file.type.startsWith('image/')) {
        setUploadError('画像ファイルのみアップロードできます');
        return;
      }
      
      // ファイルサイズ制限（5MB）
      if (file.size > 5 * 1024 * 1024) {
        setUploadError('ファイルサイズは5MB以下にしてください');
        return;
      }
      
      setImageFile(file);
      
      // 画像プレビューを設定
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImageFile(null);
      setImagePreview(null);
    }
  };
  
  // 画像クリアボタンハンドラー
  const handleClearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    setUploadError(null);
    
    try {
      const supabase = createClientComponentClient();
      let imageUrl = null;
      
      // 画像が選択されていればアップロード
      if (imageFile) {
        // API経由で画像をアップロード
        const uploadFormData = new FormData();
        uploadFormData.append('file', imageFile);
        // イベント名を追加してわかりやすいファイル名を生成
        uploadFormData.append('eventName', formData.name || 'event');
        
        const response = await fetch('/api/uploadImage', {
          method: 'POST',
          body: uploadFormData,
        });
        
        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(`画像のアップロードに失敗しました: ${result.error || response.statusText}`);
        }
        
        // 成功したら返されたURLを使用
        // APIが返す複数のURL形式から適切なものを選択する
        imageUrl = result.url || result.directUrl;
      }
      
      // まずイベント会場情報を登録
      const { data: venueData, error: venueError } = await supabase
        .from('EventVenue')
        .insert({
          country: formData.country,
          prefecture: formData.prefecture,
          city: formData.city,
          reception_location: formData.receptionLocation,
          venue_url: formData.venueUrl,
          venue_phone: formData.venuePhone
        })
        .select();
      
      if (venueError) {
        throw new Error(`会場情報の登録に失敗しました: ${venueError.message}`);
      }
      
      if (!venueData || venueData.length === 0) {
        throw new Error(`会場情報が正しく返されませんでした`);
      }
      
      const venueId = venueData[0].id;
      
      // イベントの基本情報を登録
      const { data: eventData, error: eventError } = await supabase
        .from('Event')
        .insert({
          name: formData.name,
          theme: formData.theme,
          event_venue_id: venueId,
          status: 'draft',
          image_url: imageUrl,  // 画像アップロードのURLを保存
        })
        .select();
      
      if (eventError) {
        throw new Error(`イベントの登録に失敗しました: ${eventError.message}`);
      }
      
      if (!eventData || eventData.length === 0) {
        throw new Error(`イベントデータが正しく返されませんでした`);
      }
      
      const eventId = eventData[0].id;
      
      // イベント日付を登録
      if (eventDates.length > 0) {
        const validEventDates = eventDates.filter(date => date.date && date.time);
        
        if (validEventDates.length > 0) {
          const eventDateRecords = validEventDates.map(date => ({
            event_id: eventId,
            date: date.date,
            time: date.time
          }));
          
          const { error: dateError } = await supabase
            .from('EventDate')
            .insert(eventDateRecords);
          
          if (dateError) {
            throw new Error(`イベント日付の登録に失敗しました: ${dateError.message}`);
          }
        }
      }
      
      alert('イベントを登録しました');
      router.push("/admin/events");
    } catch (error) {
      if (error instanceof Error) {
        alert(`エラーが発生しました: ${error.message}`);
      } else {
        alert('予期せぬエラーが発生しました');
      }
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">新規イベント登録</h1>
        <p className="mt-2 text-sm text-gray-700">
          新しいイベントの情報を入力してください
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* イベント基本情報 */}
        <div className="space-y-6 bg-white p-6 shadow sm:rounded-lg">
          <h2 className="text-lg font-medium text-gray-900">イベント基本情報</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                イベント名
              </label>
              <input
                type="text"
                name="name"
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="theme" className="block text-sm font-medium text-gray-700">
                テーマ
              </label>
              <input
                type="text"
                name="theme"
                id="theme"
                value={formData.theme}
                onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>
        </div>

        {/* 開催日時 */}
        <div className="space-y-6 bg-white p-6 shadow sm:rounded-lg">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">開催日時</h2>
            <button
              type="button"
              onClick={addEventDate}
              className="inline-flex items-center rounded-md border border-transparent bg-indigo-100 px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-200"
            >
              日程を追加
            </button>
          </div>
          {eventDates.map((date, index) => (
            <div key={index} className="flex items-center space-x-4">
              <div className="flex-grow">
                <label className="block text-sm font-medium text-gray-700">
                  開催日 {index + 1}
                </label>
                <div className="mt-1 flex space-x-4">
                  <input
                    type="date"
                    required
                    value={date.date}
                    onChange={(e) => updateEventDate(index, "date", e.target.value)}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                  />
                  <input
                    type="text"
                    required
                    placeholder="10:00〜16:00"
                    value={date.time}
                    onChange={(e) => updateEventDate(index, "time", e.target.value)}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
              {eventDates.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeEventDate(index)}
                  className="mt-6 rounded-md border border-transparent bg-red-100 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-200"
                >
                  削除
                </button>
              )}
            </div>
          ))}
        </div>

        {/* イベント画像登録 */}
        <div className="space-y-6 bg-white p-6 shadow sm:rounded-lg">
          <h2 className="text-lg font-medium text-gray-900">イベント画像</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="image" className="block text-sm font-medium text-gray-700">
                イベントの画像を選択してください
              </label>
              <div className="mt-1 flex items-start space-x-4">
                <div className="w-full">
                  <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 rounded-md">
                    <div className="space-y-1 text-center">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                        aria-hidden="true"
                      >
                        <path
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <div className="flex justify-center text-sm text-gray-600">
                        <label
                          htmlFor="file-upload"
                          className="relative cursor-pointer bg-indigo-100 rounded-md px-3 py-2 font-medium text-indigo-600 hover:text-indigo-500 hover:bg-indigo-200 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                        >
                          <span>ファイルを選択</span>
                          <input
                            id="file-upload"
                            name="file-upload"
                            type="file"
                            ref={fileInputRef}
                            className="sr-only"
                            onChange={handleImageChange}
                            accept="image/*"
                          />
                        </label>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">画像ファイル（PNG, JPG, GIF）、サイズ上限5MB</p>
                    </div>
                  </div>
                </div>
                
                {/* 画像プレビュー */}
                {imagePreview && (
                  <div className="flex flex-col items-center">
                    <div className="relative w-32 h-32">
                      <Image 
                        src={imagePreview} 
                        alt="イベント画像プレビュー" 
                        fill
                        style={{ objectFit: "cover" }}
                        className="rounded-md"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleClearImage}
                      className="mt-2 inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      クリア
                    </button>
                  </div>
                )}
              </div>
              
              {/* エラーメッセージ */}
              {uploadError && (
                <p className="mt-2 text-sm text-red-600">{uploadError}</p>
              )}
            </div>
          </div>
        </div>
        
        {/* 開催場所 */}
        <div className="space-y-6 bg-white p-6 shadow sm:rounded-lg">
          <h2 className="text-lg font-medium text-gray-900">開催場所</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="prefecture" className="block text-sm font-medium text-gray-700">
                都道府県
              </label>
              <input
                type="text"
                name="prefecture"
                id="prefecture"
                required
                value={formData.prefecture}
                onChange={(e) => setFormData({ ...formData, prefecture: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                市区町村
              </label>
              <input
                type="text"
                name="city"
                id="city"
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="receptionLocation" className="block text-sm font-medium text-gray-700">
                受付場所
              </label>
              <input
                type="text"
                name="receptionLocation"
                id="receptionLocation"
                required
                value={formData.receptionLocation}
                onChange={(e) => setFormData({ ...formData, receptionLocation: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="venueUrl" className="block text-sm font-medium text-gray-700">
                会場URL
              </label>
              <input
                type="url"
                name="venueUrl"
                id="venueUrl"
                value={formData.venueUrl}
                onChange={(e) => setFormData({ ...formData, venueUrl: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="venuePhone" className="block text-sm font-medium text-gray-700">
                会場電話番号
              </label>
              <input
                type="tel"
                name="venuePhone"
                id="venuePhone"
                value={formData.venuePhone}
                onChange={(e) => setFormData({ ...formData, venuePhone: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.back()}
            disabled={isUploading}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            キャンセル
          </button>
          <button
            type="submit"
            disabled={isUploading}
            className={`rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none ${isUploading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
          >
            {isUploading ? '登録中...' : '登録'}
          </button>
        </div>
      </form>
    </div>
  );
}