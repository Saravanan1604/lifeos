// ============================================================
//  LifeOS — Multilingual (English / தமிழ் / हिन्दी) + Voice Control
//  Uses the Web Speech API (SpeechRecognition + SpeechSynthesis).
//  No external dependencies, fully offline-capable in supporting browsers.
// ============================================================

// ---- Supported languages -----------------------------------
const VOICE_LANGS = {
  en: { label: 'English',  flag: '🇬🇧', speech: 'en-IN', tts: 'en-IN' },
  ta: { label: 'தமிழ்',    flag: '🇮🇳', speech: 'ta-IN', tts: 'ta-IN' },
  hi: { label: 'हिन्दी',   flag: '🇮🇳', speech: 'hi-IN', tts: 'hi-IN' },
};

// Current language is persisted in STATE.settings.lang (defaults to 'en').
function getLang() {
  try { return (STATE && STATE.settings && STATE.settings.lang) || 'en'; }
  catch { return 'en'; }
}

// ---- UI string dictionary ----------------------------------
// Keyed by the ENGLISH source string so existing markup can be
// translated in place without touching every template.
const I18N = {
  // Sidebar nav + group labels
  'Overview':        { ta: 'மேலோட்டம்',      hi: 'अवलोकन' },
  'Dashboard':       { ta: 'டாஷ்போர்டு',     hi: 'डैशबोर्ड' },
  'Finance':         { ta: 'நிதி',           hi: 'वित्त' },
  'All Assets':      { ta: 'அனைத்து சொத்துகள்', hi: 'सभी संपत्तियाँ' },
  'Budget':          { ta: 'பட்ஜெட்',         hi: 'बजट' },
  'Bank Tracker':    { ta: 'வங்கி டிராக்கர்',  hi: 'बैंक ट्रैकर' },
  'Life':            { ta: 'வாழ்க்கை',        hi: 'जीवन' },
  'Health Hub':      { ta: 'சுகாதார மையம்',   hi: 'स्वास्थ्य हब' },
  'Habits':          { ta: 'பழக்கங்கள்',      hi: 'आदतें' },
  'Goals':           { ta: 'இலக்குகள்',       hi: 'लक्ष्य' },
  'Journal':         { ta: 'நாட்குறிப்பு',    hi: 'जर्नल' },
  'Categories':      { ta: 'வகைகள்',          hi: 'श्रेणियाँ' },
  'Growth':          { ta: 'வளர்ச்சி',        hi: 'विकास' },
  'Achievements':    { ta: 'சாதனைகள்',        hi: 'उपलब्धियाँ' },
  'Analytics':       { ta: 'பகுப்பாய்வு',     hi: 'विश्लेषण' },
  'Compare':         { ta: 'ஒப்பீடு',         hi: 'तुलना' },
  'Side-by-side: Day · Week · Month · Year': { ta: 'அருகருகே: நாள் · வாரம் · மாதம் · வருடம்', hi: 'साथ-साथ: दिन · सप्ताह · महीना · वर्ष' },
  'Day vs Day':     { ta: 'நாள் vs நாள்',    hi: 'दिन बनाम दिन' },
  'Week vs Week':   { ta: 'வாரம் vs வாரம்',  hi: 'सप्ताह बनाम सप्ताह' },
  'Month vs Month': { ta: 'மாதம் vs மாதம்',  hi: 'महीना बनाम महीना' },
  'Year vs Year':   { ta: 'வருடம் vs வருடம்', hi: 'वर्ष बनाम वर्ष' },
  'Change':         { ta: 'மாற்றம்',          hi: 'बदलाव' },
  'Custom Compare': { ta: 'விருப்ப ஒப்பீடு',  hi: 'कस्टम तुलना' },
  'Period A':       { ta: 'காலம் A',          hi: 'अवधि A' },
  'Period B':       { ta: 'காலம் B',          hi: 'अवधि B' },
  'Pick two periods to compare': { ta: 'ஒப்பிட இரண்டு காலங்களைத் தேர்வுசெய்க', hi: 'तुलना के लिए दो अवधि चुनें' },
  'AI Coach':        { ta: 'AI பயிற்சியாளர்', hi: 'AI कोच' },
  'Settings':        { ta: 'அமைப்புகள்',      hi: 'सेटिंग्स' },
  'Help & Support':  { ta: 'உதவி & ஆதரவு',   hi: 'सहायता और समर्थन' },
  'Sign Out':        { ta: 'வெளியேறு',        hi: 'साइन आउट' },

  // ---- Page titles / subtitles ----
  'Manage your LifeOS preferences': { ta: 'உங்கள் LifeOS விருப்பங்களை நிர்வகிக்கவும்', hi: 'अपनी LifeOS प्राथमिकताएँ प्रबंधित करें' },

  // ---- Common controls / time filters ----
  'Day':   { ta: 'நாள்',   hi: 'दिन' },
  'Week':  { ta: 'வாரம்',  hi: 'सप्ताह' },
  'Month': { ta: 'மாதம்',  hi: 'महीना' },
  'Year':  { ta: 'வருடம்', hi: 'वर्ष' },
  'All':   { ta: 'அனைத்தும்', hi: 'सभी' },
  'Edit':  { ta: 'திருத்து', hi: 'संपादित करें' },
  'Save':  { ta: 'சேமி',   hi: 'सहेजें' },
  'Cancel':{ ta: 'ரத்து',  hi: 'रद्द करें' },
  'Delete':{ ta: 'நீக்கு', hi: 'हटाएँ' },
  'Close': { ta: 'மூடு',   hi: 'बंद करें' },
  'Bal':   { ta: 'இருப்பு', hi: 'बैलेंस' },
  'Pay':   { ta: 'செலுத்து', hi: 'भुगतान' },
  'Limit': { ta: 'வரம்பு', hi: 'सीमा' },
  'Outstanding': { ta: 'நிலுவை', hi: 'बकाया' },

  // ---- Finance page ----
  '+ Add Transaction': { ta: '+ பரிவர்த்தனை சேர்', hi: '+ लेनदेन जोड़ें' },
  'Add Income':  { ta: 'வருமானம் சேர்', hi: 'आय जोड़ें' },
  'Add Expense': { ta: 'செலவு சேர்',    hi: 'खर्च जोड़ें' },
  'Import CSV':  { ta: 'CSV இறக்குமதி', hi: 'CSV आयात' },
  'Bulk Entry':  { ta: 'மொத்த உள்ளீடு', hi: 'बल्क एंट्री' },
  'Paste Statement': { ta: 'அறிக்கையை ஒட்டு', hi: 'स्टेटमेंट पेस्ट करें' },
  'Scan SMS':    { ta: 'SMS ஸ்கேன்',    hi: 'SMS स्कैन' },
  'Import PDF':  { ta: 'PDF இறக்குமதி', hi: 'PDF आयात' },
  'NET WORTH':   { ta: 'நிகர மதிப்பு',  hi: 'कुल संपत्ति' },
  'INCOME':      { ta: 'வருமானம்',      hi: 'आय' },
  'EXPENSES':    { ta: 'செலவுகள்',      hi: 'खर्च' },
  'SAVINGS':     { ta: 'சேமிப்பு',      hi: 'बचत' },
  'Bank Accounts': { ta: 'வங்கி கணக்குகள்', hi: 'बैंक खाते' },
  'Total Bank Balance': { ta: 'மொத்த வங்கி இருப்பு', hi: 'कुल बैंक बैलेंस' },
  '+ Add Bank':  { ta: '+ வங்கி சேர்',  hi: '+ बैंक जोड़ें' },
  'Credit Cards':{ ta: 'கடன் அட்டைகள்', hi: 'क्रेडिट कार्ड' },
  '+ Add Card':  { ta: '+ அட்டை சேர்',  hi: '+ कार्ड जोड़ें' },
  'Savings':     { ta: 'சேமிப்பு',      hi: 'बचत' },
  'Salary':      { ta: 'சம்பளம்',       hi: 'वेतन' },
  'Fixed Deposit': { ta: 'நிலையான வைப்பு', hi: 'फिक्स्ड डिपॉज़िट' },

  // ---- Settings page ----
  'Profile':      { ta: 'சுயவிவரம்',   hi: 'प्रोफ़ाइल' },
  'Display Name': { ta: 'காட்சிப் பெயர்', hi: 'प्रदर्शन नाम' },
  'Currency Symbol': { ta: 'நாணய சின்னம்', hi: 'मुद्रा चिह्न' },
  'Save Profile': { ta: 'சுயவிவரம் சேமி', hi: 'प्रोफ़ाइल सहेजें' },
  'Theme':        { ta: 'தீம்',        hi: 'थीम' },
  'Dark':         { ta: 'இருள்',       hi: 'डार्क' },
  'Light':        { ta: 'ஒளி',         hi: 'लाइट' },
  'Auto':         { ta: 'தானியங்கி',   hi: 'ऑटो' },
  'Your Stats':   { ta: 'உங்கள் புள்ளிவிவரம்', hi: 'आपके आँकड़े' },
  'Danger Zone':  { ta: 'ஆபத்து மண்டலம்', hi: 'खतरा क्षेत्र' },
  'Reset All Data': { ta: 'எல்லா தரவையும் மீட்டமை', hi: 'सभी डेटा रीसेट करें' },

  // ---- Singular finance words (chart legends, headers) ----
  'Income':   { ta: 'வருமானம்', hi: 'आय' },
  'Expense':  { ta: 'செலவு',    hi: 'खर्च' },
  'Net Worth':{ ta: 'நிகர மதிப்பு', hi: 'कुल संपत्ति' },
  'Net Savings': { ta: 'நிகர சேமிப்பு', hi: 'शुद्ध बचत' },
  'Category': { ta: 'வகை',      hi: 'श्रेणी' },
  'Savings Rate': { ta: 'சேமிப்பு விகிதம்', hi: 'बचत दर' },

  // ---- Dashboard ----
  'Good morning': { ta: 'காலை வணக்கம்', hi: 'सुप्रभात' },
  'Good afternoon': { ta: 'மதிய வணக்கம்', hi: 'नमस्कार' },
  'Good evening': { ta: 'மாலை வணக்கம்', hi: 'शुभ संध्या' },
  'No transactions today yet — start tracking!': { ta: 'இன்று இன்னும் பரிவர்த்தனைகள் இல்லை — பதிவு செய்யத் தொடங்குங்கள்!', hi: 'आज अभी तक कोई लेनदेन नहीं — ट्रैकिंग शुरू करें!' },
  '+ Add':    { ta: '+ சேர்',   hi: '+ जोड़ें' },
  'Quick Actions': { ta: 'விரைவு செயல்கள்', hi: 'त्वरित क्रियाएँ' },
  'Jump to any section instantly': { ta: 'எந்தப் பகுதிக்கும் உடனடியாகச் செல்லுங்கள்', hi: 'किसी भी अनुभाग पर तुरंत जाएँ' },
  'Log income & salary': { ta: 'வருமானம் & சம்பளம் பதிவு', hi: 'आय और वेतन दर्ज करें' },
  'Track your spending': { ta: 'உங்கள் செலவைக் கண்காணி', hi: 'अपना खर्च ट्रैक करें' },
  'Link Bank': { ta: 'வங்கியை இணை', hi: 'बैंक लिंक करें' },
  'Add a bank account': { ta: 'வங்கிக் கணக்கைச் சேர்', hi: 'बैंक खाता जोड़ें' },
  'Set Budget': { ta: 'பட்ஜெட் அமை', hi: 'बजट सेट करें' },
  'Plan monthly spend': { ta: 'மாதாந்திர செலவைத் திட்டமிடு', hi: 'मासिक खर्च की योजना बनाएँ' },
  'Add Asset': { ta: 'சொத்து சேர்', hi: 'संपत्ति जोड़ें' },
  'Track investments & wealth': { ta: 'முதலீடுகள் & செல்வத்தைக் கண்காணி', hi: 'निवेश और संपत्ति ट्रैक करें' },
  'Add Habit': { ta: 'பழக்கம் சேர்', hi: 'आदत जोड़ें' },
  'Build daily routines': { ta: 'தினசரி வழக்கங்களை உருவாக்கு', hi: 'दैनिक दिनचर्या बनाएँ' },
  'Add Goal': { ta: 'இலக்கு சேர்', hi: 'लक्ष्य जोड़ें' },
  'Set a savings goal': { ta: 'சேமிப்பு இலக்கை அமை', hi: 'बचत लक्ष्य सेट करें' },
  'Log Health': { ta: 'உடல்நலம் பதிவு', hi: 'स्वास्थ्य दर्ज करें' },
  'Track sleep, mood & steps': { ta: 'தூக்கம், மனநிலை & படிகளைக் கண்காணி', hi: 'नींद, मूड और कदम ट्रैक करें' },
  'Write Journal': { ta: 'நாட்குறிப்பு எழுது', hi: 'जर्नल लिखें' },
  'Record your emotions': { ta: 'உங்கள் உணர்வுகளைப் பதிவு செய்', hi: 'अपनी भावनाएँ रिकॉर्ड करें' },
  'TAP TO VIEW': { ta: 'பார்க்க தட்டவும்', hi: 'देखने के लिए टैप करें' },
  'Life Score': { ta: 'வாழ்க்கை மதிப்பெண்', hi: 'लाइफ स्कोर' },
  'HABITS TODAY': { ta: 'இன்றைய பழக்கங்கள்', hi: 'आज की आदतें' },
  'Financial Overview': { ta: 'நிதி கண்ணோட்டம்', hi: 'वित्तीय अवलोकन' },
  'View All': { ta: 'அனைத்தையும் காண்க', hi: 'सभी देखें' },
  'TOP SPENDING': { ta: 'அதிக செலவு', hi: 'शीर्ष खर्च' },
  'No spending yet': { ta: 'இன்னும் செலவு இல்லை', hi: 'अभी तक कोई खर्च नहीं' },
  '+ Add Expense': { ta: '+ செலவு சேர்', hi: '+ खर्च जोड़ें' },

  // ---- Finance extras ----
  'Cash Accounts': { ta: 'பண கணக்குகள்', hi: 'नकद खाते' },
  '+ Add Cash':    { ta: '+ பணம் சேர்', hi: '+ नकद जोड़ें' },
  'Total Cash':    { ta: 'மொத்த பணம்', hi: 'कुल नकद' },
  'Total Outstanding': { ta: 'மொத்த நிலுவை', hi: 'कुल बकाया' },
  'Total Txns':    { ta: 'மொத்த பரிவர்த்தனைகள்', hi: 'कुल लेनदेन' },
  'This Month':    { ta: 'இந்த மாதம்', hi: 'इस महीने' },
  'Income vs Expenses': { ta: 'வருமானம் vs செலவுகள்', hi: 'आय बनाम खर्च' },
  'Spending by Category': { ta: 'வகை வாரியான செலவு', hi: 'श्रेणी अनुसार खर्च' },
  'No expense data yet.': { ta: 'இன்னும் செலவு தரவு இல்லை.', hi: 'अभी तक कोई खर्च डेटा नहीं।' },
  'Transactions':  { ta: 'பரிவர்த்தனைகள்', hi: 'लेनदेन' },
  'Search transactions...': { ta: 'பரிவர்த்தனைகளைத் தேடு...', hi: 'लेनदेन खोजें...' },
  'All types':     { ta: 'அனைத்து வகைகள்', hi: 'सभी प्रकार' },
  'All categories':{ ta: 'அனைத்து வகைகள்', hi: 'सभी श्रेणियाँ' },
  'Newest first':  { ta: 'புதியது முதலில்', hi: 'नवीनतम पहले' },
  'Clear filters': { ta: 'வடிப்பான்களை அழி', hi: 'फ़िल्टर साफ़ करें' },

  // ---- Budget page ----
  'Budget Planner': { ta: 'பட்ஜெட் திட்டமிடுபவர்', hi: 'बजट प्लानर' },
  'This Month spending vs budget limits': { ta: 'இந்த மாத செலவு vs பட்ஜெட் வரம்புகள்', hi: 'इस महीने खर्च बनाम बजट सीमा' },
  '+ Add Budget':  { ta: '+ பட்ஜெட் சேர்', hi: '+ बजट जोड़ें' },
  'Add Budget':    { ta: 'பட்ஜெட் சேர்', hi: 'बजट जोड़ें' },
  'Total Budget Overview': { ta: 'மொத்த பட்ஜெட் கண்ணோட்டம்', hi: 'कुल बजट अवलोकन' },
  'TOTAL BUDGET':  { ta: 'மொத்த பட்ஜெட்', hi: 'कुल बजट' },
  'TOTAL SPENT':   { ta: 'மொத்த செலவு', hi: 'कुल खर्च' },
  'REMAINING':     { ta: 'மீதம்', hi: 'शेष' },
  'Overall usage': { ta: 'மொத்த பயன்பாடு', hi: 'कुल उपयोग' },
  'total budget':  { ta: 'மொத்த பட்ஜெட்', hi: 'कुल बजट' },
  // Category names
  'Food':          { ta: 'உணவு', hi: 'भोजन' },
  'Transport':     { ta: 'போக்குவரத்து', hi: 'परिवहन' },
  'Shopping':      { ta: 'ஷாப்பிங்', hi: 'खरीदारी' },
  'Utilities':     { ta: 'பயன்பாடுகள்', hi: 'उपयोगिताएँ' },
  'EMI':           { ta: 'EMI', hi: 'EMI' },
  'Gifts':         { ta: 'பரிசுகள்', hi: 'उपहार' },
  'Rent':          { ta: 'வாடகை', hi: 'किराया' },
  'Fuel':          { ta: 'எரிபொருள்', hi: 'ईंधन' },
  'Investment':    { ta: 'முதலீடு', hi: 'निवेश' },
  'Entertainment': { ta: 'பொழுதுபோக்கு', hi: 'मनोरंजन' },
  'Travel':        { ta: 'பயணம்', hi: 'यात्रा' },

  // ---- Bank Tracker ----
  '30-Day Trend':  { ta: '30-நாள் போக்கு', hi: '30-दिन का रुझान' },
  'All Accounts':  { ta: 'அனைத்து கணக்குகள்', hi: 'सभी खाते' },
  '30 Days':       { ta: '30 நாட்கள்', hi: '30 दिन' },
  '1 Year':        { ta: '1 வருடம்', hi: '1 वर्ष' },
  'Accounts':      { ta: 'கணக்குகள்', hi: 'खाते' },
  'Entries':       { ta: 'பதிவுகள்', hi: 'प्रविष्टियाँ' },
  'Transfers':     { ta: 'பரிமாற்றங்கள்', hi: 'स्थानांतरण' },
  'Days':          { ta: 'நாட்கள்', hi: 'दिन' },
  'QUICK LOG':     { ta: 'விரைவு பதிவு', hi: 'त्वरित लॉग' },
  '+ Log':         { ta: '+ பதிவு', hi: '+ लॉग' },
  'Balance Update':{ ta: 'இருப்பு புதுப்பிப்பு', hi: 'बैलेंस अपडेट' },
  'from':          { ta: 'இருந்து', hi: 'से' },
  'Log balance for any bank...': { ta: 'எந்த வங்கிக்கும் இருப்பைப் பதிவு செய்...', hi: 'किसी भी बैंक का बैलेंस दर्ज करें...' },

  // ---- Analytics ----
  'Cross Analytics': { ta: 'குறுக்கு பகுப்பாய்வு', hi: 'क्रॉस विश्लेषण' },
  'EXPENSE':       { ta: 'செலவு', hi: 'खर्च' },
  'BUDGET USED':   { ta: 'பயன்படுத்திய பட்ஜெட்', hi: 'उपयोग किया गया बजट' },
  'Spend Split':   { ta: 'செலவு பிரிப்பு', hi: 'खर्च विभाजन' },
  'No expenses this period': { ta: 'இந்தக் காலத்தில் செலவுகள் இல்லை', hi: 'इस अवधि में कोई खर्च नहीं' },
  'No income data':{ ta: 'வருமான தரவு இல்லை', hi: 'कोई आय डेटा नहीं' },
  'Add income to see split': { ta: 'பிரிப்பைக் காண வருமானம் சேர்', hi: 'विभाजन देखने के लिए आय जोड़ें' },
  'Period-by-Period Comparison': { ta: 'காலம் வாரியான ஒப்பீடு', hi: 'अवधि-दर-अवधि तुलना' },
  'PERIOD':        { ta: 'காலம்', hi: 'अवधि' },
  'RATE':          { ta: 'விகிதம்', hi: 'दर' },
  'VS PREV':       { ta: 'முந்தையதை விட', hi: 'पिछले की तुलना में' },
  'over budget':   { ta: 'பட்ஜெட்டை மீறி', hi: 'बजट से अधिक' },
  'within budget': { ta: 'பட்ஜெட்டுக்குள்', hi: 'बजट के भीतर' },
  'budget limit':  { ta: 'பட்ஜெட் வரம்பு', hi: 'बजट सीमा' },

  // Voice feedback strings
  'voice_listening':   { en: 'Listening…',                ta: 'கேட்கிறேன்…',                 hi: 'सुन रहा हूँ…' },
  'voice_not_supported': { en: 'Voice control is not supported in this browser.', ta: 'இந்த உலாவியில் குரல் கட்டுப்பாடு ஆதரிக்கப்படவில்லை.', hi: 'इस ब्राउज़र में वॉयस कंट्रोल समर्थित नहीं है।' },
  'voice_no_match':    { en: "Sorry, I didn't understand that.", ta: 'மன்னிக்கவும், எனக்குப் புரியவில்லை.', hi: 'क्षमा करें, मैं समझ नहीं पाया।' },
  'voice_lang_set':    { en: 'Language changed',          ta: 'மொழி மாற்றப்பட்டது',         hi: 'भाषा बदल गई' },
};

// Translate a single English source string into the active language.
function t(en) {
  const lang = getLang();
  if (lang === 'en') {
    // Some keys (voice_*) have an English entry too
    if (I18N[en] && I18N[en].en) return I18N[en].en;
    return en;
  }
  const entry = I18N[en];
  if (entry && entry[lang]) return entry[lang];
  return en; // graceful fallback to English
}

// Reverse index: any known translation (in any language) → English key.
// Lets us translate forward AND revert when switching languages, even
// though render functions emit English but the DOM may currently show Tamil.
let _REVERSE = null;
function _buildReverse() {
  _REVERSE = {};
  for (const en in I18N) {
    if (en.startsWith('voice_')) continue;       // internal keys, not UI text
    _REVERSE[en.toLowerCase()] = en;             // English maps to itself
    const entry = I18N[en];
    ['ta', 'hi'].forEach(l => { if (entry[l]) _REVERSE[entry[l].toLowerCase()] = en; });
  }
}

// Given a chunk of visible text, return [prefix, englishKey] if it maps to a
// known string (ignoring leading emoji/symbols/whitespace), else null.
function _canonical(text) {
  if (!_REVERSE) _buildReverse();
  const trimmed = text.trim();
  if (!trimmed) return null;
  // Direct match
  if (_REVERSE[trimmed.toLowerCase()]) return ['', _REVERSE[trimmed.toLowerCase()]];
  // Strip a leading emoji / symbol run (e.g. "💰 Finance", "⚙️ Settings")
  const m = trimmed.match(/^([^\p{L}\p{N}]+)(.+)$/u);
  if (m) {
    const key = _REVERSE[m[2].trim().toLowerCase()];
    if (key) return [m[1], key];
  }
  return null;
}

// Translate the text nodes inside a root element in place.
function _translateTextNodes(root) {
  if (!root) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const p = node.parentNode;
      if (!p) return NodeFilter.FILTER_REJECT;
      const tag = p.nodeName;
      if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'TEXTAREA') return NodeFilter.FILTER_REJECT;
      if (p.closest && p.closest('#voice-lang-pill')) return NodeFilter.FILTER_REJECT;
      return node.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    }
  });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(node => {
    const can = _canonical(node.nodeValue);
    if (!can) return;
    const [prefix, key] = can;
    const ws = node.nodeValue.match(/^(\s*).*?(\s*)$/s); // preserve outer whitespace
    node.nodeValue = (ws ? ws[1] : '') + prefix + t(key) + (ws ? ws[2] : '');
  });
}

// Translate sidebar, dynamic [data-i18n] nodes, and all page content.
function applyTranslations() {
  // Sidebar — keep original English in dataset so it always round-trips
  document.querySelectorAll('.nav-text, .nav-group-label').forEach(el => {
    if (!el.dataset.en) el.dataset.en = el.textContent.trim();
    el.textContent = t(el.dataset.en);
  });
  document.querySelectorAll('[data-i18n]').forEach(el => {
    if (!el.dataset.en) el.dataset.en = el.getAttribute('data-i18n');
    el.textContent = t(el.dataset.en);
  });
  // Page content + key chrome — generic text-node translation
  _translateTextNodes(document.getElementById('page-container'));
  _translateTextNodes(document.getElementById('content'));

  // Reflect on <html lang="">
  document.documentElement.lang = getLang();
  // Refresh language pill if present
  const pill = document.getElementById('voice-lang-pill');
  if (pill) pill.textContent = VOICE_LANGS[getLang()].flag;
}

function setLanguage(lang) {
  if (!VOICE_LANGS[lang]) return;
  STATE.settings = STATE.settings || {};
  STATE.settings.lang = lang;
  if (typeof saveState === 'function') saveState();
  applyTranslations();
  if (typeof toast === 'function') toast(`${VOICE_LANGS[lang].flag} ${t('voice_lang_set')}: ${VOICE_LANGS[lang].label}`, 'success');
}

// Cycle language from the floating pill (en → ta → hi → en)
function cycleLanguage() {
  const order = ['en', 'ta', 'hi'];
  const next = order[(order.indexOf(getLang()) + 1) % order.length];
  setLanguage(next);
}

// ============================================================
//  VOICE COMMAND ENGINE
// ============================================================

// Each command: list of keyword triggers (across all 3 languages,
// native script + common transliterations) and an action to run.
// Matching is substring-based and case-insensitive, so natural
// phrases like "go to finance" or "நிதி காட்டு" both work.
const VOICE_COMMANDS = [
  // ----- Navigation -----
  { keys: ['dashboard', 'home', 'டாஷ்போர்டு', 'முகப்பு', 'डैशबोर्ड', 'होम'], run: () => navigate('dashboard'), say: 'Dashboard' },
  { keys: ['finance', 'transaction', 'money', 'நிதி', 'பணம்', 'वित्त', 'पैसा', 'लेनदेन'], run: () => navigate('finance'), say: 'Finance' },
  { keys: ['asset', 'investment', 'சொத்து', 'முதலீடு', 'संपत्ति', 'निवेश'], run: () => navigate('investments'), say: 'Assets' },
  { keys: ['budget', 'பட்ஜெட்', 'बजट'], run: () => navigate('budget'), say: 'Budget' },
  { keys: ['bank', 'வங்கி', 'बैंक'], run: () => navigate('bank-tracker'), say: 'Bank Tracker' },
  { keys: ['records', 'all transactions', 'transaction list', 'show transactions'], run: () => navigate('transactions'), say: 'Records' },
  { keys: ['credit card', 'cards', 'card'], run: () => navigate('bank-tracker'), say: 'Cards' },
  { keys: ['cash', 'wallet', 'purse'], run: () => navigate('bank-tracker'), say: 'Cash' },
  { keys: ['net worth', 'networth', 'wealth', 'total balance'], run: () => navigate('finance'), say: 'Net worth' },
  { keys: ['health', 'சுகாதார', 'உடல்நலம்', 'स्वास्थ्य', 'सेहत'], run: () => navigate('health'), say: 'Health Hub' },
  { keys: ['habit', 'பழக்க', 'आदत'], run: () => navigate('habits'), say: 'Habits' },
  { keys: ['goal', 'இலக்கு', 'लक्ष्य'], run: () => navigate('goals'), say: 'Goals' },
  { keys: ['journal', 'diary', 'நாட்குறிப்பு', 'जर्नल', 'डायरी'], run: () => navigate('journal'), say: 'Journal' },
  { keys: ['category', 'categories', 'வகை', 'श्रेणी'], run: () => navigate('categories'), say: 'Categories' },
  { keys: ['achievement', 'சாதனை', 'उपलब्धि'], run: () => navigate('achievements'), say: 'Achievements' },
  { keys: ['analytic', 'report', 'பகுப்பாய்வு', 'அறிக்கை', 'विश्लेषण', 'रिपोर्ट'], run: () => navigate('analytics'), say: 'Analytics' },
  { keys: ['compare', 'comparison', 'ஒப்பீடு', 'तुलना'], run: () => navigate('compare'), say: 'Compare' },
  { keys: ['coach', 'assistant', 'பயிற்சி', 'कोच', 'सहायक'], run: () => navigate('ai-coach'), say: 'AI Coach' },
  { keys: ['setting', 'அமைப்பு', 'सेटिंग'], run: () => navigate('settings'), say: 'Settings' },
  { keys: ['help', 'support', 'உதவி', 'सहायता', 'मदद'], run: () => navigate('help'), say: 'Help' },

  // ----- Quick actions -----
  { keys: ['add income', 'log income', 'வருமானம்', 'आय', 'इनकम'],
    run: () => { navigate('finance'); setTimeout(() => openAddTxModal('income'), 150); }, say: 'Add income' },
  { keys: ['add expense', 'add spending', 'log expense', 'செலவு', 'खर्च', 'व्यय'],
    run: () => { navigate('finance'); setTimeout(() => openAddTxModal('expense'), 150); }, say: 'Add expense' },
  { keys: ['add habit', 'new habit', 'புதிய பழக்கம்', 'नई आदत'],
    run: () => { navigate('habits'); setTimeout(() => { if (typeof openAddHabitModal === 'function') openAddHabitModal(); }, 150); }, say: 'Add habit' },
  { keys: ['add goal', 'new goal', 'புதிய இலக்கு', 'नया लक्ष्य'],
    run: () => { navigate('goals'); setTimeout(() => { if (typeof openAddGoalModal === 'function') openAddGoalModal(); }, 150); }, say: 'Add goal' },
  { keys: ['write journal', 'new entry', 'நாட்குறிப்பு எழுது', 'जर्नल लिखो'],
    run: () => { navigate('journal'); setTimeout(() => { if (typeof openAddJournalModal === 'function') openAddJournalModal(); }, 150); }, say: 'Journal entry' },
  { keys: ['calculator', 'calculate', 'கணிப்பான்', 'கால்குலேட்டர்', 'कैलकुलेटर'],
    run: () => { if (typeof toggleCalculator === 'function') toggleCalculator(); }, say: 'Calculator' },

  // ----- App control -----
  { keys: ['light mode', 'dark mode', 'theme', 'வண்ண', 'தீம்', 'थीम', 'मोड'],
    run: () => { if (typeof toggleTheme === 'function') toggleTheme(); }, say: 'Theme toggled' },
  { keys: ['sync', 'refresh', 'ஒத்திசை', 'सिंक', 'रिफ्रेश'],
    run: () => { if (typeof pullFromCloud === 'function') pullFromCloud(); }, say: 'Syncing' },
  { keys: ['logout', 'sign out', 'வெளியேறு', 'लॉग आउट', 'साइन आउट'],
    run: () => { if (typeof handleLogout === 'function') handleLogout(); }, say: 'Signing out' },

  // ----- More pages -----
  { keys: ['notes', 'note', 'குறிப்பு', 'नोट्स'], run: () => navigate('notes'), say: 'Notes' },
  { keys: ['yearly', 'year report', 'annual', 'வருடாந்திர', 'वार्षिक'], run: () => navigate('yearly'), say: 'Yearly Report' },
  { keys: ['career', 'job', 'skills', 'வேலை', 'करियर', 'नौकरी'], run: () => navigate('growth'), say: 'Career Hub' },

  // ----- Create accounts / cards -----
  { keys: ['add bank account', 'new bank', 'create bank', 'add account', 'புதிய வங்கி', 'नया बैंक'],
    run: () => { navigate('finance'); setTimeout(() => { if (typeof addBankAccount === 'function') addBankAccount(); }, 150); }, say: 'Add bank account' },
  { keys: ['add credit card', 'add card', 'new card', 'புதிய அட்டை', 'नया कार्ड'],
    run: () => { navigate('finance'); setTimeout(() => { if (typeof addCreditCard === 'function') addCreditCard(); }, 150); }, say: 'Add credit card' },
  { keys: ['add cash', 'add wallet', 'new wallet', 'புதிய பணப்பை', 'नया वॉलेट'],
    run: () => { navigate('finance'); setTimeout(() => { if (typeof addCashAccount === 'function') addCashAccount(); }, 150); }, say: 'Add cash wallet' },
  { keys: ['add budget', 'new budget', 'create budget', 'புதிய பட்ஜெட்', 'नया बजट'],
    run: () => { navigate('budget'); setTimeout(() => { if (typeof openAddBudgetModal === 'function') openAddBudgetModal(-1); }, 150); }, say: 'Add budget' },
  { keys: ['add asset', 'add investment', 'new asset', 'புதிய சொத்து', 'नई संपत्ति'],
    run: () => { navigate('investments'); setTimeout(() => { if (typeof openAddInvestmentModal === 'function') openAddInvestmentModal(); }, 150); }, say: 'Add asset' },

  // ----- Import / capture tools -----
  { keys: ['import csv', 'upload csv', 'csv', 'csv இறக்கு', 'सीएसवी'], run: () => { if (typeof openCsvImport === 'function') openCsvImport(); }, say: 'Import CSV' },
  { keys: ['import pdf', 'upload pdf', 'pdf statement', 'pdf இறக்கு', 'पीडीएफ'], run: () => { if (typeof openPdfImport === 'function') openPdfImport(); }, say: 'Import PDF' },
  { keys: ['scan sms', 'read sms', 'parse sms', 'எஸ்எம்எஸ்', 'एसएमएस'], run: () => { if (typeof openSmsParser === 'function') openSmsParser(); }, say: 'Scan SMS' },
  { keys: ['bulk entry', 'multiple entries', 'மொத்த உள்ளீடு', 'बल्क एंट्री'], run: () => { if (typeof openBulkEntry === 'function') openBulkEntry(); }, say: 'Bulk Entry' },

  // ----- Undo / redo / layout / notifications -----
  { keys: ['undo', 'மீட்டமை', 'पूर्ववत'], run: () => { if (typeof undoLastAction === 'function') undoLastAction(); }, say: 'Undone' },
  { keys: ['redo', 'மறுபடியும்', 'फिर से'], run: () => { if (typeof redoLastAction === 'function') redoLastAction(); }, say: 'Redone' },
  { keys: ['customize', 'edit layout', 'rearrange', 'தனிப்பயன்', 'लेआउट'], run: () => { if (typeof toggleEditLayout === 'function') toggleEditLayout(); }, say: 'Customize layout' },
  { keys: ['notification', 'alerts', 'அறிவிப்பு', 'सूचना'], run: () => { if (typeof openNotifPanel === 'function') openNotifPanel(); }, say: 'Notifications' },
  { keys: ['lock app', 'lock', 'பூட்டு', 'लॉक'], run: () => { if (typeof lockAppNow === 'function') lockAppNow(); }, say: 'Locked' },

  // ----- Time period filters (apply to Finance / Records / Budget) -----
  { keys: ['today', 'இன்று', 'आज'], run: () => _voiceSetPeriod('day'), say: 'Today' },
  { keys: ['this week', 'weekly', 'வாரம்', 'इस सप्ताह'], run: () => _voiceSetPeriod('week'), say: 'This week' },
  { keys: ['this month', 'monthly', 'மாதம்', 'इस महीने'], run: () => _voiceSetPeriod('month'), say: 'This month' },
  { keys: ['this year', 'yearly view', 'வருடம்', 'इस साल'], run: () => _voiceSetPeriod('year'), say: 'This year' },
  { keys: ['all time', 'everything', 'மொத்தம்', 'सभी'], run: () => _voiceSetPeriod('all'), say: 'All time' },

  // ----- Language switching by voice -----
  { keys: ['english', 'ஆங்கிலம்', 'अंग्रेज़ी', 'इंग्लिश'], run: () => setLanguage('en'), say: 'English' },
  { keys: ['tamil', 'தமிழ்', 'तमिल'], run: () => setLanguage('ta'), say: 'தமிழ்' },
  { keys: ['hindi', 'हिंदी', 'हिन्दी', 'இந்தி'], run: () => setLanguage('hi'), say: 'हिन्दी' },
];

// Apply a time period to whichever money page the user is on
function _voiceSetPeriod(p) {
  const pg = (typeof currentPage !== 'undefined') ? currentPage : '';
  if (pg === 'transactions' && typeof recSetPeriod === 'function') recSetPeriod(p);
  else if (pg === 'budget' && typeof setBudgetPeriod === 'function') setBudgetPeriod(p);
  else if (typeof setFinPeriod === 'function') { if (pg !== 'finance') navigate('finance'); setTimeout(() => setFinPeriod(p), 120); }
}

let _recognition = null;
let _listening = false;

// Pick the best installed voice for a BCP-47 lang (e.g. "ta-IN"), with fallback
// to the base language ("ta"), then any voice. Returns null if none.
function _pickVoice(lang) {
  const voices = window.speechSynthesis.getVoices() || [];
  if (!voices.length) return null;
  const base = lang.split('-')[0];
  return voices.find(v => v.lang === lang)
      || voices.find(v => v.lang && v.lang.toLowerCase().startsWith(base))
      || null;
}

function _speak(text) {
  try {
    if (!('speechSynthesis' in window) || !text) return;
    const lang = VOICE_LANGS[getLang()].tts;
    const utter = () => {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang;
      const v = _pickVoice(lang);
      if (v) u.voice = v;            // use installed Tamil/Hindi voice if present
      u.rate = 0.98;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    };
    // Voices load async on first use in some browsers — wait for them once.
    if (!window.speechSynthesis.getVoices().length) {
      window.speechSynthesis.onvoiceschanged = () => { window.speechSynthesis.onvoiceschanged = null; utter(); };
      setTimeout(utter, 250);        // fallback if the event never fires
    } else {
      utter();
    }
  } catch {}
}

function _setMicState(active) {
  _listening = active;
  const btn = document.getElementById('voice-mic-btn');
  if (btn) {
    btn.classList.toggle('voice-listening', active);
    btn.title = active ? t('voice_listening') : 'Voice command';
  }
}

// ---- Natural-language transaction entry --------------------
// Converts native-script numerals (Devanagari/Tamil) to ASCII digits.
function _normalizeDigits(s) {
  return s.replace(/[०-९]/g, d => '०१२३४५६७८९'.indexOf(d))
          .replace(/[௦-௯]/g, d => '௦௧௨௩௪௫௬௭௮௯'.indexOf(d));
}

// Small English number-word parser (handles "ten", "twenty five", "hundred", "thousand").
const _NUM_WORDS = { zero:0, one:1, two:2, three:3, four:4, five:5, six:6, seven:7, eight:8, nine:9,
  ten:10, eleven:11, twelve:12, thirteen:13, fourteen:14, fifteen:15, sixteen:16, seventeen:17,
  eighteen:18, nineteen:19, twenty:20, thirty:30, forty:40, fifty:50, sixty:60, seventy:70,
  eighty:80, ninety:90, hundred:100, thousand:1000, lakh:100000, lakhs:100000 };
function _wordsToNumber(text) {
  const words = text.split(/[\s-]+/).filter(w => w in _NUM_WORDS);
  if (!words.length) return null;
  let total = 0, current = 0;
  for (const w of words) {
    const v = _NUM_WORDS[w];
    if (v === 100 || v === 1000 || v === 100000) {
      current = (current || 1) * v;
      if (v >= 1000) { total += current; current = 0; }
    } else current += v;
  }
  return total + current || null;
}

function _extractAmount(text) {
  const norm = _normalizeDigits(text);
  const m = norm.match(/(\d[\d,]*(?:\.\d+)?)/);    // digits first (e.g. "10", "1,500.50")
  if (m) return parseFloat(m[1].replace(/,/g, ''));
  return _wordsToNumber(text);                      // fall back to number words
}

// Local YYYY-MM-DD (avoids the UTC off-by-one toISOString can introduce).
function _voiceLocalISO(d) {
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return z.toISOString().slice(0, 10);
}

const _MONTHS = { january:0, jan:0, february:1, feb:1, march:2, mar:2, april:3, apr:3,
  may:4, june:5, jun:5, july:6, jul:6, august:7, aug:7, september:8, sep:8, sept:8,
  october:9, oct:9, november:10, nov:10, december:11, dec:11 };

// Extract a date from a spoken phrase.
// Returns { date: 'YYYY-MM-DD', matched: bool, raw: 'matched text' }.
// Handles: today / yesterday / tomorrow / day before yesterday (EN+TA+HI)
//          and explicit "may 25", "25 may", "april 12th".
function _extractDate(text) {
  const now = new Date();
  const rel = (offset, raw) => { const d = new Date(now); d.setDate(d.getDate() + offset); return { date: _voiceLocalISO(d), matched: true, raw }; };

  let mm;
  if ((mm = text.match(/day before yesterday|முந்தா\s?நாள்|परसों/i))) return rel(-2, mm[0]);
  if ((mm = text.match(/\btomorrow\b|நாளை|आने वाला कल|कल के बाद/i))) return rel(1, mm[0]);
  if ((mm = text.match(/\byesterday\b|நேற்று|बीता कल|बीता|कल/i))) return rel(-1, mm[0]);
  if ((mm = text.match(/\btoday\b|இன்று|आज/i))) return rel(0, mm[0]);

  // Explicit month + day (either order), e.g. "may 25", "12 april", "apr 3rd"
  const norm = _normalizeDigits(text);
  const months = Object.keys(_MONTHS).join('|');
  let m = norm.match(new RegExp('\\b(' + months + ')\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b', 'i'))
       || norm.match(new RegExp('\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(' + months + ')\\b', 'i'));
  if (m) {
    let mon, day;
    if (isNaN(parseInt(m[1], 10))) { mon = _MONTHS[m[1].toLowerCase()]; day = parseInt(m[2], 10); }
    else { day = parseInt(m[1], 10); mon = _MONTHS[m[2].toLowerCase()]; }
    if (mon != null && day >= 1 && day <= 31) {
      let year = now.getFullYear();
      // A date far in the future likely means last year (e.g. "december 20" said in Jan)
      if (new Date(year, mon, day).getTime() - now.getTime() > 31 * 864e5) year--;
      return { date: _voiceLocalISO(new Date(year, mon, day)), matched: true, raw: m[0] };
    }
  }
  return { date: _voiceLocalISO(now), matched: false, raw: '' };
}

// Strip numbers, currency + command/connector words to recover a free-text name.
function _stripToName(text, extraWords) {
  let s = _normalizeDigits(text).replace(/[\d,]+(?:\.\d+)?/g, ' ');
  const base = ['add','create','new','set','make','change','update','edit','remove','delete',
    'rupees','rupee','rs','to','as','of','in','for','my','the','a','an','goal','target',
    'asset','investment','loan','debt','budget','balance','bank','please',
    'சேர்','இலக்கு','சொத்து','கடன்','பட்ஜெட்','இருப்பு','மாற்று','நீக்கு',
    'जोड़ो','जोड़','बनाओ','सेट','बदलो','हटाओ','लक्ष्य','संपत्ति','कर्ज','बजट','बैलेंस'];
  base.concat(extraWords || []).forEach(w => { s = s.replace(new RegExp('\\b' + w + '\\b', 'gi'), ' '); });
  return s.replace(/[₹$€£]/g, ' ').replace(/\s+/g, ' ').trim();
}

// Match a spoken phrase to a real CATEGORIES entry (EN/TA/HI). Returns the cat or null.
function _matchCategory(text) {
  const cats = (typeof CATEGORIES !== 'undefined') ? CATEGORIES : [];
  for (const c of cats) {
    const names = [c.name.toLowerCase()];
    const tr = I18N[c.name];
    if (tr) { if (tr.ta) names.push(tr.ta.toLowerCase()); if (tr.hi) names.push(tr.hi.toLowerCase()); }
    if (names.some(n => text.includes(n))) return c;
  }
  return null;
}

// Find a named entity (goal/asset/loan) the user referred to, tolerating
// partial names: "remove goal car" matches a goal named "Buy car".
function _findEntity(list, text) {
  if (!list || !list.length) return null;
  let hit = list.find(x => x.name && text.includes(x.name.toLowerCase()));
  if (hit) return hit;
  const cand = _stripToName(text);
  if (!cand) return null;
  const candWords = cand.split(/\s+/).filter(w => w.length > 1);
  return list.find(x => {
    const nm = (x.name || '').toLowerCase();
    if (!nm) return false;
    if (nm.includes(cand) || cand.includes(nm)) return true;
    return candWords.some(w => nm.includes(w));
  }) || null;
}

function _isAdd(text)    { return /(add|create|new|set|make|log|சேர்|புதிய|जोड़|बनाओ|नया|सेट)/i.test(text); }
function _isRemove(text) { return /(remove|delete|cancel|நீக்கு|हटा|रद्द)/i.test(text); }
function _isEdit(text)   { return /(edit|update|change|modify|மாற்று|புதுப்|बदल|अपडेट|संशोधित)/i.test(text); }

// ---- Hands-free CRUD handlers. Each returns a feedback string on success, else null.

// "change my bank balance in sbi as 10 rs"  /  "set sbi balance to 50000"
function _voiceBankBalance(text) {
  if (!/(balance|இருப்பு|बैलेंस)/i.test(text)) return null;
  const amount = _extractAmount(text);
  if (amount == null || amount < 0) return null;
  const banks = STATE.bankAccounts || [], cash = STATE.cashAccounts || [];
  let acct = banks.find(b => b.bankName && text.includes(b.bankName.toLowerCase()));
  if (!acct) acct = cash.find(c => c.name && text.includes(c.name.toLowerCase()));
  if (!acct) return null;                       // couldn't tell which account
  const old = acct.balance || 0;
  acct.balance = amount;
  STATE.bankBalanceHistory = STATE.bankBalanceHistory || [];
  STATE.bankBalanceHistory.push({ accountId: acct.id, balance: amount, prevBalance: old, date: (typeof today === 'function' ? today() : new Date().toISOString().slice(0,10)), note: 'Voice update' });
  saveState();
  const sym = (STATE.settings && STATE.settings.currency) || '₹';
  return `🏦 ${acct.bankName || acct.name} → ${sym}${amount}`;
}

// "set budget for food 5000"  /  "change food budget to 8000"
function _voiceBudget(text) {
  if (!/(budget|பட்ஜெட்|बजट)/i.test(text)) return null;
  const amount = _extractAmount(text);
  if (!amount || amount <= 0) return null;
  const cat = _matchCategory(text);
  if (!cat) return null;                          // need a category to budget
  STATE.budgets = STATE.budgets || [];
  const i = STATE.budgets.findIndex(b => b.category === cat.name);
  if (i >= 0) STATE.budgets[i] = { ...STATE.budgets[i], amount, period: 'month' };
  else STATE.budgets.push({ id: genId(), category: cat.name, amount, period: 'month' });
  saveState();
  const sym = (STATE.settings && STATE.settings.currency) || '₹';
  return `📊 ${cat.name} budget → ${sym}${amount}/mo`;
}

// "add goal buy car 500000"  /  "remove goal car"
function _voiceGoal(text) {
  if (!/(goal|target|இலக்கு|लक्ष्य)/i.test(text)) return null;
  if (_isRemove(text)) {
    const g = _findEntity(STATE.goals || [], text);
    if (!g) return null;
    STATE.goals = STATE.goals.filter(x => x.id !== g.id);
    saveState();
    return `🗑️ Goal removed: ${g.name}`;
  }
  // add / set
  const amount = _extractAmount(text) || 100;
  let name = _stripToName(text) || 'Goal';
  name = name.charAt(0).toUpperCase() + name.slice(1);
  STATE.goals = STATE.goals || [];
  STATE.goals.push({ id: genId(), name, type: 'savings', target: amount, current: 0, emoji: '🎯', deadline: '', description: '', autoSync: false, createdAt: new Date().toISOString() });
  saveState();
  if (typeof addXP === 'function') addXP(30, 'Goal created');
  const sym = (STATE.settings && STATE.settings.currency) || '₹';
  return `🎯 Goal added: ${name} (${sym}${amount})`;
}

// "add asset gold 100000"  /  "edit asset gold to 120000"  /  "remove asset gold"
function _voiceAsset(text) {
  if (!/(asset|investment|சொத்து|முதலீடு|संपत्ति|निवेश)/i.test(text)) return null;
  const list = STATE.investments || [];
  if (_isRemove(text)) {
    const inv = _findEntity(list, text);
    if (!inv) return null;
    STATE.investments = list.filter(x => x.id !== inv.id);
    saveState();
    return `🗑️ Asset removed: ${inv.name}`;
  }
  if (_isEdit(text)) {
    const inv = _findEntity(list, text);
    const amount = _extractAmount(text);
    if (!inv || amount == null) return null;
    inv.currentValue = amount;
    saveState();
    const sym = (STATE.settings && STATE.settings.currency) || '₹';
    return `✏️ ${inv.name} value → ${sym}${amount}`;
  }
  // add
  const amount = _extractAmount(text);
  if (!amount || amount <= 0) return null;
  let name = _stripToName(text) || 'Asset';
  name = name.charAt(0).toUpperCase() + name.slice(1);
  STATE.investments = list;
  STATE.investments.push({ id: genId(), name, type: 'Other', amount, currentValue: amount, notes: '', date: (typeof today === 'function' ? today() : new Date().toISOString().slice(0,10)) });
  saveState();
  if (typeof addXP === 'function') addXP(25, 'Asset added');
  const sym = (STATE.settings && STATE.settings.currency) || '₹';
  return `📈 Asset added: ${name} (${sym}${amount})`;
}

// "add loan home loan 500000"  /  "update home loan to 400000"  /  "remove loan car"
function _voiceLoan(text) {
  if (!/(loan|debt|கடன்|कर्ज|ऋण)/i.test(text)) return null;
  const list = STATE.loans || [];
  if (_isRemove(text)) {
    const ln = _findEntity(list, text);
    if (!ln) return null;
    STATE.loans = list.filter(x => x.id !== ln.id);
    saveState();
    return `🗑️ Loan removed: ${ln.name}`;
  }
  if (_isEdit(text)) {
    const ln = _findEntity(list, text);
    const amount = _extractAmount(text);
    if (!ln || amount == null) return null;
    ln.outstanding = amount;
    saveState();
    const sym = (STATE.settings && STATE.settings.currency) || '₹';
    return `✏️ ${ln.name} outstanding → ${sym}${amount}`;
  }
  // add
  const amount = _extractAmount(text);
  if (!amount || amount <= 0) return null;
  let name = _stripToName(text) || 'Loan';
  name = name.charAt(0).toUpperCase() + name.slice(1);
  STATE.loans = list;
  STATE.loans.push({ id: genId(), name, type: 'Other', principal: amount, outstanding: amount, rate: 0, emi: 0 });
  saveState();
  const sym = (STATE.settings && STATE.settings.currency) || '₹';
  return `🏦 Loan added: ${name} (${sym}${amount})`;
}

// Try each CRUD handler in order; first non-null feedback wins.
function handleCrudIntent(text) {
  const handlers = [_voiceBankBalance, _voiceBudget, _voiceGoal, _voiceAsset, _voiceLoan];
  for (const h of handlers) {
    let res = null;
    try { res = h(text); } catch (e) { res = null; }
    if (res) return res;
  }
  return null;
}

// Detect "add a transaction" intent and build a tx object, or return null.
function parseTransactionCommand(text) {
  // Money intent words across the 3 languages
  const intent = /(transaction|expense|income|spend|spent|paid|pay|add|log|record|சேர்|செலவ|வருமான|பதி|खर्च|आय|जोड़|जमा|दर्ज|खरीद)/i;
  // Things that are NOT transactions even if they contain "add"
  const notTx = /(budget|goal|target|habit|balance|asset|investment|loan|debt|பட்ஜெட்|இலக்கு|பழக்கம்|இருப்பு|சொத்து|கடன்|बजट|लक्ष्य|आदत|बैलेंस|संपत्ति|कर्ज|ऋण)/i;
  if (!intent.test(text) || notTx.test(text)) return null;

  // Date first — then strip it so a day number ("may 25") isn't read as the amount.
  const dInfo = _extractDate(text);
  const date = dInfo.date;
  const textNoDate = dInfo.raw ? text.replace(dInfo.raw.toLowerCase(), ' ') : text;

  const amount = _extractAmount(textNoDate);
  if (!amount || amount <= 0) return null;          // no amount → not a transaction entry

  // Type: income vs expense (default expense)
  const isIncome = /(income|salary|earned|credit|received|வருமான|சம்பள|आय|कमाई|वेतन|जमा|मिला)/i.test(text);
  const type = isIncome ? 'income' : 'expense';

  // Category: match against real CATEGORIES (English name or its translation)
  const cats = (typeof CATEGORIES !== 'undefined') ? CATEGORIES : [];
  let matched = null;
  for (const c of cats) {
    const names = [c.name.toLowerCase()];
    const tr = I18N[c.name];
    if (tr) { if (tr.ta) names.push(tr.ta.toLowerCase()); if (tr.hi) names.push(tr.hi.toLowerCase()); }
    if (names.some(n => text.includes(n))) { matched = c; break; }
  }
  // Sensible defaults if no category spoken
  if (!matched) matched = cats.find(c => c.name === (isIncome ? 'Salary' : 'Other')) || { name: 'Other', icon: '📦' };

  // Description: text after "for" / "on", cleaned of the matched date,
  // the category name, and trailing punctuation. Blank if it adds nothing.
  let description = '';
  const dm = textNoDate.match(/\b(?:for|on)\s+(.+)$/i);
  if (dm) {
    description = dm[1]
      .replace(/(today|yesterday|tomorrow|நேற்று|இன்று|நாளை|कल|आज)/gi, '')
      .replace(new RegExp('\\b' + matched.name + '\\b', 'gi'), '')
      .replace(/\b(in|on|at|for|the|a|an|of|to)\b/gi, '')   // drop dangling connectors
      .replace(/[.\s]+/g, ' ').trim();
  }

  return { type, amount, date, category: matched.name, icon: matched.icon || '💳', description, source: '' };
}

// Parse a recognized phrase: try transaction entry first, then commands.
function handleVoiceTranscript(raw) {
  const text = (raw || '').toLowerCase().trim();
  if (!text) return;

  // 1) Hands-free CRUD (bank balance, budget, goal, asset, loan)
  const crud = handleCrudIntent(text);
  if (crud) {
    if (typeof toast === 'function') toast(`🎙️ ${crud}`, 'success');
    _speak(crud.replace(/[^\p{L}\p{N}\s.]/gu, ''));
    if (typeof softRefresh === 'function') softRefresh();
    return;
  }

  // 2) Natural-language transaction ("add 10 rupees today in food")
  const tx = parseTransactionCommand(text);
  if (tx && typeof _commitTx === 'function') {
    _commitTx(tx);
    const sym = (STATE.settings && STATE.settings.currency) || '₹';
    const verb = tx.type === 'income' ? 'Income' : 'Expense';
    const msg = `${tx.icon} ${verb} ${sym}${tx.amount} · ${tx.category}`;
    if (typeof toast === 'function') toast(`🎙️ ${msg}`, 'success');
    _speak(`Added ${tx.type} ${tx.amount} ${tx.category}`);
    if (typeof currentPage !== 'undefined' && currentPage === 'finance' && typeof navigate === 'function') navigate('finance', true);
    return;
  }

  // 2) Keyword commands (navigation, actions, language)
  for (const cmd of VOICE_COMMANDS) {
    if (cmd.keys.some(k => text.includes(k.toLowerCase()))) {
      cmd.run();
      _speak(cmd.say);
      if (typeof toast === 'function') toast(`🎙️ ${cmd.say}`, 'success');
      return;
    }
  }
  if (typeof toast === 'function') toast(`🎙️ "${raw}" — ${t('voice_no_match')}`, 'warning');
  _speak(t('voice_no_match'));
}

// ============================================================
//  Full-screen Voice Command page (wave animation + live transcript)
// ============================================================
let _vpRec = null;
let _vpListening = false;

let _vpPadSnap = null;
function openVoicePage() {
  _vpPadSnap = (typeof _pad !== 'undefined' && _pad) ? _pad : null;
  let el = document.getElementById('voice-page');
  if (!el) { el = document.createElement('div'); el.id = 'voice-page'; document.body.appendChild(el); }
  const E = 'arrow-up-right', I = 'arrow-down-left', B = 'landmark', N = 'layout-dashboard', A = 'zap';
  const examples = [
    { h: 'Expenses' },
    { ic: E, t: '“Spent 250 on food”' },
    { ic: E, t: '“Paid 500 for groceries”' },
    { ic: E, t: '“Bought coffee for 80”' },
    { ic: E, t: '“Spent 1200 on shopping”' },
    { ic: E, t: '“Paid 300 for fuel”' },
    { ic: E, t: '“Spent 150 on transport”' },
    { ic: E, t: '“Paid 2000 rent”' },
    { ic: E, t: '“Spent 600 on entertainment”' },
    { ic: E, t: '“Paid 450 for health”' },
    { ic: E, t: '“Spent 99 on subscriptions”' },
    { ic: E, t: '“Paid 1500 EMI”' },
    { ic: E, t: '“Spent 350 on travel”' },
    { ic: E, t: '“Paid 700 electricity bill”' },
    { ic: E, t: '“Paid 1000 insurance”' },
    { ic: E, t: '“Spent 250 on education”' },
    { ic: E, t: '“Spent 400 on gifts”' },
    { ic: E, t: '“Add expense 500 shopping”' },
    { h: 'Income' },
    { ic: I, t: '“Income 20000 salary”' },
    { ic: I, t: '“Received 5000 freelance”' },
    { ic: I, t: '“Got 1000 gift”' },
    { ic: I, t: '“Add income 15000 business”' },
    { ic: I, t: '“Received 250 interest”' },
    { ic: I, t: '“Salary 30000”' },
    { ic: I, t: '“Received 2000 bonus”' },
    { ic: I, t: '“Income 1200 from rent”' },
    { h: 'Banks & Accounts' },
    { ic: B, t: '“Open bank tracker”' },
    { ic: B, t: '“Show bank balance”' },
    { ic: B, t: '“Show credit cards”' },
    { ic: B, t: '“Show cash / wallet”' },
    { ic: B, t: '“Net worth”' },
    { ic: B, t: '“Open assets”' },
    { ic: B, t: '“Open budget”' },
    { ic: B, t: '“Show all transactions”' },
    { ic: B, t: '“Open records”' },
    { h: 'Navigate' },
    { ic: N, t: '“Go to dashboard”' },
    { ic: N, t: '“Open finance”' },
    { ic: N, t: '“Open health / habits / goals”' },
    { ic: N, t: '“Open journal”' },
    { ic: N, t: '“Open categories”' },
    { ic: N, t: '“Open analytics”' },
    { ic: N, t: '“Open settings”' },
    { ic: N, t: '“Help”' },
    { h: 'Quick actions' },
    { ic: A, t: '“Add expense” · “Add income”' },
    { ic: A, t: '“Open calculator”' },
    { ic: A, t: '“Add goal” · “Add habit”' },
    { ic: A, t: '“Write journal”' },
    { ic: A, t: '“Dark mode” · “Light mode”' },
    { ic: A, t: '“Sync now”' },
  ];
  el.innerHTML = `
    <button class="vp-close" onclick="closeVoicePage()"><i data-lucide="x"></i></button>
    <div class="vp-orb" id="vp-orb" onclick="vpToggleListen()">
      <span class="vp-ring"></span><span class="vp-ring"></span><span class="vp-ring"></span>
      <button class="vp-mic"><i data-lucide="mic"></i></button>
    </div>
    <p class="vp-status" id="vp-status">Listening…</p>
    <p class="vp-transcript" id="vp-transcript">Say a command</p>
    <div class="vp-cmds">
      <p class="vp-cmds-title">Commands this app understands</p>
      ${examples.map(e => e.h
        ? `<p class="vp-cmd-head">${e.h}</p>`
        : `<div class="vp-cmd"><span class="vp-cmd-ic"><i data-lucide="${e.ic}"></i></span><span class="vp-cmd-txt">${e.t}</span></div>`).join('')}
    </div>`;
  el.style.display = 'flex';
  if (window.lucide && lucide.createIcons) lucide.createIcons();
  vpStartListen();
}

function closeVoicePage() {
  vpStopListen();
  const el = document.getElementById('voice-page');
  if (el) el.style.display = 'none';
  // If we came from the Add sheet, bring it back instead of revealing Records.
  const p = (typeof _pad !== 'undefined' && _pad) ? _pad : _vpPadSnap;
  if (p && typeof renderTxPad === 'function') { _pad = p; renderTxPad(); }
}

function vpToggleListen() { if (_vpListening) vpStopListen(); else vpStartListen(); }

function vpStartListen() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const orb = document.getElementById('vp-orb');
  const status = document.getElementById('vp-status');
  if (!SR) { if (status) status.textContent = 'Voice not supported on this device'; return; }
  try { if (_vpRec) _vpRec.abort(); } catch (_) {}
  _vpRec = new SR();
  _vpRec.lang = (typeof VOICE_LANGS !== 'undefined' && typeof getLang === 'function') ? VOICE_LANGS[getLang()].speech : 'en-IN';
  _vpRec.interimResults = true;
  _vpRec.continuous = false;
  _vpRec.maxAlternatives = 3;
  _vpRec.onstart = () => { _vpListening = true; if (orb) orb.classList.add('on'); if (status) status.textContent = 'Listening…'; };
  _vpRec.onerror = (e) => { _vpListening = false; if (orb) orb.classList.remove('on'); if (status) status.textContent = e.error === 'not-allowed' ? 'Microphone permission denied' : 'Tap the mic to try again'; };
  _vpRec.onend = () => { _vpListening = false; if (orb) orb.classList.remove('on'); };
  _vpRec.onresult = (e) => {
    let txt = '';
    for (let i = 0; i < e.results.length; i++) txt += e.results[i][0].transcript;
    const tEl = document.getElementById('vp-transcript');
    if (tEl) tEl.textContent = txt;
    if (e.results[e.results.length - 1].isFinal) {
      if (status) status.textContent = 'Got it ✓';
      setTimeout(() => { handleVoiceTranscript(txt); closeVoicePage(); }, 500);
    }
  };
  try { _vpRec.start(); } catch (_) {}
}

function vpStopListen() {
  _vpListening = false;
  const orb = document.getElementById('vp-orb'); if (orb) orb.classList.remove('on');
  if (_vpRec) { try { _vpRec.stop(); } catch (_) {} }
}

function startVoiceControl() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    if (typeof toast === 'function') toast(t('voice_not_supported'), 'error');
    return;
  }
  if (_listening) { stopVoiceControl(); return; }

  _recognition = new SR();
  _recognition.lang = VOICE_LANGS[getLang()].speech;
  _recognition.interimResults = false;
  _recognition.maxAlternatives = 3;
  _recognition.continuous = false;

  _recognition.onstart = () => { _setMicState(true); if (typeof toast === 'function') toast(`🎙️ ${t('voice_listening')}`, 'info'); };
  _recognition.onerror = (e) => { _setMicState(false); if (e.error === 'not-allowed') toast('🎙️ Microphone permission denied', 'error'); };
  _recognition.onend = () => _setMicState(false);
  _recognition.onresult = (e) => {
    // Try every alternative across the single result for best match
    const results = e.results[0];
    let handled = false;
    for (let i = 0; i < results.length && !handled; i++) {
      const phrase = results[i].transcript;
      const before = _listening;
      handleVoiceTranscript(phrase);
      handled = true; // handleVoiceTranscript always resolves (match or no-match)
    }
  };

  try { _recognition.start(); }
  catch { _setMicState(false); }
}

function stopVoiceControl() {
  if (_recognition) { try { _recognition.stop(); } catch {} }
  _setMicState(false);
}

function toggleVoiceControl() {
  if (_listening) stopVoiceControl();
  else startVoiceControl();
}

// ============================================================
//  INIT — inject mic + language pill, apply saved language
// ============================================================
function initVoiceControl() {
  applyTranslations();

  const dock = document.getElementById('float-dock');
  if (dock && !document.getElementById('voice-mic-btn')) {
    // Language pill (cycles en → ta → hi)
    const pill = document.createElement('button');
    pill.id = 'voice-lang-pill';
    pill.className = 'float-dock-btn dock-btn';
    pill.title = 'Change language (English / தமிழ் / हिन्दी)';
    pill.style.fontSize = '18px';
    pill.textContent = VOICE_LANGS[getLang()].flag;
    pill.onclick = cycleLanguage;

    // Mic button
    const mic = document.createElement('button');
    mic.id = 'voice-mic-btn';
    mic.className = 'float-dock-btn dock-btn';
    mic.title = 'Voice command';
    mic.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>';
    mic.onclick = toggleVoiceControl;

    dock.appendChild(pill);
    dock.appendChild(mic);
  }
}

// Re-apply translations whenever a page is (re)rendered so dynamically
// injected [data-i18n] nodes stay localized.
document.addEventListener('DOMContentLoaded', () => {
  // Defer until STATE + sidebar exist; showApp() also calls initVoiceControl().
  setTimeout(() => { if (typeof STATE !== 'undefined' && STATE && STATE.user) initVoiceControl(); }, 400);
});
