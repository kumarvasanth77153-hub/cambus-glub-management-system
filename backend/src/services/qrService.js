import QRCode from 'qrcode';

export const qrService = {
  generateQRCodeDataURL: async (text) => {
    try {
      return await QRCode.toDataURL(text, {
        width: 300,
        margin: 2,
        color: {
          dark: '#1e1b4b',
          light: '#ffffff',
        },
      });
    } catch (err) {
      console.error('Error generating QR code:', err);
      throw err;
    }
  },

  generateQRCodeBuffer: async (text) => {
    try {
      return await QRCode.toBuffer(text, {
        width: 250,
        margin: 2,
      });
    } catch (err) {
      console.error('Error generating QR buffer:', err);
      throw err;
    }
  },
};
