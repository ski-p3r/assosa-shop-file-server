import PDFDocument from 'pdfkit';
import { PassThrough } from 'stream';
import { uploadToMinio } from './uploader';
import { Request, Response } from 'express';

interface InvoiceItem {
    product: string;
    quantity: number;
    price: number;
    total: number;
}

interface InvoiceData {
    invoiceNumber: string;
    shopName: string;
    shopAddress: string;
    shopEmail: string;
    shopPhone: string;
    billingDetails: {
        name: string;
        email: string;
        phone: string;
        address: string;
    };
    shippingDetails: {
        name: string;
        phone: string;
        address: string;
        country: string;
    };
    items: InvoiceItem[];
    subtotal: number;
    shipping: number;
    total: number;
    paymentMethod: string;
    transactionId: string;
    footerNote: string;
}

export async function generateInvoice(req: Request, res: Response) {
    const data: InvoiceData = req.body;

    if (!data.invoiceNumber || !data.shopName || !data.items || !data.total) {
        return res.status(400).json({ error: 'Missing required invoice data' });
    }

    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const stream = new PassThrough();
    const buffers: Buffer[] = [];

    // Collect PDF data into buffer
    doc.pipe(stream);
    stream.on('data', (chunk) => buffers.push(chunk));

    const textColor = '#111827';
    const grayColor = '#6B7280';
    const lightGray = '#F3F4F6';

    // === HEADER ===
    doc.font('Helvetica-Bold')
        .fontSize(24)
        .fillColor(textColor)
        .text('INVOICE', 40, 40);
    doc.fontSize(12)
        .fillColor(grayColor)
        .text(`#${data.invoiceNumber}`, 40, 70);

    doc.fontSize(14)
        .fillColor(textColor)
        .text(data.shopName, doc.page.width - 250, 40, {
            width: 200,
            align: 'right',
        });
    doc.fontSize(10).fillColor(grayColor);
    doc.text(data.shopAddress, doc.page.width - 250, 60, {
        width: 200,
        align: 'right',
    });
    doc.text(data.shopEmail, doc.page.width - 250, 75, {
        width: 200,
        align: 'right',
    });
    doc.text(data.shopPhone, doc.page.width - 250, 90, {
        width: 200,
        align: 'right',
    });

    // === BILLING & SHIPPING ===
    docස: doc.moveDown(3);
    doc.font('Helvetica-Bold')
        .fontSize(12)
        .fillColor(textColor)
        .text('Billing Details', 40, 130);
    doc.text('Shipping Details', 300, 130);

    doc.font('Helvetica').fontSize(10).fillColor(grayColor);
    const startY = 150;
    const leftX = 40;
    const rightX = 300;

    doc.text(data.billingDetails.name, leftX, startY);
    doc.text(data.billingDetails.email, leftX, startY + 15);
    doc.text(data.billingDetails.phone, leftX, startY + 30);
    doc.text(data.billingDetails.address, leftX, startY + 45);

    doc.text(data.shippingDetails.name, rightX, startY);
    doc.text(data.shippingDetails.phone, rightX, startY + 15);
    doc.text(data.shippingDetails.address, rightX, startY + 30);
    doc.text(data.shippingDetails.country, rightX, startY + 45);

    // === ORDER SUMMARY TABLE ===
    let tableTop = 230;
    const tableLeft = 40;
    const tableWidth = doc.page.width - 80;
    const colWidths = [220, 60, 80, 80];
    const headers = ['Product', 'Qty', 'Price', 'Total'];
    const rowHeight = 15;

    const drawTableHeader = () => {
        doc.rect(tableLeft, tableTop, tableWidth, 20).fill(lightGray);
        doc.fillColor(textColor).font('Helvetica-Bold').fontSize(10);
        headers.forEach((header, i) => {
            doc.text(
                header,
                tableLeft +
                    colWidths.slice(0, i).reduce((a, b) => a + b, 0) +
                    5,
                tableTop + 5,
                {
                    width: colWidths[i] - 10,
                    align: i === 0 ? 'left' : i === 1 ? 'center' : 'right',
                }
            );
        });
    };

    const drawRow = (item: InvoiceItem, y: number, index: number) => {
        if (index % 2 === 0) {
            doc.rect(tableLeft, y - 5, tableWidth, rowHeight).fill('#FAFAFA');
        }
        doc.fillColor(textColor).font('Helvetica').fontSize(10);
        const cells = [
            item.product,
            item.quantity.toString(),
            `$${item.price.toFixed(2)}`,
            `$${item.total.toFixed(2)}`,
        ];
        cells.forEach((cell, i) => {
            doc.text(
                cell,
                tableLeft +
                    colWidths.slice(0, i).reduce((a, b) => a + b, 0) +
                    5,
                y,
                {
                    width: colWidths[i] - 10,
                    align: i === 0 ? 'left' : i === 1 ? 'center' : 'right',
                }
            );
        });
    };

    drawTableHeader();
    let rowY = tableTop + 25;

    data.items.forEach((item, index) => {
        if (rowY + rowHeight > doc.page.height - 100) {
            doc.addPage();
            tableTop = 40;
            drawTableHeader();
            rowY = tableTop + 25;
        }
        drawRow(item, rowY, index);
        rowY += rowHeight;
    });

    // === TOTALS ===
    const totalsX = doc.page.width - 220;
    const totalsY = rowY + 10;
    doc.rect(totalsX, totalsY, 180, 70).fill(lightGray);
    doc.fillColor(textColor).fontSize(10).font('Helvetica');
    doc.text('Subtotal:', totalsX + 10, totalsY + 10);
    doc.text(`$${data.subtotal.toFixed(2)}`, totalsX + 100, totalsY + 10, {
        align: 'right',
    });
    doc.text('Shipping:', totalsX + 10, totalsY + 25);
    doc.text(`$${data.shipping.toFixed(2)}`, totalsX + 100, totalsY + 25, {
        align: 'right',
    });
    doc.font('Helvetica-Bold').fontSize(12).fillColor(textColor);
    doc.text('Total:', totalsX + 10, totalsY + 45);
    doc.text(`$${data.total.toFixed(2)}`, totalsX + 100, totalsY + 45, {
        align: 'right',
    });

    // === PAYMENT INFO ===
    let paymentY = totalsY + 80;
    if (paymentY + 40 > doc.page.height - 100) {
        doc.addPage();
        paymentY = 40;
    }
    doc.rect(40, paymentY, doc.page.width - 80, 40).fill(lightGray);
    doc.fillColor(textColor).fontSize(10).font('Helvetica');
    doc.text(`Payment Method: ${data.paymentMethod}`, 50, paymentY + 10);
    doc.text(`Transaction ID: ${data.transactionId}`, 50, paymentY + 25);

    // === FOOTER ===
    let footerY = paymentY + 50;
    if (footerY + 20 > doc.page.height - 100) {
        doc.addPage();
        footerY = 40;
    }
    doc.fillColor(grayColor)
        .fontSize(9)
        .text(data.footerNote, 40, footerY, {
            align: 'center',
            width: doc.page.width - 80,
        });

    doc.end();

    // Wait for stream to finish and upload to MinIO
    const uploadResult = await new Promise((resolve, reject) => {
        stream.on('end', async () => {
            try {
                const pdfBuffer = Buffer.concat(buffers);
                const file: Express.Multer.File = {
                    fieldname: `${data.invoiceNumber}`,
                    originalname: `invoice-${data.invoiceNumber}.pdf`,
                    encoding: '7bit',
                    mimetype: 'application/pdf',
                    size: pdfBuffer.length,
                    destination: '',
                    filename: `invoice-${data.invoiceNumber}.pdf`,
                    path: '',
                    buffer: pdfBuffer,
                    stream: stream, // Add a dummy stream property if required by your Multer version
                };
                const result = await uploadToMinio(
                    file,
                    process.env.UPLOAD_TOKEN!,
                    req
                );
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
        stream.on('error', (error) => reject(error));
    });

    return res.status(200).json(uploadResult);
}
