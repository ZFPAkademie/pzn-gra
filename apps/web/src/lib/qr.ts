import QRCode from 'qrcode';

export async function generatePaymentQR(params: {
  iban: string;
  amount: number; // in CZK (not cents)
  message: string;
  recipientName?: string;
}): Promise<string> {
  const ibanClean = params.iban.replace(/\s/g, '');
  const spdString = [
    'SPD*1.0',
    `ACC:${ibanClean}`,
    `AM:${params.amount.toFixed(2)}`,
    'CC:CZK',
    `MSG:${params.message.slice(0, 60)}`,
  ].join('*');

  return QRCode.toDataURL(spdString, {
    width: 200,
    margin: 1,
    color: { dark: '#0B1626', light: '#FFFFFF' },
    errorCorrectionLevel: 'M',
  });
}
