const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const QRCode = require("qrcode");

const generateInvoice = async (paymentData) => {
  const doc = new PDFDocument({ margin: 50, size: "A4" });
  const invoiceId = "INV-" + Date.now(); // Unique invoice ID
  const invoicesDir = path.join(__dirname, "../invoices");
  const filePath = path.join(invoicesDir, `${invoiceId}.pdf`);

  // Ensure invoices directory exists
  if (!fs.existsSync(invoicesDir)) fs.mkdirSync(invoicesDir);

  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  // Branding & styling variables
  const logoPath = path.join(__dirname, "../public/logo.png"); // Replace with your logo
  const slogan = "Your Slogan Here"; // Replace with your slogan
  const headerColor = "#1e3a8a";
  const tableHeaderColor = "#2563eb";
  const rowAltColor = "#f3f4f6";

  const pageWidth = 595;  // A4 width in points
  const pageHeight = 842; // A4 height in points
  const bottomMargin = 100;
  const rowHeight = 25;

  // ====== WATERMARK FUNCTION ======
  const drawWatermark = () => {
    doc.rotate(-45, { origin: [pageWidth/2, pageHeight/2] })
      .fontSize(60)
      .fillColor("#eeeeee")
      .opacity(0.1)
      .text("Shopnest", 100, pageHeight/2 - 100, { align: "center" })
      .opacity(1)
      .rotate(45, { origin: [pageWidth/2, pageHeight/2] });
  };

  drawWatermark(); // Draw watermark on the first page

  // ====== HEADER FUNCTION ======
  const drawHeader = () => {
    // Header background
    doc.rect(0, 0, pageWidth, 100).fill(headerColor);

    // Logo
    const logoWidth = 60;
    const logoHeight = 60;
    const logoX = 50;
    const logoY = 20;
    if (fs.existsSync(logoPath)) doc.image(logoPath, logoX, logoY, { width: logoWidth, height: logoHeight });

    // Shopnest Name & Slogan
    const textX = logoX + logoWidth + 10;
    const textY = logoY + 5;
    doc.fillColor("#fff").fontSize(26).text("Shopnest", textX, textY)
      .fontSize(12).text(slogan, textX, textY + 30);

    // Payment method & Invoice title (top-right)
    doc.fontSize(12).text(`Payment: ${paymentData.method || "N/A"}`, 400, 40, { align: "right" })
      .fontSize(20).text("INVOICE", 400, 60, { align: "right" });

    doc.moveDown(2).fillColor("#000");

    // Basic Invoice Info
    doc.fontSize(12).text(`Invoice ID: ${invoiceId}`);
    doc.text(`Date: ${new Date().toLocaleString()}`);
    doc.moveDown(1);

    // Customer Info Section
    doc.fontSize(14).fillColor(headerColor).text("Customer Information", 50)
      .fillColor("#333").fontSize(12).moveDown(0.5)
      .text(`Name: ${paymentData.customer_name}`)
      .text(`Email: ${paymentData.customer_email}`)
      .text(`Mobile: ${paymentData.mobile || "N/A"}`)
      .moveDown(1);
  };

  drawHeader(); // Draw initial header

  // ====== TABLE HEADER FUNCTION ======
  const drawTableHeader = (y) => {
    doc.fontSize(12).fillColor("#fff").rect(50, y, 500, rowHeight).fill(tableHeaderColor).stroke(tableHeaderColor);
    doc.fillColor("#fff").font("Helvetica-Bold")
      .text("Product", 60, y + 7)
      .text("Type", 160, y + 7)
      .text("Qty", 260, y + 7)
      .text("Unit Price", 310, y + 7)
      .text("Total", 410, y + 7);
    return y + rowHeight;
  };

  const maxTableY = pageHeight - bottomMargin; // Max table height per page
  let y = drawTableHeader(doc.y); // Starting Y position for table
  let subtotal = 0; // Accumulator for subtotal

  // ====== DRAW TABLE ROWS ======
  for (let i = 0; i < paymentData.items.length; i++) {
    const item = paymentData.items[i];
    const isAlt = i % 2 === 0; // Alternate row color
    const totalPrice = item.quantity * item.unit_price;
    subtotal += totalPrice;

    // Auto page break
    if (y + rowHeight > maxTableY) {
      doc.addPage();
      drawWatermark();
      drawHeader();
      y = drawTableHeader(50);
    }

    // Draw row background
    doc.rect(50, y, 500, rowHeight).fill(isAlt ? rowAltColor : "#fff").stroke("#ddd");

    // Draw row text
    doc.fillColor("#333").font("Helvetica")
      .text(item.product_title, 60, y + 7)
      .text(item.product_type || "-", 160, y + 7)
      .text(item.quantity, 260, y + 7)
      .text(`৳${item.unit_price}`, 310, y + 7)
      .text(`৳${totalPrice}`, 410, y + 7);

    y += rowHeight;
  }

  // ====== SUMMARY CALCULATION ======
  const taxRate = paymentData.tax || 0;
  const discount = paymentData.discount || 0;
  const taxAmount = subtotal * taxRate / 100;
  const totalAmount = subtotal + taxAmount - discount;

  // Check if summary fits or needs page break
  if (y + 100 > maxTableY) doc.addPage(), drawWatermark(), y = 50;

  doc.font("Helvetica-Bold").fillColor("#000");
  doc.text(`Subtotal: ৳${subtotal}`, 400, y + 10, { align: "right" });
  doc.text(`Tax (${taxRate}%): ৳${taxAmount}`, 400, y + 25, { align: "right" });
  doc.text(`Discount: ৳${discount}`, 400, y + 40, { align: "right" });
  doc.text(`Total: ৳${totalAmount}`, 400, y + 55, { align: "right" });

  // ====== QR CODE ======
  const qrData = `Shopnest Invoice: ${invoiceId}\nAmount: ৳${totalAmount}`;
  const qrImage = await QRCode.toDataURL(qrData);
  const qrBuffer = Buffer.from(qrImage.split(",")[1], "base64");
  doc.image(qrBuffer, 50, y + 10, { width: 100 });

  // ====== FOOTER ======
  doc.fontSize(10).fillColor("#888")
    .text("Thank you for shopping with Shopnest!", 0, pageHeight - 60, { align: "center" })
    .text("Powered by Shopnest", 0, pageHeight - 45, { align: "center" });

  doc.end();

  return { invoiceId, filePath };
};

module.exports = generateInvoice;
