"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ShopForm from "@/components/shops/ShopForm";
import type { Database } from "@/types/database.types";
import type { ShopAttendance } from "@/types/shopAttendance";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

// 型定義
type Shop = Database['public']['Tables']['Shop']['Row'];
type Event = Database['public']['Tables']['Event']['Row'] & {
  EventDate: Database['public']['Tables']['EventDate']['Row'][]
};

// 明示的に型をエクスポート
export interface ClientWrapperProps {
  shop: Shop | null;
  event: Event | null;
  events: Event[];
}

// 明示的にReactコンポーネントとして型付け
const ClientWrapper: React.FC<ClientWrapperProps> = ({ shop, event, events }) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (updatedShop: Shop, attendances?: ShopAttendance[]) => {
    if (!shop) return;
    
    setIsLoading(true);
    try {
      const supabase = createClientComponentClient();
      
      // 出店者情報の更新
      const { error: shopUpdateError } = await supabase
        .from("Shop")
        .update({
          shop_code: updatedShop.shop_code,
          shop_name: updatedShop.shop_name,
          coffee_name: updatedShop.coffee_name,
          greeting: updatedShop.greeting,
          roast_level: updatedShop.roast_level,
          pr_url: updatedShop.pr_url,
          destiny_ratio: updatedShop.destiny_ratio,
          ticket_count: updatedShop.ticket_count,
          image_url: updatedShop.image_url,
          notes: updatedShop.notes,
          updated_at: new Date().toISOString()
        })
        .eq("id", shop.id);

      if (shopUpdateError) {
        throw new Error(`出店者情報の更新に失敗しました: ${shopUpdateError.message}`);
      }
      
      // 出店日情報の更新処理
      if (attendances && attendances.length > 0) {
        // すべてのShopAttendanceデータを取得（論理削除されたものも含む）
        const { data: allAttendances, error: fetchError } = await supabase
          .from("ShopAttendance")
          .select("*")
          .eq("shop_id", shop.id);
          
        if (fetchError) {
          throw new Error(`出店日情報の取得に失敗しました: ${fetchError.message}`);
        }
        
        // アクティブなデータ（deleted_atがnull）のみをフィルタリング
        const activeAttendances = allAttendances?.filter(a => a.deleted_at === null) || [];
        const activeAttendanceIds = activeAttendances.map(a => a.id);
        
        // 論理削除されたデータのマッピングを作成（event_date_idをキーとして）
        const deletedAttendancesMap = new Map();
        allAttendances?.forEach(a => {
          if (a.deleted_at !== null) {
            deletedAttendancesMap.set(a.event_date_id, a);
          }
        });
        
        // 更新する出店日を特定（現在アクティブなもの）
        const updateAttendances = attendances.filter(a => a.id && a.id !== '' && activeAttendanceIds.includes(a.id));
        
        // 削除する出店日を特定（現在アクティブで、新しいデータに含まれていないもの）
        const deleteAttendanceIds = activeAttendanceIds.filter(
          id => !attendances.some(a => a.id === id)
        );
        
        // 新規追加または復活させる出店日を処理
        for (const attendance of attendances) {
          // IDがないか空の場合は新規または復活候補
          if (!attendance.id || attendance.id === '') {
            // 論理削除されたデータがあるかチェック
            const deletedAttendance = deletedAttendancesMap.get(attendance.event_date_id);
            
            if (deletedAttendance) {
              // 論理削除されたデータが存在する場合は復活させる
              const { error: restoreError } = await supabase
                .from("ShopAttendance")
                .update({
                  deleted_at: null,
                  updated_at: new Date().toISOString()
                })
                .eq("id", deletedAttendance.id);
                
              if (restoreError) {
                throw new Error(`出店日情報の復活に失敗しました: ${restoreError.message}`);
              }
            } else {
              // 論理削除されたデータがない場合は新規追加
              const { error: insertError } = await supabase
                .from("ShopAttendance")
                .insert({
                  shop_id: shop.id,
                  event_date_id: attendance.event_date_id,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                });
                
              if (insertError) {
                throw new Error(`出店日情報の追加に失敗しました: ${insertError.message}`);
              }
            }
          }
        }
        
        // 更新処理
        for (const attendance of updateAttendances) {
          const { error: updateError } = await supabase
            .from("ShopAttendance")
            .update({
              updated_at: new Date().toISOString()
            })
            .eq("id", attendance.id);
            
          if (updateError) {
            throw new Error(`出店日情報の更新に失敗しました: ${updateError.message}`);
          }
        }
        
        // 削除処理（論理削除）
        if (deleteAttendanceIds.length > 0) {
          const { error: deleteError } = await supabase
            .from("ShopAttendance")
            .update({ 
              deleted_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .in("id", deleteAttendanceIds);
            
          if (deleteError) {
            throw new Error(`出店日情報の削除に失敗しました: ${deleteError.message}`);
          }
        }
      }

      alert("出店者情報を更新しました");
      router.push("/admin/shops");
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "出店者情報の更新に失敗しました");
      console.error("Shop update error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl py-6">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">出店者情報編集</h1>
      {shop ? (
        <ShopForm 
          shop={shop} 
          event={event} 
          events={events} 
          onSubmit={handleSubmit} 
          isLoading={isLoading}
        />
      ) : (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-md">
          <p className="text-amber-700">出店者情報の読み込み中にエラーが発生しました。</p>
        </div>
      )}
    </div>
  );
};

export default ClientWrapper;
