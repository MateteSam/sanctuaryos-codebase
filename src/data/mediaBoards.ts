import type { MediaBoard } from '@/types/sanctuary';

export const mediaBoards: MediaBoard[] = [
  {
    id: 'church-control',
    title: 'Church control station',
    caption: 'Operator-focused SanctuaryOS control views during a live church service.',
    tag: 'Live operation',
    imageSrc: '/demo/church-control-collage.png',
  },
  {
    id: 'workflow-board',
    title: 'Step-by-step church workflow',
    caption: 'A visual board showing setup, live operation, and post-service synchronization.',
    tag: 'Church workflow',
    imageSrc: '/demo/church-workflow-board.png',
  },
  {
    id: 'file-guide',
    title: 'Project handoff guide',
    caption: 'A helper image you can use while moving the codebase into your own project space.',
    tag: 'Setup guide',
    imageSrc: '/demo/file-copy-guide.png',
  },
];
