# Retail Customer Segmentation Engine (RFM Model)

An interactive behavior modeling application that implements the Recency, Frequency, and Monetary Value (RFM) analytics framework. This project performs data validation, executes quantile scoring, and structures data into a performance-optimized relational model.

## 🏗️ Architecture Flow
[Raw Retail Data] ──> [Data Validation Script] ──> [RFM Statistical Scoring] ──> [Interactive Insights Dashboard]

## 🚀 Key Features
- **Quantile Tier Profiling**: Utilizes data transformation techniques to categorize customer behavior into distinct statistical quartiles.
- **Strategic Mapping**: Identifies unique customer segments, distinguishing 'Core High Value' assets from 'At Risk' users requiring targeted retention campaigns.
- **Star Schema Performance**: Groups processed files into logical dimension and fact table relations to maximize reporting compute efficiency.

## 🛠️ Technology Stack
- **Analytics & Logic**: Python (Pandas, NumPy, Datetime operations), TypeScript
- **Database Layer**: PostgreSQL / Relational Structures
- **Visualization Layer**: Interactive Analytics UI via AI Studio & Vercel

## 📊 Analytical Insights Documented
- **Revenue Concentration**: Documented that the 'Core High Value' customer cluster accounts for a disproportionate volume (~48%) of total top-line store revenue.
- **Lifecycle Alignment**: Cross-referenced recency degradation scores against transactional categories to highlight shifting seasonal demand patterns.
