import React from 'react';

interface ImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  fill?: boolean;
  priority?: boolean;
  style?: React.CSSProperties;
}

export default function Image({ src, alt, width, height, className, fill, style }: ImageProps) {
  const imgStyle: React.CSSProperties = fill 
    ? { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', ...style }
    : { ...style };
  
  return (
    <img 
      src={src} 
      alt={alt} 
      width={width} 
      height={height} 
      className={className}
      style={imgStyle}
    />
  );
}
