"use client";
import { useState } from "react";

interface RetryImgProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  maxRetries?: number;
  placeholderStyle?: React.CSSProperties;
}

/**
 * <img> wrapper that retries on load failure.
 * Uses key-based remount to force a fresh network request.
 * Falls back to a neutral placeholder after maxRetries.
 */
export function RetryImg({
  src,
  maxRetries = 2,
  placeholderStyle,
  style,
  ...props
}: RetryImgProps) {
  const [retryKey, setRetryKey] = useState(0);
  const [failed, setFailed] = useState(false);

  const handleError = () => {
    if (retryKey < maxRetries) {
      const delay = 800 * (retryKey + 1);
      setTimeout(() => setRetryKey(k => k + 1), delay);
    } else {
      setFailed(true);
    }
  };

  if (failed) {
    return (
      <div
        style={{
          background: "rgba(120,120,120,0.12)",
          ...style,
          ...placeholderStyle,
        }}
      />
    );
  }

  return (
    <img
      key={retryKey}
      src={src}
      onError={handleError}
      style={style}
      {...props}
    />
  );
}
