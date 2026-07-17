import { useMemo } from 'react';
import { useWindowDimensions, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

const PORTL_QR_LOGO = require('../../../assets/images/icon.png');

export function formatPreApprovalQrValue(code: string) {
  return code.trim().toUpperCase();
}

/** Ref handle returned by PreApprovalQrCode – call toDataURL to get a PNG base64 string. */
export interface PreApprovalQrCodeRef {
  toDataURL: (callback: (base64: string) => void) => void;
}

interface Props {
  code: string;
  /** Optional ref to the underlying SVG so callers can capture a PNG via toDataURL(). */
  qrRef?: React.RefObject<PreApprovalQrCodeRef | null>;
}

export function PreApprovalQrCode({ code, qrRef }: Props) {
  const { width } = useWindowDimensions();
  const value = formatPreApprovalQrValue(code);
  const size = useMemo(() => Math.min(280, Math.floor(width - 64)), [width]);
  const logoSize = Math.round(size * 0.18);

  return (
    <View className="overflow-hidden rounded-lg bg-white" style={{ borderCurve: 'continuous' }}>
      <QRCode
        value={value}
        size={size}
        ecl="H"
        quietZone={8}
        backgroundColor="#FFFFFF"
        color="#000000"
        logo={PORTL_QR_LOGO}
        logoSize={logoSize}
        logoBackgroundColor="#FFFFFF"
        logoMargin={2}
        logoBorderRadius={8}
        getRef={(ref) => {
          if (qrRef) qrRef.current = ref as unknown as PreApprovalQrCodeRef;
        }}
      />
    </View>
  );
}
