export type SlideType = 'lyric' | 'scripture' | 'blank';

export interface SlideData {
  id: string;
  type: SlideType;
  content: string;
  reference?: string;
  title?: string;
}

export const sampleSet: SlideData[] = [
  { id: 's1', type: 'lyric', title: 'Verse 1', content: "The Splendor of the King\nClothed in majesty\nLet all the earth rejoice\nAll the earth rejoice" },
  { id: 's2', type: 'lyric', title: 'Verse 2', content: "He wraps Himself in light\nAnd darkness tries to hide\nAnd trembles at His voice\nTrembles at His voice" },
  { id: 's3', type: 'lyric', title: 'Chorus', content: "How great is our God\nSing with me\nHow great is our God\nAnd all will see\nHow great, how great is our God" },
  { id: 's4', type: 'blank', title: 'Instrumental', content: "" },
  { id: 's5', type: 'scripture', title: 'Sermon Text', reference: 'John 1:1-5', content: "In the beginning was the Word, and the Word was with God, and the Word was God. He was with God in the beginning. Through him all things were made; without him nothing was made that has been made. In him was life, and that life was the light of all mankind. The light shines in the darkness, and the darkness has not overcome it." },
  { id: 's6', type: 'scripture', title: 'Benediction', reference: 'Numbers 6:24-26', content: "The Lord bless you and keep you;\nthe Lord make his face shine on you and be gracious to you;\nthe Lord turn his face toward you and give you peace." },
];
