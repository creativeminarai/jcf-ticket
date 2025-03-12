/**
 * 店舗コードユーティリティ
 * shop_codeの生成、解析、変換を行う関数群
 */

/**
 * shop_codeの構成要素を表すインターフェース
 */
export interface ShopCodeComponents {
  eventNumber: number | string;
  shopType: string;
  shopNumber: string;
  attendancePattern: string;
}

/**
 * 出店日情報のインターフェース
 */
export interface AttendanceDays {
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
  sunday: boolean;
}

// 特殊な出店パターンコード
export const SPECIAL_PATTERNS = {
  OTHER: '9999999',
  CANCELED: '8888888',
  UNDECIDED: '7777777',
};

/**
 * shop_codeを構成要素に分解する
 * @param shopCode '073-c001-0000011'形式の店舗コード
 * @returns 分解された構成要素
 */
export function parseShopCode(shopCode: string): ShopCodeComponents {
  const parts = shopCode.split('-');
  if (parts.length !== 3) {
    throw new Error('Invalid shop code format');
  }

  const eventNumber = parts[0];
  const shopTypeAndNumber = parts[1];
  const attendancePattern = parts[2];

  // 店舗タイプと番号を分離
  const shopType = shopTypeAndNumber.charAt(0);
  const shopNumber = shopTypeAndNumber.substring(1);

  return {
    eventNumber,
    shopType,
    shopNumber,
    attendancePattern,
  };
}

/**
 * 構成要素からshop_codeを生成する
 * @param components shop_codeの構成要素
 * @returns 生成されたshop_code
 */
export function generateShopCode(components: ShopCodeComponents): string {
  const { eventNumber, shopType, shopNumber, attendancePattern } = components;
  return `${eventNumber}-${shopType}${shopNumber}-${attendancePattern}`;
}

/**
 * 出席パターンのデフォルト値を取得
 * 現在は土日出席のデフォルト値を返す
 */
export function getDefaultAttendancePattern(): string {
  return "0000011";
}

/**
 * 出店パターンから出店日情報を生成する
 * @param pattern '0000011'のような出店パターン
 * @returns 曜日ごとの出店情報
 */
export function parseAttendancePattern(pattern: string): AttendanceDays {
  // 特殊パターンの場合はすべてfalseを返す
  if (
    pattern === SPECIAL_PATTERNS.OTHER ||
    pattern === SPECIAL_PATTERNS.CANCELED ||
    pattern === SPECIAL_PATTERNS.UNDECIDED
  ) {
    return {
      monday: false,
      tuesday: false,
      wednesday: false,
      thursday: false,
      friday: false,
      saturday: false,
      sunday: false,
    };
  }

  // パターンが7桁でない場合はエラー
  if (pattern.length !== 7) {
    throw new Error('Invalid attendance pattern length');
  }

  return {
    monday: pattern[0] === '1',
    tuesday: pattern[1] === '1',
    wednesday: pattern[2] === '1',
    thursday: pattern[3] === '1',
    friday: pattern[4] === '1',
    saturday: pattern[5] === '1',
    sunday: pattern[6] === '1',
  };
}

/**
 * 出店日情報から出店パターンを生成する
 * @param days 曜日ごとの出店情報
 * @returns '0000011'のような出店パターン
 */
export function generateAttendancePattern(days: AttendanceDays): string {
  const { monday, tuesday, wednesday, thursday, friday, saturday, sunday } = days;
  
  return `${monday ? '1' : '0'}${tuesday ? '1' : '0'}${wednesday ? '1' : '0'}${thursday ? '1' : '0'}${friday ? '1' : '0'}${saturday ? '1' : '0'}${sunday ? '1' : '0'}`;
}

/**
 * イベント日数が7日を超える場合、特殊パターンを返す
 * @param dates イベント日付の配列
 * @returns 適切な出店パターン
 */
export function handleExcessDays(dates: Date[]): string {
  if (dates.length <= 7) {
    return ''; // 通常の処理を行う
  }
  
  return SPECIAL_PATTERNS.OTHER; // 8日以上の場合はその他
}

/**
 * 出店パターンを人間が読みやすい形式に変換
 * @param pattern 出店パターン
 * @returns 人間が読みやすい説明
 */
export function formatAttendancePattern(pattern: string): string {
  if (pattern === SPECIAL_PATTERNS.OTHER) return 'その他';
  if (pattern === SPECIAL_PATTERNS.CANCELED) return 'キャンセル';
  if (pattern === SPECIAL_PATTERNS.UNDECIDED) return '未定';

  const days = parseAttendancePattern(pattern);
  const dayNames: string[] = [];
  
  if (days.monday) dayNames.push('月');
  if (days.tuesday) dayNames.push('火');
  if (days.wednesday) dayNames.push('水');
  if (days.thursday) dayNames.push('木');
  if (days.friday) dayNames.push('金');
  if (days.saturday) dayNames.push('土');
  if (days.sunday) dayNames.push('日');
  
  if (dayNames.length === 7) return '全日';
  if (dayNames.length === 0) return '出店なし';
  
  return dayNames.join('・');
}
