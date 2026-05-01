// Built-in Bible: Popular worship & sermon scriptures across major books
// In production this connects to a full scripture API (api.bible / BibleGateway)

export interface BibleVerse {
  id: string;
  reference: string;
  book: string;
  chapter: number;
  verse: number;
  text: string;
  translation: string;
}

export interface BibleBook {
  name: string;
  shortName: string;
  testament: 'OT' | 'NT';
}

export const bibleBooks: BibleBook[] = [
  { name: 'Genesis', shortName: 'Gen', testament: 'OT' },
  { name: 'Psalms', shortName: 'Ps', testament: 'OT' },
  { name: 'Proverbs', shortName: 'Prov', testament: 'OT' },
  { name: 'Isaiah', shortName: 'Isa', testament: 'OT' },
  { name: 'Matthew', shortName: 'Matt', testament: 'NT' },
  { name: 'John', shortName: 'John', testament: 'NT' },
  { name: 'Romans', shortName: 'Rom', testament: 'NT' },
  { name: 'Ephesians', shortName: 'Eph', testament: 'NT' },
  { name: 'Philippians', shortName: 'Phil', testament: 'NT' },
  { name: 'Colossians', shortName: 'Col', testament: 'NT' },
  { name: 'Hebrews', shortName: 'Heb', testament: 'NT' },
  { name: 'Revelation', shortName: 'Rev', testament: 'NT' },
];

export const scriptureLibrary: BibleVerse[] = [
  // Psalms
  { id: 'ps23-1', reference: 'Psalm 23:1', book: 'Psalms', chapter: 23, verse: 1, translation: 'NIV', text: 'The Lord is my shepherd, I lack nothing.' },
  { id: 'ps46-1', reference: 'Psalm 46:1', book: 'Psalms', chapter: 46, verse: 1, translation: 'NIV', text: 'God is our refuge and strength, an ever-present help in trouble.' },
  { id: 'ps100-4', reference: 'Psalm 100:4', book: 'Psalms', chapter: 100, verse: 4, translation: 'NIV', text: 'Enter his gates with thanksgiving and his courts with praise; give thanks to him and praise his name.' },
  { id: 'ps104-1', reference: 'Psalm 104:1', book: 'Psalms', chapter: 104, verse: 1, translation: 'NIV', text: 'Praise the Lord, my soul. Lord my God, you are very great; you are clothed with splendor and majesty.' },
  { id: 'ps150-6', reference: 'Psalm 150:6', book: 'Psalms', chapter: 150, verse: 6, translation: 'NIV', text: 'Let everything that has breath praise the Lord. Praise the Lord.' },
  // Isaiah
  { id: 'isa40-31', reference: 'Isaiah 40:31', book: 'Isaiah', chapter: 40, verse: 31, translation: 'NIV', text: 'But those who hope in the Lord will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint.' },
  { id: 'isa41-10', reference: 'Isaiah 41:10', book: 'Isaiah', chapter: 41, verse: 10, translation: 'NIV', text: 'So do not fear, for I am with you; do not be dismayed, for I am your God. I will strengthen you and help you; I will uphold you with my righteous right hand.' },
  // John
  { id: 'jn1-1', reference: 'John 1:1', book: 'John', chapter: 1, verse: 1, translation: 'NIV', text: 'In the beginning was the Word, and the Word was with God, and the Word was God.' },
  { id: 'jn3-16', reference: 'John 3:16', book: 'John', chapter: 3, verse: 16, translation: 'NIV', text: 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.' },
  { id: 'jn14-6', reference: 'John 14:6', book: 'John', chapter: 14, verse: 6, translation: 'NIV', text: 'Jesus answered, "I am the way and the truth and the life. No one comes to the Father except through me."' },
  { id: 'jn15-5', reference: 'John 15:5', book: 'John', chapter: 15, verse: 5, translation: 'NIV', text: 'I am the vine; you are the branches. If you remain in me and I in you, you will bear much fruit; apart from me you can do nothing.' },
  // Romans
  { id: 'rom8-28', reference: 'Romans 8:28', book: 'Romans', chapter: 8, verse: 28, translation: 'NIV', text: 'And we know that in all things God works for the good of those who love him, who have been called according to his purpose.' },
  { id: 'rom8-38', reference: 'Romans 8:38-39', book: 'Romans', chapter: 8, verse: 38, translation: 'NIV', text: 'For I am convinced that neither death nor life, neither angels nor demons, neither the present nor the future, nor any powers, neither height nor depth, nor anything else in all creation, will be able to separate us from the love of God that is in Christ Jesus our Lord.' },
  { id: 'rom12-1', reference: 'Romans 12:1', book: 'Romans', chapter: 12, verse: 1, translation: 'NIV', text: 'Therefore, I urge you, brothers and sisters, in view of God\'s mercy, to offer your bodies as a living sacrifice, holy and pleasing to God—this is your true and proper worship.' },
  // Philippians
  { id: 'phil4-4', reference: 'Philippians 4:4', book: 'Philippians', chapter: 4, verse: 4, translation: 'NIV', text: 'Rejoice in the Lord always. I will say it again: Rejoice!' },
  { id: 'phil4-7', reference: 'Philippians 4:7', book: 'Philippians', chapter: 4, verse: 7, translation: 'NIV', text: 'And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus.' },
  { id: 'phil4-13', reference: 'Philippians 4:13', book: 'Philippians', chapter: 4, verse: 13, translation: 'NIV', text: 'I can do all this through him who gives me strength.' },
  // Ephesians
  { id: 'eph2-8', reference: 'Ephesians 2:8-9', book: 'Ephesians', chapter: 2, verse: 8, translation: 'NIV', text: 'For it is by grace you have been saved, through faith—and this is not from yourselves, it is the gift of God— not by works, so that no one can boast.' },
  { id: 'eph3-20', reference: 'Ephesians 3:20', book: 'Ephesians', chapter: 3, verse: 20, translation: 'NIV', text: 'Now to him who is able to do immeasurably more than all we ask or imagine, according to his power that is at work within us.' },
  // Hebrews
  { id: 'heb11-1', reference: 'Hebrews 11:1', book: 'Hebrews', chapter: 11, verse: 1, translation: 'NIV', text: 'Now faith is confidence in what we hope for and assurance about what we do not see.' },
  // Revelation
  { id: 'rev4-11', reference: 'Revelation 4:11', book: 'Revelation', chapter: 4, verse: 11, translation: 'NIV', text: 'You are worthy, our Lord and God, to receive glory and honor and power, for you created all things, and by your will they were created and have their being.' },
  // Matthew
  { id: 'matt5-14', reference: 'Matthew 5:14', book: 'Matthew', chapter: 5, verse: 14, translation: 'NIV', text: 'You are the light of the world. A town built on a hill cannot be hidden.' },
  { id: 'matt6-33', reference: 'Matthew 6:33', book: 'Matthew', chapter: 6, verse: 33, translation: 'NIV', text: 'But seek first his kingdom and his righteousness, and all these things will be given to you as well.' },
  { id: 'matt28-19', reference: 'Matthew 28:19', book: 'Matthew', chapter: 28, verse: 19, translation: 'NIV', text: 'Therefore go and make disciples of all nations, baptizing them in the name of the Father and of the Son and of the Holy Spirit.' },
  // Proverbs
  { id: 'prov3-5', reference: 'Proverbs 3:5-6', book: 'Proverbs', chapter: 3, verse: 5, translation: 'NIV', text: 'Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.' },
  // Colossians
  { id: 'col3-16', reference: 'Colossians 3:16', book: 'Colossians', chapter: 3, verse: 16, translation: 'NIV', text: 'Let the message of Christ dwell among you richly as you teach and admonish one another with all wisdom through psalms, hymns, and songs from the Spirit, singing to God with gratitude in your hearts.' },
];
