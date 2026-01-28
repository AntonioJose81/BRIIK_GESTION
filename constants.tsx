
import { AppSettings } from './types';

export const DEFAULT_SETTINGS: AppSettings = {
  version: "1.1",
  rules: {
    moq: 6,
    shippingCost: 7.50,
    freeFromPVD: 50.00,
    leadTimeGeneric: "24-48 h",
    leadTimePersonalized: "48-72 h",
    leadTimeTransport: "24-48 h",
    nameMaxSuggested: 12,
    nameNormalize: true,
    allowEmojis: false
  },
  billing: {
    companyName: "BRIIK SL",
    nif: "B12345678",
    address: "Calle Ejemplo 123",
    postalCode: "28001",
    city: "Madrid",
    province: "Madrid",
    country: "España",
    email: "finanzas@briik.es",
    phone: "+34 912 345 678",
    vatRate: 21,
    reRate: 5.2,
    invoicePrefix: "INV-2026-",
    nextInvoiceNumber: 1
  },
  statuses: [
    { name: "Borrador", order: 1, badgeColor: "#9ca3af" },
    { name: "Confirmado", order: 2, badgeColor: "#3b82f6" },
    { name: "En Producción", order: 3, badgeColor: "#f59e0b" },
    { name: "Enviado", order: 4, badgeColor: "#10b981" },
    { name: "Entregado", order: 5, badgeColor: "#059669" }
  ],
  models: [
    { code: "B01", name: "DinoPop" },
    { code: "B02", name: "RocketPop" },
    { code: "B03", name: "UniPop" },
    { code: "B04", name: "MonsterPop" },
    { code: "B05", name: "WandPop" },
    { code: "B06", name: "CastlePop" },
    { code: "B07", name: "RainbowPop" },
    { code: "B08", name: "LionPop" }
  ],
  colors: [
    { code: "MINT", name: "Mint" },
    { code: "QUARTZ", name: "Quartz" },
    { code: "NEOGREEN", name: "Neo Green" },
    { code: "NEOPINK", name: "Neo Pink" },
    { code: "BLUEGLITTER", name: "Blue Glitter" },
    { code: "SILVERGLITTER", name: "Silver Glitter" }
  ],
  lineTypes: [
    {
      codeType: "GEN",
      label: "Genérico",
      skuPrefix: "BRIIK-GEN",
      skuFixed: "",
      requiresModel: true,
      requiresColor: true,
      requiresName: false,
      defaultPVDUnit: 6.40,
      defaultPVPUnit: 13.90,
      equivalenceUnits: 1
    },
    {
      codeType: "PER",
      label: "Personalizado",
      skuPrefix: "BRIIK-PER",
      skuFixed: "",
      requiresModel: true,
      requiresColor: true,
      requiresName: true,
      defaultPVDUnit: 7.90,
      defaultPVPUnit: 16.90,
      equivalenceUnits: 1
    },
    {
      codeType: "PACK3_GEN",
      label: "Pack 3 Genéricos",
      skuPrefix: "",
      skuFixed: "BRIIK-PACK3-GEN",
      requiresModel: false,
      requiresColor: false,
      requiresName: false,
      defaultPVDUnit: 19.20,
      defaultPVPUnit: 39.90,
      equivalenceUnits: 3
    },
    {
      codeType: "PACK3_PER",
      label: "Pack 3 Personalizados",
      skuPrefix: "",
      skuFixed: "BRIIK-PACK3-PER",
      requiresModel: false,
      requiresColor: false,
      requiresName: false,
      defaultPVDUnit: 23.70,
      defaultPVPUnit: 48.90,
      equivalenceUnits: 3
    }
  ]
};
