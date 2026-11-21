import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import type { StatusResponse } from '../shared/types';

/** The address phones should open. On localhost, use this computer's Wi-Fi address so a phone can reach it. */
export function pewBaseUrl(status: StatusResponse | null): string {
  const { hostname, port, protocol, origin } = window.location;
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
  if (isLocal && status?.lanAddresses[0]) return `${protocol}//${status.lanAddresses[0]}${port ? `:${port}` : ''}`;
  return origin;
}

export function pewUrl(status: StatusResponse | null, churchId: string, lang?: string): string {
  return `${pewBaseUrl(status)}/#/pew?church=${churchId}${lang ? `&lang=${lang}` : ''}`;
}

export const PewQrCode: React.FC<{ value: string; className?: string }> = ({ value, className }) => {
  const [svg, setSvg] = useState<string>('');
  useEffect(() => {
    QRCode.toString(value, { type: 'svg', margin: 1, errorCorrectionLevel: 'M', color: { dark: '#1c1915', light: '#FFFFFF' } })
      .then(setSvg)
      .catch(() => setSvg(''));
  }, [value]);
  return (
    <div
      className={className}
      role="img"
      aria-label={`QR code for ${value}`}
      // The SVG is generated locally by the qrcode library from our own URL.
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
};
