
export interface Store {
  id: string;
  name: string;
  city: string;
  address?: string;
  postalCode?: string;
  province?: string;
  country?: string;
  nif?: string;
  contact?: string;
  email?: string;
  phone?: string;
  instagram?: string;
  notes?: string;
  requiresRE?: boolean;
}

export interface OrderLine {
  id: string;
  type: string; // codeType
  model: string;
  color: string;
  name: string;
  qty: number;
  sku: string;
  pvdUnit: number;
  pvpUnit: number;
}

export interface Order {
  id: string;
  storeId: string;
  number: string;
  invoiceNumber?: string;
  date: string;
  status: string;
  lines: OrderLine[];
  shippingPolicy: string;
  shippingCost: number;
  freeFromPVD: number;
  notes?: string;
  shippingOverride?: boolean;
}

export interface Rules {
  moq: number;
  shippingCost: number;
  freeFromPVD: number;
  leadTimeGeneric: string;
  leadTimePersonalized: string;
  leadTimeTransport: string;
  nameMaxSuggested: number;
  nameNormalize: boolean;
  allowEmojis: boolean;
}

export interface BillingInfo {
  companyName: string;
  nif: string;
  address: string;
  postalCode: string;
  city: string;
  province: string;
  country: string;
  email: string;
  phone: string;
  vatRate: number;
  reRate: number; // Recargo Equivalencia
  invoicePrefix: string;
  nextInvoiceNumber: number;
}

export interface Status {
  name: string;
  order: number;
  badgeColor: string;
}

export interface Model {
  code: string;
  name: string;
}

export interface Color {
  code: string;
  name: string;
}

export interface LineType {
  codeType: string;
  label: string;
  skuPrefix: string;
  skuFixed: string;
  requiresModel: boolean;
  requiresColor: boolean;
  requiresName: boolean;
  defaultPVDUnit: number;
  defaultPVPUnit: number;
  equivalenceUnits: number;
}

export interface AppSettings {
  rules: Rules;
  billing: BillingInfo;
  statuses: Status[];
  models: Model[];
  colors: Color[];
  lineTypes: LineType[];
  version: string;
}

export interface AppData {
  settings: AppSettings;
  stores: Store[];
  orders: Order[];
}
