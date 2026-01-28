
import { AppData, AppSettings, Store, Order, OrderLine, LineType, Rules, Status, Model, Color } from '../types';
import { generateId } from '../utils';

export const xmlService = {
  exportToXML: (data: AppData): string => {
    const { settings, stores, orders } = data;

    const xmlLines = [
      `<?xml version="1.0" encoding="UTF-8"?>`,
      `<BRIIKData version="${settings.version || '1.1'}">`,
      `  <Settings>`,
      `    <Rules>`,
      `      <MOQ>${settings.rules.moq}</MOQ>`,
      `      <ShippingCost>${settings.rules.shippingCost.toFixed(2)}</ShippingCost>`,
      `      <FreeFromPVD>${settings.rules.freeFromPVD.toFixed(2)}</FreeFromPVD>`,
      `      <LeadTimeGeneric>${settings.rules.leadTimeGeneric}</LeadTimeGeneric>`,
      `      <LeadTimePersonalized>${settings.rules.leadTimePersonalized}</LeadTimePersonalized>`,
      `      <LeadTimeTransport>${settings.rules.leadTimeTransport}</LeadTimeTransport>`,
      `      <NameMaxSuggested>${settings.rules.nameMaxSuggested}</NameMaxSuggested>`,
      `      <NameNormalize>${settings.rules.nameNormalize}</NameNormalize>`,
      `      <AllowEmojis>${settings.rules.allowEmojis}</AllowEmojis>`,
      `    </Rules>`,
      `    <Billing>`,
      `      <CompanyName>${settings.billing.companyName}</CompanyName>`,
      `      <NIF>${settings.billing.nif}</NIF>`,
      `      <Address>${settings.billing.address}</Address>`,
      `      <PostalCode>${settings.billing.postalCode}</PostalCode>`,
      `      <City>${settings.billing.city}</City>`,
      `      <Province>${settings.billing.province}</Province>`,
      `      <Country>${settings.billing.country}</Country>`,
      `      <Email>${settings.billing.email}</Email>`,
      `      <Phone>${settings.billing.phone}</Phone>`,
      `      <VATRate>${settings.billing.vatRate}</VATRate>`,
      `      <RERate>${settings.billing.reRate}</RERate>`,
      `      <InvoicePrefix>${settings.billing.invoicePrefix}</InvoicePrefix>`,
      `      <NextInvoiceNumber>${settings.billing.nextInvoiceNumber}</NextInvoiceNumber>`,
      `    </Billing>`,
      `    <Statuses>`,
      ...settings.statuses.map(s => `      <Status><Name>${s.name}</Name><Order>${s.order}</Order><BadgeColor>${s.badgeColor}</BadgeColor></Status>`),
      `    </Statuses>`,
      `    <Models>`,
      ...settings.models.map(m => `      <Model><Code>${m.code}</Code><Name>${m.name}</Name></Model>`),
      `    </Models>`,
      `    <Colors>`,
      ...settings.colors.map(c => `      <Color><Code>${c.code}</Code><Name>${c.name}</Name></Color>`),
      `    </Colors>`,
      `    <LineTypes>`,
      ...settings.lineTypes.map(lt => `
      <LineType>
        <CodeType>${lt.codeType}</CodeType>
        <Label>${lt.label}</Label>
        <SKUPrefix>${lt.skuPrefix}</SKUPrefix>
        <SKUFixed>${lt.skuFixed}</SKUFixed>
        <RequiresModel>${lt.requiresModel}</RequiresModel>
        <RequiresColor>${lt.requiresColor}</RequiresColor>
        <RequiresName>${lt.requiresName}</RequiresName>
        <DefaultPVDUnit>${lt.defaultPVDUnit.toFixed(2)}</DefaultPVDUnit>
        <DefaultPVPUnit>${lt.defaultPVPUnit.toFixed(2)}</DefaultPVPUnit>
        <EquivalenceUnits>${lt.equivalenceUnits}</EquivalenceUnits>
      </LineType>`),
      `    </LineTypes>`,
      `  </Settings>`,
      `  <Stores>`,
      ...stores.map(s => `
    <Store id="${s.id}">
      <Name>${s.name || ''}</Name>
      <City>${s.city || ''}</City>
      <Address>${s.address || ''}</Address>
      <PostalCode>${s.postalCode || ''}</PostalCode>
      <Province>${s.province || ''}</Province>
      <Country>${s.country || ''}</Country>
      <NIF>${s.nif || ''}</NIF>
      <Contact>${s.contact || ''}</Contact>
      <Email>${s.email || ''}</Email>
      <Phone>${s.phone || ''}</Phone>
      <Instagram>${s.instagram || ''}</Instagram>
      <Notes>${s.notes || ''}</Notes>
    </Store>`),
      `  </Stores>`,
      `  <Orders>`,
      ...orders.map(o => `
    <Order id="${o.id}" storeId="${o.storeId}" number="${o.number}">
      <InvoiceNumber>${o.invoiceNumber || ''}</InvoiceNumber>
      <Date>${o.date}</Date>
      <Status>${o.status}</Status>
      <Shipping>
        <Policy>${o.shippingPolicy}</Policy>
        <Cost>${o.shippingCost.toFixed(2)}</Cost>
        <FreeFromPVD>${o.freeFromPVD.toFixed(2)}</FreeFromPVD>
      </Shipping>
      <Notes>${o.notes || ''}</Notes>
      <ShippingOverride>${o.shippingOverride || false}</ShippingOverride>
      <Lines>
        ${o.lines.map(l => `
        <Line id="${l.id}">
          <Type>${l.type}</Type>
          <Model>${l.model}</Model>
          <Color>${l.color}</Color>
          <Name>${l.name}</Name>
          <Qty>${l.qty}</Qty>
          <SKU>${l.sku}</SKU>
          <PVDUnit>${l.pvdUnit.toFixed(2)}</PVDUnit>
          <PVPUnit>${l.pvpUnit.toFixed(2)}</PVPUnit>
        </Line>`).join('')}
      </Lines>
    </Order>`),
      `  </Orders>`,
      `</BRIIKData>`
    ].join('\n');

    return xmlLines;
  },

  importFromXML: async (file: File): Promise<AppData | null> => {
    try {
      const text = await file.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(text, "text/xml");

      const root = xmlDoc.getElementsByTagName("BRIIKData")[0];
      if (!root) throw new Error("Formato XML inv\u00e1lido: No se encontr\u00f3 BRIIKData");

      const getVal = (el: Element, tag: string) => el.getElementsByTagName(tag)[0]?.textContent || "";

      // Parse Settings if exists
      let settings: AppSettings | null = null;
      const settingsEl = xmlDoc.getElementsByTagName("Settings")[0];
      if (settingsEl) {
        const rulesEl = settingsEl.getElementsByTagName("Rules")[0];
        const billingEl = settingsEl.getElementsByTagName("Billing")[0];

        const rules: Rules = {
          moq: parseInt(getVal(rulesEl, "MOQ") || "6"),
          shippingCost: parseFloat(getVal(rulesEl, "ShippingCost") || "0"),
          freeFromPVD: parseFloat(getVal(rulesEl, "FreeFromPVD") || "0"),
          leadTimeGeneric: getVal(rulesEl, "LeadTimeGeneric"),
          leadTimePersonalized: getVal(rulesEl, "LeadTimePersonalized"),
          leadTimeTransport: getVal(rulesEl, "LeadTimeTransport"),
          nameMaxSuggested: parseInt(getVal(rulesEl, "NameMaxSuggested") || "12"),
          nameNormalize: getVal(rulesEl, "NameNormalize") === "true",
          allowEmojis: getVal(rulesEl, "AllowEmojis") === "true"
        };

        const billing: any = billingEl ? {
          companyName: getVal(billingEl, "CompanyName"),
          nif: getVal(billingEl, "NIF"),
          address: getVal(billingEl, "Address"),
          postalCode: getVal(billingEl, "PostalCode"),
          city: getVal(billingEl, "City"),
          province: getVal(billingEl, "Province"),
          country: getVal(billingEl, "Country"),
          email: getVal(billingEl, "Email"),
          phone: getVal(billingEl, "Phone"),
          vatRate: parseFloat(getVal(billingEl, "VATRate") || "21"),
          reRate: parseFloat(getVal(billingEl, "RERate") || "5.2"),
          invoicePrefix: getVal(billingEl, "InvoicePrefix"),
          nextInvoiceNumber: parseInt(getVal(billingEl, "NextInvoiceNumber") || "1")
        } : {
          companyName: "BRIIK SL", nif: "", address: "", postalCode: "", city: "", province: "", country: "", email: "", phone: "", vatRate: 21, reRate: 5.2, invoicePrefix: "INV-", nextInvoiceNumber: 1
        };

        const statuses: Status[] = Array.from(settingsEl.getElementsByTagName("Status")).map(s => ({
          name: getVal(s, "Name"),
          order: parseInt(getVal(s, "Order") || "0"),
          badgeColor: getVal(s, "BadgeColor")
        }));

        const models: Model[] = Array.from(settingsEl.getElementsByTagName("Model")).map(m => ({
          code: getVal(m, "Code"),
          name: getVal(m, "Name")
        }));

        const colors: Color[] = Array.from(settingsEl.getElementsByTagName("Color")).map(c => ({
          code: getVal(c, "Code"),
          name: getVal(c, "Name")
        }));

        const lineTypes: LineType[] = Array.from(settingsEl.getElementsByTagName("LineType")).map(lt => ({
          codeType: getVal(lt, "CodeType"),
          label: getVal(lt, "Label"),
          skuPrefix: getVal(lt, "SKUPrefix"),
          skuFixed: getVal(lt, "SKUFixed"),
          requiresModel: getVal(lt, "RequiresModel") === "true",
          requiresColor: getVal(lt, "RequiresColor") === "true",
          requiresName: getVal(lt, "RequiresName") === "true",
          defaultPVDUnit: parseFloat(getVal(lt, "DefaultPVDUnit") || "0"),
          defaultPVPUnit: parseFloat(getVal(lt, "DefaultPVPUnit") || "0"),
          equivalenceUnits: parseInt(getVal(lt, "EquivalenceUnits") || "1")
        }));

        settings = { version: root.getAttribute("version") || "1.1", rules, billing, statuses, models, colors, lineTypes };
      }

      // Parse Stores
      const stores: Store[] = Array.from(xmlDoc.getElementsByTagName("Store")).map(s => ({
        id: s.getAttribute("id") || generateId(),
        name: getVal(s, "Name"),
        city: getVal(s, "City"),
        address: getVal(s, "Address"),
        postalCode: getVal(s, "PostalCode"),
        province: getVal(s, "Province"),
        country: getVal(s, "Country"),
        nif: getVal(s, "NIF"),
        contact: getVal(s, "Contact"),
        email: getVal(s, "Email"),
        phone: getVal(s, "Phone"),
        instagram: getVal(s, "Instagram"),
        notes: getVal(s, "Notes")
      }));

      // Parse Orders
      const orders: Order[] = Array.from(xmlDoc.getElementsByTagName("Order")).map(o => {
        const shippingEl = o.getElementsByTagName("Shipping")[0];
        const linesEl = o.getElementsByTagName("Line");
        const lines: OrderLine[] = Array.from(linesEl).map(l => ({
          id: l.getAttribute("id") || generateId(),
          type: getVal(l, "Type"),
          model: getVal(l, "Model"),
          color: getVal(l, "Color"),
          name: getVal(l, "Name"),
          qty: parseInt(getVal(l, "Qty") || "0"),
          sku: getVal(l, "SKU"),
          pvdUnit: parseFloat(getVal(l, "PVDUnit") || "0"),
          pvpUnit: parseFloat(getVal(l, "PVPUnit") || "0")
        }));

        return {
          id: o.getAttribute("id") || generateId(),
          storeId: o.getAttribute("storeId") || "",
          number: o.getAttribute("number") || "",
          invoiceNumber: getVal(o, "InvoiceNumber"),
          date: getVal(o, "Date"),
          status: getVal(o, "Status"),
          lines,
          shippingPolicy: getVal(shippingEl, "Policy"),
          shippingCost: parseFloat(getVal(shippingEl, "Cost") || "0"),
          freeFromPVD: parseFloat(getVal(shippingEl, "FreeFromPVD") || "0"),
          notes: getVal(o, "Notes"),
          shippingOverride: getVal(o, "ShippingOverride") === "true"
        };
      });

      return {
        settings: settings || (null as any), // If null, App will use defaults
        stores,
        orders
      };
    } catch (err) {
      console.error("Error importing XML:", err);
      return null;
    }
  }
};
