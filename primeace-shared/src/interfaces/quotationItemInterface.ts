import type { ID, MoneyKobo } from "../types/commonType.js";

export interface IQuotationItem {
  id: ID;
  serviceRequestItemId: ID | null;

  serviceName: string;
  description: string;
  deliverables: string[];

  quantity: number;
  unitAmountKobo: MoneyKobo;
  totalAmountKobo: MoneyKobo;
}
