
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { saveAs } from 'file-saver';
import { Order, Store, AppSettings } from '../types';

export const pdfService = {
    generatePDF: async (order: Order, store: Store, settings: AppSettings, type: 'invoice' | 'delivery_note') => {
        try {
            console.log(`Generating ${type} PDF for order ${order.number}`);
            const doc = new jsPDF() as any;
            const { billing } = settings;

            if (!billing || !billing.companyName) {
                alert("Por favor, configura tus datos de facturación en Ajustes primero.");
                return;
            }

            const isInvoice = type === 'invoice';
            const docTitle = isInvoice ? 'FACTURA' : 'ALBARÁN';
            const docNumber = isInvoice ? (order.invoiceNumber || 'SIN NÚMERO') : order.number;

            // Colors
            const primaryColor: [number, number, number] = [124, 58, 237]; // #7C3AED

            // Add Logo placeholder / Branding
            doc.setFillColor(...primaryColor);
            doc.rect(0, 0, 210, 40, 'F');

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(24);
            doc.setFont('helvetica', 'bold');
            doc.text('BRIIK', 20, 25);

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text('Gestión de Pedidos B2B', 20, 32);

            doc.setFontSize(18);
            doc.text(docTitle, 190, 27, { align: 'right' });

            // Header Info (My Company)
            doc.setTextColor(50, 50, 50);
            doc.setFontSize(10);
            let y = 55;
            doc.setFont('helvetica', 'bold');
            doc.text('EMISOR:', 20, y);
            doc.setFont('helvetica', 'normal');
            doc.text([
                billing.companyName,
                `NIF: ${billing.nif}`,
                billing.address,
                `${billing.postalCode} ${billing.city}`,
                `${billing.province}, ${billing.country}`,
                `Email: ${billing.email}`,
                `Tel: ${billing.phone}`
            ], 20, y + 5);

            // Client Info
            doc.setFont('helvetica', 'bold');
            doc.text('CLIENTE:', 120, y);
            doc.setFont('helvetica', 'normal');
            doc.text([
                store.name,
                `NIF/CIF: ${store.nif || '---'}`,
                store.address || '---',
                `${store.postalCode || '---'} ${store.city || '---'}`,
                `${store.province || '---'}, ${store.country || '---'}`,
                `Email: ${store.email || '---'}`,
                `Tel: ${store.phone || '---'}`
            ], 120, y + 5);

            // Document Details
            y = 105;
            doc.setFillColor(245, 245, 245);
            doc.rect(20, y, 170, 15, 'F');
            doc.setTextColor(124, 58, 237);
            doc.setFont('helvetica', 'bold');
            doc.text(`Nº DOCUMENTO:`, 25, y + 9);
            doc.setTextColor(0, 0, 0);
            doc.text(docNumber, 65, y + 9);

            doc.setTextColor(124, 58, 237);
            doc.text(`FECHA:`, 120, y + 9);
            doc.setTextColor(0, 0, 0);
            doc.text(order.date, 140, y + 9);

            // Table
            const tableHeaders = [['Ref/SKU', 'Descripción', 'Cant.', 'Precio', 'Total']];
            const tableData = order.lines.map(l => [
                l.sku,
                `${l.model} ${l.color} ${l.name ? '(' + l.name + ')' : ''}`,
                l.qty,
                `${l.pvdUnit.toFixed(2)}€`,
                `${(l.qty * l.pvdUnit).toFixed(2)}€`
            ]);

            autoTable(doc, {
                startY: y + 25,
                head: tableHeaders,
                body: tableData,
                theme: 'grid',
                headStyles: { fillColor: primaryColor, textColor: 255 },
                styles: { fontSize: 9, cellPadding: 3 },
                columnStyles: {
                    0: { cellWidth: 40 },
                    2: { halign: 'center', cellWidth: 15 },
                    3: { halign: 'right', cellWidth: 25 },
                    4: { halign: 'right', cellWidth: 25 }
                }
            });

            // Totals
            const finalY = (doc as any).lastAutoTable.finalY + 10;
            const subtotalPVD = order.lines.reduce((acc, l) => acc + (l.qty * l.pvdUnit), 0);
            const shipping = order.shippingOverride || subtotalPVD >= order.freeFromPVD ? 0 : order.shippingCost;

            doc.setFontSize(10);
            let ty = finalY;

            const drawTotalLine = (label: string, value: string, isBold = false) => {
                doc.setFont('helvetica', isBold ? 'bold' : 'normal');
                doc.text(label, 140, ty, { align: 'right' });
                doc.text(value, 190, ty, { align: 'right' });
                ty += 6;
            };

            drawTotalLine('Subtotal:', `${subtotalPVD.toFixed(2)}€`);
            drawTotalLine('Envío:', `${shipping.toFixed(2)}€`);

            if (isInvoice) {
                const taxBase = subtotalPVD + shipping;
                const vatAmount = taxBase * (billing.vatRate / 100);
                drawTotalLine(`IVA (${billing.vatRate}%):`, `${vatAmount.toFixed(2)}€`);

                let total = taxBase + vatAmount;

                if (store.requiresRE) {
                    const reAmount = taxBase * (billing.reRate / 100);
                    drawTotalLine(`RE (${billing.reRate}%):`, `${reAmount.toFixed(2)}€`);
                    total += reAmount;
                }

                ty += 4;
                doc.setFontSize(14);
                drawTotalLine('TOTAL:', `${total.toFixed(2)}€`, true);
            } else {
                const total = subtotalPVD + shipping;
                ty += 4;
                doc.setFontSize(14);
                drawTotalLine('TOTAL PVD:', `${total.toFixed(2)}€`, true);
            }

            // Footer
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text('Gracias por su confianza. | BRIIK - Innovación en Regalo Infantil', 105, 285, { align: 'center' });

            // Use file-saver for reliable downloads
            const safeTitle = isInvoice ? 'Factura' : 'Albaran';
            const safeDocNumber = String(docNumber).replace(/[^a-z0-9]/gi, '_');
            const finalFileName = `${safeTitle}_${safeDocNumber}.pdf`;

            // Get PDF as arraybuffer and create blob with explicit type
            const pdfArrayBuffer = doc.output('arraybuffer');
            const pdfBlob = new Blob([pdfArrayBuffer], { type: 'application/pdf' });

            // Chrome-specific: Use object URL and programmatic download
            const blobUrl = window.URL.createObjectURL(pdfBlob);

            // Create invisible iframe to trigger download in Chrome
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            document.body.appendChild(iframe);

            // Create link inside iframe for Chrome compatibility
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = finalFileName;
            link.click();

            // Cleanup after short delay
            setTimeout(() => {
                document.body.removeChild(iframe);
                window.URL.revokeObjectURL(blobUrl);
            }, 250);

            console.log("PDF download initiated:", finalFileName);
        } catch (error) {
            console.error("Error generating PDF:", error);
            alert("Error al generar el PDF. Revisa la consola para más detalles.");
        }
    }
};
