import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Mock transactional dataset representing ecommerce_transactions.csv
// Hand-crafted to have a beautiful distribution of Core, Churned, and Active users.
const DEFAULT_TRANSACTIONS = [
  // CUST-101: High Value Super User (Core High Value)
  { transaction_id: "TXN-2001", customer_id: "CUST-101", transaction_date: "2026-07-18", amount: 250.0 },
  { transaction_id: "TXN-2002", customer_id: "CUST-101", transaction_date: "2026-07-10", amount: 180.0 },
  { transaction_id: "TXN-2003", customer_id: "CUST-101", transaction_date: "2026-06-25", amount: 310.0 },
  { transaction_id: "TXN-2004", customer_id: "CUST-101", transaction_date: "2026-06-05", amount: 150.0 },
  { transaction_id: "TXN-2005", customer_id: "CUST-101", transaction_date: "2026-05-12", amount: 420.0 },
  
  // CUST-102: High Value Super User (Core High Value)
  { transaction_id: "TXN-2006", customer_id: "CUST-102", transaction_date: "2026-07-17", amount: 350.0 },
  { transaction_id: "TXN-2007", customer_id: "CUST-102", transaction_date: "2026-07-02", amount: 290.0 },
  { transaction_id: "TXN-2008", customer_id: "CUST-102", transaction_date: "2026-06-15", amount: 180.0 },
  { transaction_id: "TXN-2009", customer_id: "CUST-102", transaction_date: "2026-05-20", amount: 500.0 },

  // CUST-103: Churned / At Risk (Old Recency, High Monetary/Frequency historically, but R=1)
  { transaction_id: "TXN-2010", customer_id: "CUST-103", transaction_date: "2026-01-10", amount: 120.0 },
  { transaction_id: "TXN-2011", customer_id: "CUST-103", transaction_date: "2026-01-22", amount: 95.0 },
  { transaction_id: "TXN-2012", customer_id: "CUST-103", transaction_date: "2026-02-05", amount: 110.0 },

  // CUST-104: Churned / At Risk (Old Recency, Single low purchase)
  { transaction_id: "TXN-2013", customer_id: "CUST-104", transaction_date: "2026-01-05", amount: 45.0 },

  // CUST-105: Standard Active (Recent, Moderate Frequency, Moderate Monetary)
  { transaction_id: "TXN-2014", customer_id: "CUST-105", transaction_date: "2026-07-12", amount: 85.0 },
  { transaction_id: "TXN-2015", customer_id: "CUST-105", transaction_date: "2026-06-18", amount: 70.0 },

  // CUST-106: Standard Active
  { transaction_id: "TXN-2016", customer_id: "CUST-106", transaction_date: "2026-07-05", amount: 110.0 },
  { transaction_id: "TXN-2017", customer_id: "CUST-106", transaction_date: "2026-05-10", amount: 90.0 },

  // CUST-107: Standard Active
  { transaction_id: "TXN-2018", customer_id: "CUST-107", transaction_date: "2026-07-14", amount: 65.0 },
  { transaction_id: "TXN-2019", customer_id: "CUST-107", transaction_date: "2026-07-01", amount: 120.0 },

  // CUST-108: Churned / At Risk (Old purchase)
  { transaction_id: "TXN-2020", customer_id: "CUST-108", transaction_date: "2026-02-14", amount: 150.0 },

  // CUST-109: Core High Value (Recent, high frequency, high monetary)
  { transaction_id: "TXN-2021", customer_id: "CUST-109", transaction_date: "2026-07-19", amount: 200.0 },
  { transaction_id: "TXN-2022", customer_id: "CUST-109", transaction_date: "2026-07-08", amount: 320.0 },
  { transaction_id: "TXN-2023", customer_id: "CUST-109", transaction_date: "2026-06-20", amount: 150.0 },
  { transaction_id: "TXN-2024", customer_id: "CUST-109", transaction_date: "2026-06-01", amount: 410.0 },

  // CUST-110: Standard Active
  { transaction_id: "TXN-2025", customer_id: "CUST-110", transaction_date: "2026-06-30", amount: 75.0 },

  // CUST-111: Standard Active (Recent, Single moderate purchase)
  { transaction_id: "TXN-2026", customer_id: "CUST-111", transaction_date: "2026-07-16", amount: 130.0 },

  // CUST-112: Churned / At Risk
  { transaction_id: "TXN-2027", customer_id: "CUST-112", transaction_date: "2026-03-01", amount: 60.0 },

  // CUST-113: Standard Active
  { transaction_id: "TXN-2028", customer_id: "CUST-113", transaction_date: "2026-07-15", amount: 95.0 },
  { transaction_id: "TXN-2029", customer_id: "CUST-113", transaction_date: "2026-06-10", amount: 105.0 },

  // CUST-114: Standard Active
  { transaction_id: "TXN-2030", customer_id: "CUST-114", transaction_date: "2026-05-25", amount: 80.0 },

  // CUST-115: Churned / At Risk
  { transaction_id: "TXN-2031", customer_id: "CUST-115", transaction_date: "2026-01-15", amount: 210.0 },

  // CUST-116: Core High Value (Recent, high frequency, high monetary)
  { transaction_id: "TXN-2032", customer_id: "CUST-116", transaction_date: "2026-07-15", amount: 150.0 },
  { transaction_id: "TXN-2033", customer_id: "CUST-116", transaction_date: "2026-07-02", amount: 280.0 },
  { transaction_id: "TXN-2034", customer_id: "CUST-116", transaction_date: "2026-06-12", amount: 350.0 },
  { transaction_id: "TXN-2035", customer_id: "CUST-116", transaction_date: "2026-05-18", amount: 200.0 },

  // CUST-117: Standard Active
  { transaction_id: "TXN-2036", customer_id: "CUST-117", transaction_date: "2026-07-10", amount: 50.0 },

  // CUST-118: Standard Active
  { transaction_id: "TXN-2037", customer_id: "CUST-118", transaction_date: "2026-06-15", amount: 110.0 },

  // CUST-119: Churned / At Risk
  { transaction_id: "TXN-2038", customer_id: "CUST-119", transaction_date: "2026-02-28", amount: 90.0 },

  // CUST-120: Standard Active
  { transaction_id: "TXN-2039", customer_id: "CUST-120", transaction_date: "2026-07-14", amount: 120.0 }
];

// Helper to compute first-rank quartiles matching pandas qcut rank first method
function getRankedQuartiles(items: { id: string; val: number }[], reverse: boolean = false): { [id: string]: number } {
  const sorted = [...items].map((item, index) => ({ ...item, originalIndex: index }));
  
  // Sort primarily by value ascending. Keep original index to stabilize rank (method='first')
  sorted.sort((a, b) => {
    if (a.val !== b.val) return a.val - b.val;
    return a.originalIndex - b.originalIndex;
  });
  
  const n = sorted.length;
  const result: { [id: string]: number } = {};
  
  sorted.forEach((item, rank) => {
    // Determine which quarter the rank falls into (0-indexed rank)
    // 0 to 25% gets score 1, 25% to 50% gets 2, 50% to 75% gets 3, 75% to 100% gets 4
    let score = 1;
    if (rank < Math.floor(n * 0.25)) {
      score = 1;
    } else if (rank < Math.floor(n * 0.50)) {
      score = 2;
    } else if (rank < Math.floor(n * 0.75)) {
      score = 3;
    } else {
      score = 4;
    }
    
    if (reverse) {
      score = 5 - score; // Invert: lowest values get score 4, highest get score 1
    }
    
    result[item.id] = score;
  });
  
  return result;
}

// 1. GET standard e-commerce transaction dataset
app.get("/api/transactions", (req, res) => {
  res.json(DEFAULT_TRANSACTIONS);
});

// 2. POST to process RFM segmentation
app.post("/api/segmentation/process", (req, res) => {
  try {
    const transactions = req.body.transactions || DEFAULT_TRANSACTIONS;
    
    if (!Array.isArray(transactions) || transactions.length === 0) {
      return res.status(400).json({ error: "Invalid transaction data. Must be a non-empty array." });
    }

    // Standardize dates
    const parsedTransactions = transactions.map(t => ({
      transaction_id: String(t.transaction_id || t.id || ""),
      customer_id: String(t.customer_id || ""),
      transaction_date: new Date(t.transaction_date || t.date || Date.now()),
      amount: parseFloat(String(t.amount || t.value || 0))
    })).filter(t => t.customer_id && !isNaN(t.transaction_date.getTime()));

    if (parsedTransactions.length === 0) {
      return res.status(400).json({ error: "No valid transaction logs found after parsing." });
    }

    // Establish analysis snapshot_date
    const maxDateMs = Math.max(...parsedTransactions.map(t => t.transaction_date.getTime()));
    const snapshotDate = new Date(maxDateMs);
    snapshotDate.setDate(snapshotDate.getDate() + 1); // snapshot_date = max_date + 1 day

    // Group transactions at unique customer levels
    const customerGroups: { [id: string]: { dates: Date[]; transaction_ids: string[]; amounts: number[] } } = {};
    parsedTransactions.forEach(t => {
      if (!customerGroups[t.customer_id]) {
        customerGroups[t.customer_id] = { dates: [], transaction_ids: [], amounts: [] };
      }
      customerGroups[t.customer_id].dates.push(t.transaction_date);
      customerGroups[t.customer_id].transaction_ids.push(t.transaction_id);
      customerGroups[t.customer_id].amounts.push(t.amount);
    });

    // Calculate baseline Recency, Frequency, Monetary values
    const rfmBaseList: { id: string; recency: number; frequency: number; monetary: number }[] = [];
    Object.keys(customerGroups).forEach(id => {
      const group = customerGroups[id];
      const customerMaxDate = new Date(Math.max(...group.dates.map(d => d.getTime())));
      
      // Difference in full days
      const diffTime = Math.abs(snapshotDate.getTime() - customerMaxDate.getTime());
      const recencyDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const frequency = group.transaction_ids.length;
      const monetary = group.amounts.reduce((sum, val) => sum + val, 0);

      rfmBaseList.push({
        id,
        recency: recencyDays,
        frequency,
        monetary
      });
    });

    // To prevent empty quantiles, handle cases with very low distinct customers
    if (rfmBaseList.length < 4) {
      // Fallback: simple divisions
      const processed = rfmBaseList.map(item => {
        const R_Score = item.recency <= 15 ? 4 : item.recency <= 45 ? 3 : item.recency <= 90 ? 2 : 1;
        const F_Score = item.frequency >= 4 ? 4 : item.frequency >= 3 ? 3 : item.frequency >= 2 ? 2 : 1;
        const M_Score = item.monetary >= 300 ? 4 : item.monetary >= 150 ? 3 : item.monetary >= 75 ? 2 : 1;
        
        let Segment = "Standard Active";
        if (R_Score === 4 && F_Score === 4 && M_Score === 4) {
          Segment = "Core High Value";
        } else if (R_Score === 1) {
          Segment = "Churned / At Risk";
        }

        return {
          customer_id: item.id,
          Recency: item.recency,
          Frequency: item.frequency,
          Monetary: item.monetary,
          R_Score,
          F_Score,
          M_Score,
          Segment
        };
      });
      return res.json({ rfm: processed, snapshot_date: snapshotDate.toISOString().split("T")[0] });
    }

    // Calculate ranked quartiles exactly as pandas logic
    const recencyItems = rfmBaseList.map(item => ({ id: item.id, val: item.recency }));
    const frequencyItems = rfmBaseList.map(item => ({ id: item.id, val: item.frequency }));
    const monetaryItems = rfmBaseList.map(item => ({ id: item.id, val: item.monetary }));

    // pd.qcut(rfm['Recency'], 4, labels=[4, 3, 2, 1]) -> Reverse true (shorter recency gets high score 4)
    const rScores = getRankedQuartiles(recencyItems, true);
    // pd.qcut(rfm['Frequency'].rank(method='first'), 4, labels=[1, 2, 3, 4])
    const fScores = getRankedQuartiles(frequencyItems, false);
    // pd.qcut(rfm['Monetary'], 4, labels=[1, 2, 3, 4])
    const mScores = getRankedQuartiles(monetaryItems, false);

    // Combine to final segment
    const processedRfm = rfmBaseList.map(item => {
      const r = rScores[item.id];
      const f = fScores[item.id];
      const m = mScores[item.id];

      let segment = "Standard Active";
      if (r === 4 && f === 4 && m === 4) {
        segment = "Core High Value";
      } else if (r === 1) {
        segment = "Churned / At Risk";
      }

      return {
        customer_id: item.id,
        Recency: item.recency,
        Frequency: item.frequency,
        Monetary: parseFloat(item.monetary.toFixed(2)),
        R_Score: r,
        F_Score: f,
        M_Score: m,
        Segment: segment
      };
    });

    res.json({
      rfm: processedRfm,
      snapshot_date: snapshotDate.toISOString().split("T")[0]
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Vite middleware for full-stack SPA serving wrapped in async bootstrap function
async function bootstrap() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[RFM Applet Server] running at http://localhost:${PORT}`);
  });
}

bootstrap();
