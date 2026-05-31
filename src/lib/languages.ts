// The 22 official Indian languages (+ English) with BCP-47 codes for TTS.
// Browsers may not have a voice for every one — TTS gracefully falls back,
// while on-screen captions are always translated.

export interface LangOption {
  name: string;       // English label
  native: string;     // endonym
  code: string;       // BCP-47 for speechSynthesis
}

export const LANGUAGES: LangOption[] = [
  { name: 'English',   native: 'English',   code: 'en-IN' },
  { name: 'Hindi',     native: 'हिन्दी',      code: 'hi-IN' },
  { name: 'Bengali',   native: 'বাংলা',       code: 'bn-IN' },
  { name: 'Marathi',   native: 'मराठी',       code: 'mr-IN' },
  { name: 'Telugu',    native: 'తెలుగు',      code: 'te-IN' },
  { name: 'Tamil',     native: 'தமிழ்',        code: 'ta-IN' },
  { name: 'Gujarati',  native: 'ગુજરાતી',     code: 'gu-IN' },
  { name: 'Urdu',      native: 'اردو',        code: 'ur-IN' },
  { name: 'Kannada',   native: 'ಕನ್ನಡ',       code: 'kn-IN' },
  { name: 'Odia',      native: 'ଓଡ଼ିଆ',        code: 'or-IN' },
  { name: 'Malayalam', native: 'മലയാളം',     code: 'ml-IN' },
  { name: 'Punjabi',   native: 'ਪੰਜਾਬੀ',      code: 'pa-IN' },
  { name: 'Assamese',  native: 'অসমীয়া',     code: 'as-IN' },
  { name: 'Maithili',  native: 'मैथिली',      code: 'hi-IN' },
  { name: 'Santali',   native: 'ᱥᱟᱱᱛᱟᱲᱤ',     code: 'hi-IN' },
  { name: 'Kashmiri',  native: 'कॉशुर',       code: 'ur-IN' },
  { name: 'Nepali',    native: 'नेपाली',      code: 'ne-NP' },
  { name: 'Sindhi',    native: 'سنڌي',        code: 'ur-IN' },
  { name: 'Dogri',     native: 'डोगरी',       code: 'hi-IN' },
  { name: 'Konkani',   native: 'कोंकणी',      code: 'mr-IN' },
  { name: 'Manipuri',  native: 'মৈতৈলোন্',    code: 'bn-IN' },
  { name: 'Sanskrit',  native: 'संस्कृतम्',    code: 'hi-IN' },
  { name: 'Bodo',      native: 'बड़ो',         code: 'hi-IN' },
];

export function langCode(name: string): string {
  return LANGUAGES.find(l => l.name === name)?.code ?? 'en-IN';
}
