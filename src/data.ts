import { StarSchemaTable } from "./types";

export const STAR_SCHEMA_TABLES: StarSchemaTable[] = [
  {
    name: "Fact_Sales",
    alias: "Transactional Sales Ledger",
    type: "fact",
    description: "The core transactional fact table. Records individual lines of sales events, linking numerical measurements with dimensional master data keys.",
    fields: [
      { name: "transaction_id", type: "VARCHAR(50)", keyType: "None", description: "Primary invoice header unique identifier" },
      { name: "customer_id", type: "VARCHAR(50)", keyType: "FK", description: "Links sales transaction to Dim_Customers master file" },
      { name: "product_id", type: "VARCHAR(50)", keyType: "FK", description: "Links item detail to Dim_Products inventory master" },
      { name: "date_key", type: "INTEGER", keyType: "FK", description: "Links purchase timestamp to Dim_Calendar temporal values" },
      { name: "quantity", type: "INTEGER", description: "Number of units purchased" },
      { name: "amount", type: "DECIMAL(12,2)", description: "Gross transactional sale price (USD)" }
    ]
  },
  {
    name: "Dim_Customers",
    alias: "Customer Demographics Profile",
    type: "dim",
    description: "Contains descriptive master details for individual consumers, allowing slicing of sales volume by geographics, channels, and tenure.",
    fields: [
      { name: "customer_id", type: "VARCHAR(50)", keyType: "PK", description: "Unique natural key for the consumer" },
      { name: "full_name", type: "VARCHAR(150)", description: "Customer first and last name" },
      { name: "email", type: "VARCHAR(100)", description: "Registered customer contact email" },
      { name: "region", type: "VARCHAR(50)", description: "Geographic market (e.g. North America, Europe, APAC)" },
      { name: "signup_channel", type: "VARCHAR(50)", description: "Marketing acquisition channel (e.g., Paid Ads, Organic, Referral)" },
      { name: "signup_date", type: "DATE", description: "Date of initial account activation" }
    ]
  },
  {
    name: "Dim_Products",
    alias: "Product Catalog Master",
    type: "dim",
    description: "Maintains full inventory categorization hierarchies, pricing points, and supplier specifications.",
    fields: [
      { name: "product_id", type: "VARCHAR(50)", keyType: "PK", description: "Unique merchandise SKU identification code" },
      { name: "product_name", type: "VARCHAR(200)", description: "Full customer-facing name of the item" },
      { name: "category", type: "VARCHAR(100)", description: "Top-level department classification (e.g. Electronics, Apparel)" },
      { name: "sub_category", type: "VARCHAR(100)", description: "Niche sub-classification category" },
      { name: "unit_price", type: "DECIMAL(10,2)", description: "Base retail manufacturer list price (USD)" }
    ]
  },
  {
    name: "Dim_Calendar",
    alias: "Enterprise Calendar Dim",
    type: "dim",
    description: "Standard corporate calendar dimension. Enables reliable, pre-calculated temporal rollups (quarters, seasons, business days) avoiding expensive date math.",
    fields: [
      { name: "date_key", type: "INTEGER", keyType: "PK", description: "Surrogate primary key in YYYYMMDD format" },
      { name: "full_date", type: "DATE", description: "Standard ISO-8601 calendar date format" },
      { name: "year", type: "INTEGER", description: "Four-digit calendar year" },
      { name: "quarter", type: "VARCHAR(10)", description: "Quarterly interval label (e.g. Q1, Q2)" },
      { name: "month_name", type: "VARCHAR(20)", description: "English name of the calendar month" },
      { name: "day_of_week", type: "VARCHAR(15)", description: "Day label (e.g. Monday, Sunday)" }
    ]
  },
  {
    name: "Dim_RFM_Segments",
    alias: "RFM Behavioral Scores",
    type: "dim",
    description: "Houses behavioral segmentation flags, calculations, and R/F/M tiered quartiles periodically calculated by data pipeline scripts.",
    fields: [
      { name: "customer_id", type: "VARCHAR(50)", keyType: "PK", description: "Links directly back to Dim_Customers (1-to-1 relationship)" },
      { name: "r_score", type: "INTEGER", description: "Recency score (1 = dormant, 4 = very recent)" },
      { name: "f_score", type: "INTEGER", description: "Frequency score (1 = occasional buy, 4 = highly recurring)" },
      { name: "m_score", type: "INTEGER", description: "Monetary score (1 = low spend, 4 = high spend tier)" },
      { name: "segment", type: "VARCHAR(50)", description: "Final cluster classification: Core High Value, Churned / At Risk, Standard Active" },
      { name: "last_updated", type: "TIMESTAMP", description: "Timestamp of last analytical script ingestion run" }
    ]
  }
];

export const PYTHON_CODE_TEMPLATE = `import pandas as pd
import numpy as np
from datetime import datetime

# Load your transactional database file
# Assume standard fields: customer_id, order_date, transaction_value
raw_data = pd.read_csv('ecommerce_transactions.csv')
raw_data['transaction_date'] = pd.to_datetime(raw_data['transaction_date'])

# Set baseline analysis point to evaluate historical recency metrics
snapshot_date = raw_data['transaction_date'].max() + pd.Timedelta(days=1)

# Group transactions at unique customer levels
rfm = raw_data.groupby('customer_id').agg({
    'transaction_date': lambda x: (snapshot_date - x.max()).days,
    'transaction_id': 'count',
    'amount': 'sum'
}).rename(columns={
    'transaction_date': 'Recency',
    'transaction_id': 'Frequency',
    'amount': 'Monetary'
})

# Construct performance metric quantiles
rfm['R_Score'] = pd.qcut(rfm['Recency'], 4, labels=[4, 3, 2, 1])
rfm['F_Score'] = pd.qcut(rfm['Frequency'].rank(method='first'), 4, labels=[1, 2, 3, 4])
rfm['M_Score'] = pd.qcut(rfm['Monetary'], 4, labels=[1, 2, 3, 4])

# Define customer tier maps
def segment_customer(df):
    if df['R_Score'] == 4 and df['F_Score'] == 4 and df['M_Score'] == 4:
        return 'Core High Value'
    elif df['R_Score'] == 1:
        return 'Churned / At Risk'
    else:
        return 'Standard Active'

rfm['Segment'] = rfm.apply(segment_customer, axis=1)
rfm.to_csv('rfm_segmented_output.csv')
print("RFM behavioral segments processed and exported.")`;

export const POSTGRESQL_CODE_TEMPLATE = `-- PostgreSQL Implementation of RFM Segmentation using Window Functions
WITH raw_metrics AS (
    SELECT 
        customer_id,
        -- Recency: Days elapsed since last order relative to global checkpoint (max + 1 day)
        ((SELECT MAX(transaction_date) + INTERVAL '1 day' FROM ecommerce_transactions) - MAX(transaction_date))::interval AS recency_interval,
        -- Frequency: count of invoices
        COUNT(transaction_id) AS frequency_count,
        -- Monetary: summation of spent value
        SUM(amount) AS total_amount
    FROM ecommerce_transactions
    GROUP BY customer_id
),
days_calc AS (
    SELECT 
        customer_id,
        EXTRACT(DAY FROM recency_interval)::INTEGER AS recency_days,
        frequency_count,
        total_amount
    FROM raw_metrics
),
quartiles AS (
    SELECT 
        customer_id,
        recency_days,
        frequency_count,
        total_amount,
        -- R_Score: Rank recency ascending (fewer days is better), split into 4 buckets, then invert
        -- so the best 25% (lowest days) gets score 4, worst gets 1.
        5 - NTILE(4) OVER (ORDER BY recency_days ASC) AS r_score,
        -- F_Score: Rank frequency ascending (higher is better)
        NTILE(4) OVER (ORDER BY frequency_count ASC) AS f_score,
        -- M_Score: Rank monetary ascending (higher is better)
        NTILE(4) OVER (ORDER BY total_amount ASC) AS m_score
    FROM days_calc
)
SELECT 
    customer_id,
    recency_days AS "Recency",
    frequency_count AS "Frequency",
    total_amount AS "Monetary",
    r_score AS "R_Score",
    f_score AS "F_Score",
    m_score AS "M_Score",
    CASE 
        WHEN r_score = 4 AND f_score = 4 AND m_score = 4 THEN 'Core High Value'
        WHEN r_score = 1 THEN 'Churned / At Risk'
        ELSE 'Standard Active'
    END AS "Segment"
FROM quartiles
ORDER BY total_amount DESC;`;

export const POWERBI_DAX_MEASURES = `-- Power BI Calculated Column and Measure definitions for clean Star Schema rollups

-- 1. Calculated Column in Dim_RFM_Segments for Dynamic Dynamic Segment Classification
RFM Segment Name = 
SWITCH(
    TRUE(),
    'Dim_RFM_Segments'[r_score] = 4 && 'Dim_RFM_Segments'[f_score] = 4 && 'Dim_RFM_Segments'[m_score] = 4, "Core High Value",
    'Dim_RFM_Segments'[r_score] = 1, "Churned / At Risk",
    "Standard Active"
)

-- 2. Total Gross Revenue Measure
Total Sales = SUM(Fact_Sales[amount])

-- 3. Core Customers Revenue Penetration %
Core Revenue Penetration % = 
DIVIDE(
    CALCULATE([Total Sales], 'Dim_RFM_Segments'[Segment] = "Core High Value"),
    [Total Sales],
    0
)

-- 4. Reactivation Candidate Count
At Risk Customer Count = 
CALCULATE(
    DISTINCTCOUNT(Fact_Sales[customer_id]), 
    'Dim_RFM_Segments'[Segment] = "Churned / At Risk"
)`;
