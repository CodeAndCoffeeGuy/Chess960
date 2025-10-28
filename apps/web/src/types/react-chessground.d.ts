declare module 'react-chessground' {
  import { Component } from 'react';

  interface ChessgroundProps {
    fen?: string;
    orientation?: 'white' | 'black';
    lastMove?: [string, string];
    viewOnly?: boolean;
    onSquareClick?: (square: string) => void;
    onSquareRightClick?: (square: string) => void;
    squareStyles?: { [key: string]: { backgroundColor?: string; background?: string; borderRadius?: string } };
    style?: React.CSSProperties;
    width?: string | number;
    height?: string | number;
    coordinates?: boolean;
    turnColor?: 'white' | 'black';
    check?: boolean;
    movable?: boolean;
    premovable?: boolean;
    selectable?: boolean;
    draggable?: boolean;
    events?: {
      change?: () => void;
      move?: (orig: string, dest: string) => void;
      dropNewPiece?: (piece: string, square: string) => void;
      select?: (square: string) => void;
      deselect?: (square: string) => void;
    };
    animation?: {
      enabled?: boolean;
      duration?: number;
    };
    highlight?: {
      lastMove?: boolean;
      check?: boolean;
    };
    drawable?: {
      enabled?: boolean;
      visible?: boolean;
      defaultSnapToValidMove?: boolean;
      eraseOnClick?: boolean;
      shapes?: Array<{
        orig: string;
        dest: string;
        brush: string;
        modifiers?: string[];
      }>;
      autoShapes?: Array<{
        orig: string;
        dest: string;
        brush: string;
        modifiers?: string[];
      }>;
      brushes?: { [key: string]: { key: string; color: string; lineWidth: number; opacity: number } };
      pieces?: {
        baseUrl?: string;
        white?: string;
        black?: string;
      };
    };
  }

  export default class Chessground extends Component<ChessgroundProps> {}
}
