import { Snowflake } from 'nodejs-snowflake';

/**
 * 下划线转驼峰
 * @param str
 * @returns
 */
export function toCamelCase(str: string): string {
  return str.replace(/_(\w)/g, (_, c) => c.toUpperCase());
}

/**
 * 驼峰命名转下划线
 * @param str
 * @returns
 */
export function toUnderline(str) {
  return str.replace(/([A-Z])/g, '_$1').toLowerCase();
}

/**
 * 对象 key 下划线转驼峰
 */
export function objAttrToCamel(target: Record<string, any>, cutStr?: string) {
  const _target = {};
  Object.keys(target).forEach((k) => {
    let _k = k;
    if (!!cutStr) {
      _k = _k.replace(cutStr, '');
    }
    _k = toCamelCase(_k);
    _target[_k] = target[k];
  });
  return _target;
}

/**
 * 对象 key 下划线转驼峰，驼峰转下划线
 * @param target 目标
 * @param cutStr 对象 key 裁剪字段
 * @returns
 */
export function objAttrToUnderline(
  target: Record<string, any>,
  cutStr?: string,
) {
  const _target = {};
  Object.keys(target).forEach((k) => {
    let _k = k;
    if (!!cutStr) {
      _k = _k.replace(cutStr, '');
    }
    _k = toUnderline(_k);
    _target[_k] = target[k];
  });
  return _target;
}

export const INSTANCE_ID = process.env.INSTANCE_ID
  ? Number(process.env.INSTANCE_ID)
  : Math.floor(Math.random() * 4096);

const uid = new Snowflake({ instance_id: INSTANCE_ID });

/**
 * 生成唯一标识，使用雪花算法
 */
export function guid(): string {
  return uid.getUniqueID().toString();
}

export function generateRandomString() {
  let result = '';
  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 9; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

export function JSONParse<T = any>(str: string, defaultValue = null): T | null {
  try {
    return JSON.parse(str) as T;
  } catch (e) {
    console.error('JSONParse error: ', e, str);
    return defaultValue;
  }
}

export function modelIdToStyleId(modelId: string) {
  const modelIds = ['1', '4', '5'];
  if (modelIds.includes(modelId)) {
    return modelIds;
  }
  const realModelId = ['6', '23'];
  if (realModelId.includes(modelId)) {
    return realModelId;
  }
  return [modelId];
}

export function hackyRemoveWatermark(
  rawURL: string,
  { removeWatermark = true }: { removeWatermark: boolean },
) {
  try {
    const url = new URL(rawURL);
    const host = url.host;
    if (host !== 'cdn.brmgo.cn' && host !== 'dvw2uodavfa05.cloudfront.net') {
      return rawURL;
    }
    url.host = process.env.S3_CDN_HOST || url.host;
    url.pathname = url.pathname
      .replace('/aigc-test/', '')
      .replace('/aigc/', '')
      .replace('/video/', '/videos/');
    if (removeWatermark) {
      url.pathname = url.pathname.replace(/_w\.jpg$/, '.jpg');
    }
    return url.toString();
  } catch (e) {
    console.error('failed remove watermark', e, rawURL);
    return rawURL;
  }
}

export function restoreVideoURLFromCDN(rawURL: string) {
  try {
    const url = new URL(rawURL);
    const host = url.host;
    if (host !== 'cdn.brmgo.cn') {
      return rawURL;
    }
    url.host = process.env.VIDEO_S3_CDN_HOST || url.host;
    url.pathname = url.pathname.replace('/video/', '/videos/');
    return url.toString();
  } catch (e) {
    console.error('failed remove watermark', e, rawURL);
    return rawURL;
  }
}

export function serializeBigInts(obj: any): any {
  return JSON.parse(
    JSON.stringify(obj, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value,
    ),
  );
}

export function formatDate(
  date: Date | string,
  useUTC: boolean = false,
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    console.error('Invalid date:', date);
    return '';
  }

  if (useUTC) {
    const year = dateObj.getUTCFullYear();
    const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } else {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
