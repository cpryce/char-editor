import type { CSSProperties } from 'react';

interface Dice3DProps {
  sides: number;
  color?: number | string;
  results?: number[];
  isRolling?: boolean;
  animationMode?: 'full' | 'quick' | 'none';
  rollTrigger?: number;
  d6Style?: 'numbers' | 'dots';
  height?: number;
  className?: string;
  style?: CSSProperties;
  emptyText?: string;
}

declare const Dice3D: (props: Dice3DProps) => JSX.Element;
export default Dice3D;
