// CDN URLs for static assets
export const CDN = {
  // Original APK book covers (extracted from APK resources)
  COVER_BG: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663420916883/8x5BZGAzw993jaseLqBN6M/e4_f1cb80ef.png',
  COVER_SB: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663420916883/8x5BZGAzw993jaseLqBN6M/ux_43e54f8e.png',
  // Generated cover for Ekadasi
  COVER_EKADASI: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663420916883/8x5BZGAzw993jaseLqBN6M/cover_ekadasi_9af1cef9.png',
  // App logo (designed based on original orange theme)
  APP_LOGO: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663420916883/8x5BZGAzw993jaseLqBN6M/app_logo_5312d04f.png',
  APP_ICON: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663420916883/8x5BZGAzw993jaseLqBN6M/app_icon_f25eeb51.png',
};

// ─── 节编号显示格式化（不对用户显示缩写）────────────────────────────────────
// bookType: 'bg' | 'sb' | 'akadasi'
// sectionId: 如 "1.1"、"1.10.23"
// language: 'zh' | 'en'
export function formatSectionLabel(bookType: string, sectionId: string, language: 'zh' | 'en' = 'zh'): string {
  if (bookType === 'bg') {
    return language === 'zh'
      ? `博伽梵歌 ${sectionId}`
      : `Bhagavad-gītā ${sectionId}`;
  }
  if (bookType === 'sb') {
    return language === 'zh'
      ? `圣典博伽瓦谭 ${sectionId}`
      : `Śrīmad-Bhāgavatam ${sectionId}`;
  }
  if (bookType === 'akadasi') {
    return language === 'zh'
      ? `爱卡达西 ${sectionId}`
      : `Ekādaśī ${sectionId}`;
  }
  return sectionId;
}
