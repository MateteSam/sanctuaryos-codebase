import type { LucideIcon } from 'lucide-react';

export type Stat = {
  label: string;
  value: string;
  icon: LucideIcon;
};

export type Room = {
  name: string;
  beams: number;
  profile: string;
};

export type SetItem = {
  type: string;
  title: string;
  length: string;
};

export type DemoScene = {
  id: string;
  title: string;
  subtitle: string;
  palette: string;
  verse: string;
  mode: string;
  // Optional aliases used by BeamClient (for back-compat)
  name?: string;
  color?: string;
};


export type WorkflowStep = {
  id: number;
  title: string;
  description: string;
  icon: LucideIcon;
};

export type MediaBoard = {
  id: string;
  title: string;
  caption: string;
  tag: string;
  imageSrc: string;
};

export type DashboardNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};
