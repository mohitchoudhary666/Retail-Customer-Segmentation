export interface Transaction {
  transaction_id: string;
  customer_id: string;
  transaction_date: string;
  amount: number;
}

export interface RfmResult {
  customer_id: string;
  Recency: number;
  Frequency: number;
  Monetary: number;
  R_Score: number;
  F_Score: number;
  M_Score: number;
  Segment: string;
}

export interface SchemaField {
  name: string;
  type: string;
  keyType?: "PK" | "FK" | "None";
  description: string;
}

export interface StarSchemaTable {
  name: string;
  alias: string;
  type: "fact" | "dim";
  description: string;
  fields: SchemaField[];
}
