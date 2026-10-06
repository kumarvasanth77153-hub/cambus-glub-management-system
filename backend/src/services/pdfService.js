import PDFDocument from 'pdfkit';
import { qrService } from './qrService.js';

export const pdfService = {
  generateCertificatePDF: async (certificate, res) => {
    const doc = new PDFDocument({
      layout: 'landscape',
      size: 'A4',
      margin: 40,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=certificate_${certificate.verification_uuid}.pdf`
    );

    doc.pipe(res);

    // Decorative Borders
    doc
      .rect(20, 20, doc.page.width - 40, doc.page.height - 40)
      .lineWidth(3)
      .strokeColor('#4338ca')
      .stroke();

    doc
      .rect(28, 28, doc.page.width - 56, doc.page.height - 56)
      .lineWidth(1)
      .strokeColor('#e0e7ff')
      .stroke();

    // Header / Institution
    const collegeName = certificate.college?.name || 'CAMPUS CLUB SYSTEM';
    doc
      .fontSize(20)
      .font('Helvetica-Bold')
      .fillColor('#4338ca')
      .text(collegeName.toUpperCase(), 0, 70, { align: 'center' });

    doc
      .fontSize(14)
      .font('Helvetica')
      .fillColor('#6b7280')
      .text('OFFICIAL EXTRACURRICULAR CERTIFICATE OF ACHIEVEMENT', 0, 100, {
        align: 'center',
      });

    // Certificate Title
    doc
      .fontSize(32)
      .font('Helvetica-Bold')
      .fillColor('#1e1b4b')
      .text(certificate.type.toUpperCase(), 0, 145, { align: 'center' });

    // Body
    doc
      .fontSize(14)
      .font('Helvetica')
      .fillColor('#4b5563')
      .text('This is proudly presented to', 0, 210, { align: 'center' });

    const studentName =
      certificate.student?.name ||
      `${certificate.student?.first_name || ''} ${certificate.student?.last_name || ''}`.trim() ||
      certificate.student?.email ||
      'Distinguished Student';

    doc
      .fontSize(26)
      .font('Helvetica-Bold')
      .fillColor('#312e81')
      .text(studentName, 0, 240, { align: 'center' });

    const clubName = certificate.club?.name || 'Official College Club';
    const eventOrActivity =
      certificate.event?.title || certificate.activity?.title || 'active participation';

    doc
      .fontSize(13)
      .font('Helvetica')
      .fillColor('#4b5563')
      .text(
        `for exemplary participation and dedication in ${clubName} - "${eventOrActivity}".`,
        100,
        285,
        { align: 'center', width: doc.page.width - 200 }
      );

    // Issue Date & Verification UUID
    const issueDateStr = new Date(certificate.issue_date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    doc
      .fontSize(11)
      .font('Helvetica')
      .fillColor('#6b7280')
      .text(`Issued On: ${issueDateStr}`, 100, 350, { align: 'left' });

    doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor('#9ca3af')
      .text(`Verification ID: ${certificate.verification_uuid}`, 100, 370, {
        align: 'left',
      });

    // Generate Verification QR Code and embed on right
    try {
      const verifyUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/verify-certificate/${certificate.verification_uuid}`;
      const qrBuffer = await qrService.generateQRCodeBuffer(verifyUrl);
      doc.image(qrBuffer, doc.page.width - 200, 330, { width: 100 });
      doc
        .fontSize(8)
        .fillColor('#9ca3af')
        .text('Scan to verify authenticity', doc.page.width - 210, 435, {
          width: 120,
          align: 'center',
        });
    } catch (e) {
      console.error('QR embedding error in PDF:', e);
    }

    doc.end();
  },
};
