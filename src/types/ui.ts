export interface UIComponentProps {
  className?: string;
}

export interface ResponsiveBreakpoints {
  sm: string;
  md: string;
  lg: string;
  xl: string;
}

export interface AnimationVariants {
  initial: object;
  animate: object;
  exit?: object;
}
