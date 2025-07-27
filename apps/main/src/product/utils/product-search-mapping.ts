/**
 * 产品搜索语义映射工具
 * 将通用搜索词映射到具体品牌和相关术语
 */

// 手机类别映射
const PHONE_MAPPINGS = {
  base: ['手机', '电话', 'phone', 'smartphone', '智能手机', '通讯设备'],
  brands: [
    'iPhone',
    '苹果',
    'Apple',
    '三星',
    'Samsung',
    '华为',
    'Huawei',
    '小米',
    'Xiaomi',
    'OPPO',
    'vivo',
    '荣耀',
    'Honor',
    '一加',
    'OnePlus',
    '魅族',
    'Meizu',
    '红米',
    'Redmi',
  ],
  specs: [
    '5G',
    '4G',
    'Pro',
    'Max',
    'Plus',
    '旗舰',
    '超清',
    '高清',
    '大屏',
    '续航',
  ],
  models: [
    'iPhone 15',
    'iPhone 14',
    'iPhone 13',
    'iPhone 12',
    'iPhone 11',
    'iPhone X',
    'iPhone XR',
    'iPhone SE',
    'P40',
    'P50',
    'Mate',
    '小米13',
    '红米K60',
  ],
};

// 电脑/笔记本类别映射
const COMPUTER_MAPPINGS = {
  base: [
    '电脑',
    '笔记本',
    '笔记本电脑',
    '台式机',
    'PC',
    'computer',
    'laptop',
    'notebook',
  ],
  brands: [
    'MacBook',
    '苹果',
    'Apple',
    '联想',
    'Lenovo',
    '华为',
    'Huawei',
    '戴尔',
    'Dell',
    '惠普',
    'HP',
    '华硕',
    'Asus',
    '小米',
    'Xiaomi',
    '宏碁',
    'Acer',
    '微软',
    'Microsoft',
    '三星',
    'Samsung',
  ],
  specs: [
    'i7',
    'i5',
    'i9',
    'M1',
    'M2',
    'M3',
    '游戏本',
    '轻薄本',
    '商务本',
    'SSD',
    '固态',
    '独显',
    '集显',
  ],
  models: [
    'MacBook Pro',
    'MacBook Air',
    'ThinkPad',
    'MateBook',
    'XPS',
    'Surface',
    'ROG',
    '拯救者',
    'YOGA',
    'Alienware',
  ],
};

// 平板电脑类别映射
const TABLET_MAPPINGS = {
  base: ['平板', '平板电脑', 'tablet', 'pad'],
  brands: [
    'iPad',
    '苹果',
    'Apple',
    '华为',
    'Huawei',
    '三星',
    'Samsung',
    '小米',
    'Xiaomi',
    '联想',
    'Lenovo',
    '微软',
    'Microsoft',
  ],
  specs: ['Pro', 'Air', 'Mini', '全面屏', '超清', '高清', '大屏', '触控笔'],
  models: [
    'iPad Pro',
    'iPad Air',
    'iPad mini',
    'MatePad',
    'Galaxy Tab',
    'Surface Pro',
    'Surface Go',
    'Mi Pad',
  ],
};

// 智能手表/手环类别映射
const WEARABLE_MAPPINGS = {
  base: ['手表', '智能手表', '手环', '智能手环', 'watch', 'smartwatch', 'band'],
  brands: [
    'Apple Watch',
    '苹果手表',
    'Huawei Watch',
    '华为手表',
    '小米手表',
    'Xiaomi Watch',
    '三星手表',
    'Samsung Watch',
    'OPPO Watch',
  ],
  specs: ['健康监测', '心率', '血氧', '睡眠', '运动', '防水', 'GPS', '蓝牙'],
  models: ['Apple Watch Series', 'Watch GT', 'Galaxy Watch', 'Mi Band'],
};

// 耳机类别映射
const HEADPHONE_MAPPINGS = {
  base: [
    '耳机',
    '无线耳机',
    '蓝牙耳机',
    '降噪耳机',
    'headphone',
    'earphone',
    'earbud',
  ],
  brands: [
    'AirPods',
    '苹果耳机',
    'Huawei FreeBuds',
    '华为耳机',
    '小米耳机',
    'Xiaomi Buds',
    '索尼',
    'Sony',
    'Bose',
    '森海塞尔',
    'Sennheiser',
  ],
  specs: [
    '降噪',
    '无线',
    '蓝牙',
    '入耳式',
    '头戴式',
    '主动降噪',
    '高音质',
    '长续航',
  ],
  models: ['AirPods Pro', 'AirPods Max', 'FreeBuds Pro', 'WH-1000XM', 'QC'],
};

// 相机类别映射
const CAMERA_MAPPINGS = {
  base: ['相机', '照相机', '摄像机', 'camera', '单反', '微单'],
  brands: [
    '佳能',
    'Canon',
    '索尼',
    'Sony',
    '尼康',
    'Nikon',
    '富士',
    'Fujifilm',
    '徕卡',
    'Leica',
    '松下',
    'Panasonic',
  ],
  specs: ['全画幅', '高清', '4K', '防抖', '长焦', '广角', 'CMOS', '高像素'],
  models: ['EOS R', 'Alpha', 'Z系列', 'X-T', 'X-Pro', 'GH'],
};

// 游戏机类别映射
const CONSOLE_MAPPINGS = {
  base: ['游戏机', '主机', '掌机', 'console', 'playstation', 'xbox', 'switch'],
  brands: [
    '索尼',
    'Sony',
    '微软',
    'Microsoft',
    '任天堂',
    'Nintendo',
    'PlayStation',
    'Xbox',
    'Switch',
  ],
  specs: ['4K', '高清', '体感', '手柄', '无线', '蓝牙', 'HDR', '光驱'],
  models: [
    'PS5',
    'PS4',
    'Xbox Series X',
    'Xbox Series S',
    'Xbox One',
    'Nintendo Switch',
    'Switch Lite',
    'Switch OLED',
  ],
};

// 智能家居类别映射
const SMARTHOME_MAPPINGS = {
  base: [
    '智能家居',
    '智能设备',
    '智能音箱',
    'smart home',
    'smart device',
    'smart speaker',
  ],
  brands: [
    '小米',
    'Xiaomi',
    '华为',
    'Huawei',
    '亚马逊',
    'Amazon',
    '谷歌',
    'Google',
    '苹果',
    'Apple',
  ],
  specs: ['语音控制', '远程控制', '智能', '联网', 'WiFi', '蓝牙', '家庭中枢'],
  models: ['Echo', 'Alexa', 'Google Home', 'HomePod', '小爱同学', '天猫精灵'],
};

// 全部映射集合
const ALL_MAPPINGS = {
  phone: PHONE_MAPPINGS,
  computer: COMPUTER_MAPPINGS,
  tablet: TABLET_MAPPINGS,
  wearable: WEARABLE_MAPPINGS,
  headphone: HEADPHONE_MAPPINGS,
  camera: CAMERA_MAPPINGS,
  console: CONSOLE_MAPPINGS,
  smarthome: SMARTHOME_MAPPINGS,
};

/**
 * 关键词映射表 - 将常见搜索词映射到对应类别
 */
const KEYWORD_TO_CATEGORY = {
  // 手机相关
  手机: 'phone',
  电话: 'phone',
  phone: 'phone',
  smartphone: 'phone',
  智能手机: 'phone',

  // 电脑相关
  电脑: 'computer',
  笔记本: 'computer',
  笔记本电脑: 'computer',
  台式机: 'computer',
  PC: 'computer',
  computer: 'computer',
  laptop: 'computer',

  // 平板相关
  平板: 'tablet',
  平板电脑: 'tablet',
  tablet: 'tablet',
  pad: 'tablet',

  // 穿戴设备相关
  手表: 'wearable',
  智能手表: 'wearable',
  手环: 'wearable',
  watch: 'wearable',

  // 耳机相关
  耳机: 'headphone',
  无线耳机: 'headphone',
  蓝牙耳机: 'headphone',
  headphone: 'headphone',

  // 相机相关
  相机: 'camera',
  单反: 'camera',
  微单: 'camera',
  camera: 'camera',

  // 游戏机相关
  游戏机: 'console',
  主机: 'console',
  console: 'console',

  // 智能家居相关
  智能家居: 'smarthome',
  智能音箱: 'smarthome',
  'smart home': 'smarthome',
};

/**
 * 扩展搜索关键词，将常见搜索词映射到对应的品牌、规格和型号
 * @param keyword 原始搜索关键词
 * @returns 扩展后的关键词数组
 */
export function expandSearchKeywords(keyword: string): string[] {
  // 转换为小写并去除首尾空格
  const normalizedKeyword = keyword.toLowerCase().trim();

  // 初始化结果数组，始终包含原始关键词
  const expandedKeywords: string[] = [keyword];

  // 遍历所有类别，寻找匹配项
  let matchedCategory = '';

  // 首先检查是否直接匹配某个类别
  if (KEYWORD_TO_CATEGORY[normalizedKeyword]) {
    matchedCategory = KEYWORD_TO_CATEGORY[normalizedKeyword];
  } else {
    // 检查是否包含任何类别的基础词
    for (const category in ALL_MAPPINGS) {
      const baseTerms = ALL_MAPPINGS[category].base;
      if (
        baseTerms.some((term) => normalizedKeyword.includes(term.toLowerCase()))
      ) {
        matchedCategory = category;
        break;
      }
    }

    // 如果还没有匹配到类别，检查是否包含任何品牌或型号
    if (!matchedCategory) {
      for (const category in ALL_MAPPINGS) {
        const brands = ALL_MAPPINGS[category].brands;
        const models = ALL_MAPPINGS[category].models;

        if (
          brands.some((brand) =>
            normalizedKeyword.includes(brand.toLowerCase()),
          ) ||
          models.some((model) =>
            normalizedKeyword.includes(model.toLowerCase()),
          )
        ) {
          matchedCategory = category;
          break;
        }
      }
    }
  }

  // 如果找到匹配的类别，添加相关关键词
  if (matchedCategory) {
    const mapping = ALL_MAPPINGS[matchedCategory];

    // 添加品牌关键词（重要性高）
    expandedKeywords.push(...mapping.brands);

    // 添加型号关键词（次要重要性）
    expandedKeywords.push(...mapping.models);

    // 检查是否包含特定型号或特征
    // 例如，如果搜索"游戏本"，添加更多游戏本相关品牌
    for (const spec of mapping.specs) {
      if (normalizedKeyword.includes(spec.toLowerCase())) {
        expandedKeywords.push(
          ...mapping.brands.map((brand) => `${brand} ${spec}`),
        );
      }
    }
  }

  // 去重并返回
  return [...new Set(expandedKeywords)];
}

/**
 * 使用关键词映射来构建搜索条件
 * @param keyword 原始搜索关键词
 * @returns 扩展的搜索OR条件对象
 */
export function buildSearchConditions(keyword: string): any[] {
  const expandedKeywords = expandSearchKeywords(keyword);

  // 构建OR查询条件
  const searchConditions = expandedKeywords.map((term) => ({
    OR: [
      { name: { contains: term } },
      { description: { contains: term } },
      { tags: { contains: term } },
    ],
  }));

  return searchConditions;
}
