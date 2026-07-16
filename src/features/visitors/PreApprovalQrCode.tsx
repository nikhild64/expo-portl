import { useMemo } from 'react';
import { useWindowDimensions, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

export function formatPreApprovalQrValue(code: string) {
  return code.trim().toUpperCase();
}

interface Props {
  code: string;
}

export function PreApprovalQrCode({ code }: Props) {
  const { width } = useWindowDimensions();
  const value = formatPreApprovalQrValue(code);
  const size = useMemo(() => Math.min(300, Math.floor(width - 88)), [width]);

  return (
    <View className="rounded-lg bg-white p-lg" style={{ borderCurve: 'continuous' }}>
      <QRCode
        value={value}
        size={size}
        ecl="H"
        quietZone={20}
        backgroundColor="#FFFFFF"
        color="#000000"
      />
    </View>
  );
}
