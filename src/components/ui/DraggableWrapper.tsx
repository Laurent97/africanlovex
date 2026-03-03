import React, { useRef } from 'react';
import Draggable, { DraggableProps } from 'react-draggable';

interface DraggableWrapperProps {
  children: React.ReactNode;
  handle?: string;
  position?: { x: number; y: number };
  onStart?: (data: any) => void;
  onStop?: (data: any) => void;
  disabled?: boolean;
  style?: React.CSSProperties;
}

export const DraggableWrapper = ({
  children,
  handle,
  position,
  onStart,
  onStop,
  disabled,
  className,
  style,
  ...props
}: DraggableWrapperProps) => {
  const nodeRef = useRef<HTMLDivElement>(null);

  // Filter out unsupported props
  const { defaultClassName, defaultStyle, ...draggableProps } = props as any;

  return (
    <Draggable
      nodeRef={nodeRef}
      handle={handle}
      position={position}
      onStart={onStart}
      onStop={onStop}
      disabled={disabled}
      defaultClassName={className}
      defaultStyle={style}
      {...draggableProps}
    >
      <div ref={nodeRef}>{children}</div>
    </Draggable>
  );
};
