import { Cloud, Map, Play, Presentation, ScanLine, Sparkles } from 'lucide-react';
import type { WorkflowStep } from '@/types/sanctuary';

export const workflowSteps: WorkflowStep[] = [
  {
    id: 1,
    title: 'Scan the church',
    description: 'A volunteer scans the room so SanctuaryOS can detect walls, stage edges, and projection surfaces.',
    icon: ScanLine,
  },
  {
    id: 2,
    title: 'Save the room profile',
    description: 'The layout is saved for Sunday services, youth nights, or prayer meetings.',
    icon: Map,
  },
  {
    id: 3,
    title: 'Build the worship flow',
    description: 'Songs, scripture, and ministry moments are arranged into a flexible live set.',
    icon: Presentation,
  },
  {
    id: 4,
    title: 'Launch atmosphere',
    description: 'A visual scene is applied across the room so stage and walls feel like one environment.',
    icon: Sparkles,
  },
  {
    id: 5,
    title: 'Run live service',
    description: 'The operator changes lyrics, shifts visuals, and keeps everything synchronized from one dashboard.',
    icon: Play,
  },
  {
    id: 6,
    title: 'Sync to cloud',
    description: 'After the service, the setup can be saved and synced to other rooms or campuses.',
    icon: Cloud,
  },
];
