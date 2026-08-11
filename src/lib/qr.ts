import 'server-only';
import QRCode from 'qrcode';

/**
 * QR code as a data URL, ready to drop into an <img>.
 *
 * Error correction is set to "M" and the module size kept generous: this code
 * gets printed on a certificate that may be photocopied for a school file, and
 * a code that only scans from a pristine original is not much use.
 */
export function qrDataUrl(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    errorCorrectionLevel: 'M',
    margin: 1,
    scale: 8,
    color: { dark: '#0b4f4dff', light: '#ffffffff' },
  });
}
