"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import Papa from "papaparse";
import { generateWithFallback } from "@/lib/ollama";
import crypto from "crypto";

async function parsePdf(buffer) {
  try {
    console.log(`[PDF Parser] Buffer received: ${buffer?.length || 0} bytes. Running extraction...`);

    // Polyfill browser globals dynamically
    if (typeof global.DOMMatrix === "undefined") {
      global.DOMMatrix = class DOMMatrix {};
    }
    if (typeof global.ImageData === "undefined") {
      global.ImageData = class ImageData {};
    }
    if (typeof global.Path2D === "undefined") {
      global.Path2D = class Path2D {};
    }

    // Dynamic import to avoid SSR bundling issues and worker path resolution failures
    const { PDFParse } = require("pdf-parse");
    const { getData } = require("pdf-parse/worker");

    // Set the worker dynamically using the base64 data URL
    PDFParse.setWorker(getData());

    const parser = new PDFParse({ data: buffer });
    const data = await parser.getText();

    if (typeof parser.destroy === 'function') {
      await parser.destroy();
    }

    if (!data || !data.text) {
      throw new Error("PDF was read but no text was found. It might be a scanned image.");
    }
    return data.text;
  } catch (error) {
    console.error("PDF Parsing Error Detail:", error);
    const errorMsg = error.message || "Unknown error";
    if (errorMsg.includes("payload") || errorMsg.includes("worker")) {
      throw new Error("PDF parsing failed due to a worker conflict. Try a different browser or clear your server cache.");
    }
    throw new Error(`PDF Error: ${errorMsg}. Check if PDF is encrypted or password-protected.`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Smart Rule-Based Categorization Engine
// Highly optimized for Indian & Global merchants, UPI patterns, and explicit keywords
// ─────────────────────────────────────────────────────────────────────────────
function matchCategoryFromDescription(description) {
  if (!description) return null;
  const desc = String(description).toLowerCase().trim();

  // 1. Food & Dining / Cold Drinks / Beverages / Cafes / Bakeries
  const foodKeywords = [
    "cold drink", "cold drinks", "soft drink", "beverage", "beverages", "soda",
    "juice", "shakes", "smoothie", "lassi", "chai", "tea", "coffee", "cafe",
    "starbucks", "barista", "ccd", "cafe coffee day", "costa coffee", "chaayos",
    "chai point", "third wave", "blue tokai", "swiggy", "zomato", "eatclub",
    "eats", "mcdonalds", "mc donald", "kfc", "burger king", "burger", "pizza",
    "dominos", "pizza hut", "subway", "haldiram", "bikanervala", "sweet", "sweets",
    "mithai", "bakery", "bakers", "cake", "pastry", "pastries", "restaurant",
    "restro", "hotel", "dining", "dhaba", "bistro", "bar", "brewery", "pub",
    "ice cream", "naturals", "vadilal", "amul parlour", "biryani", "paradise",
    "bawarchi", "behrouz", "faasos", "waffle", "belgian waffle", "tiffin",
    "canteen", "mess", "snack", "snacks", "food court", "kitchen", "rolls",
    "shawarma", "shawarmaji", "dosa", "idli", "curry", "diner", "lunch", "dinner", "breakfast"
  ];
  if (foodKeywords.some((k) => desc.includes(k))) return "food";

  // 2. Shopping & Retail / Fashion / Electronics / E-commerce
  const shoppingKeywords = [
    "shopping", "retail", "amazon", "flipkart", "myntra", "ajio", "zara",
    "h&m", "hnm", "nykaa", "croma", "reliance digital", "apple store", "apple.com",
    "tata cliq", "uniqlo", "shoppers stop", "lifestyle", "decathlon", "meesho",
    "westside", "max fashion", "urbanic", "lenskart", "titan", "fastrack",
    "nike", "adidas", "puma", "sephora", "boutique", "clothing", "cloth",
    "garments", "apparel", "electronics", "footwear", "shoe", "shoes", "fashion",
    "mall", "store", "bazaar", "superstore", "market", "fabindia", "pantaloons",
    "trends", "zudio", "snitch", "bewakoof", "souled store", "boat", "noise",
    "oneplus", "samsung", "watch", "jewel", "jewellers", "tanishq", "malabar",
    "kalyan", "caratlane", "bluestone", "gift", "handloom", "tailor", "fabrics"
  ];
  if (shoppingKeywords.some((k) => desc.includes(k))) return "shopping";

  // 3. Groceries & Supermarkets & Daily Essentials
  const groceryKeywords = [
    "grocery", "groceries", "supermarket", "hypermarket", "blinkit", "zepto",
    "instamart", "bigbasket", "bb daily", "dmart", "d-mart", "spencers",
    "nature's basket", "more retail", "reliance fresh", "reliance smart",
    "smart bazaar", "kirana", "provision", "provisions", "vegetable",
    "vegetables", "veggies", "sabzi", "mandi", "fruit", "fruits", "milk",
    "dairy", "amul", "mother dairy", "nandini", "meat", "fish", "licious",
    "freshtohome", "country delight", "otipy", "super mart", "general store"
  ];
  if (groceryKeywords.some((k) => desc.includes(k))) return "groceries";

  // 4. Transportation & Fuel & Daily Commute
  const transportKeywords = [
    "uber", "ola", "rapido", "metro", "dmrc", "bmrc", "mmrda", "ncmc", "chalo",
    "fuel", "petrol", "diesel", "cng", "hpcl", "hindustan petroleum", "bpcl",
    "bharat petroleum", "iocl", "indian oil", "shell", "fastag", "toll", "nhai",
    "parking", "auto", "cab", "taxi", "transport", "bus", "vrl", "srs", "ksrtc",
    "msrtc", "apsrtc", "driver", "garage", "vehicle service", "puncture"
  ];
  if (transportKeywords.some((k) => desc.includes(k))) return "transportation";

  // 5. Travel & Hotels & Flights
  const travelKeywords = [
    "makemytrip", "mmt", "goibibo", "easemytrip", "cleartrip", "yatra",
    "irctc", "railway", "railways", "train ticket", "indigo", "air india",
    "spicejet", "vistara", "akasa", "emirates", "qatar airways", "booking.com",
    "agoda", "airbnb", "oyo", "resort", "hotel booking", "flight", "airline",
    "trip", "travels", "tourism", "visa", "holiday", "homestay"
  ];
  if (travelKeywords.some((k) => desc.includes(k))) return "travel";

  // 6. Utilities, Mobile, Broadband & Household Bills
  const utilityKeywords = [
    "electricity", "electric", "power", "bescom", "tneb", "msedcl", "cesc",
    "torrent power", "tata power", "uppcl", "water bill", "water supply",
    "wifi", "broadband", "act fibernet", "airtel broadband", "jio fiber",
    "airtel", "jio", "vodafone", "vi ", "bsnl", "mobile recharge", "recharge",
    "dth", "tata play", "tata sky", "sun direct", "dish tv", "d2h", "gas bill",
    "lpg", "indane", "bharat gas", "hp gas", "igl", "mahanagar gas", "piped gas",
    "adani gas", "municipal", "property tax", "maintenance bill", "utility"
  ];
  if (utilityKeywords.some((k) => desc.includes(k))) return "utilities";

  // 7. Entertainment & Subscriptions & Movies
  const entertainmentKeywords = [
    "netflix", "spotify", "prime video", "disney", "hotstar", "youtube premium",
    "youtube", "apple music", "bookmyshow", "bms", "pvr", "inox", "cinepolis",
    "sonyliv", "zee5", "aha", "jiosaavn", "gaana", "wynk", "steam",
    "playstation", "xbox", "game", "gaming", "cinema", "movie", "theatre",
    "event", "insider.in", "paytm insider", "concert", "amusement"
  ];
  if (entertainmentKeywords.some((k) => desc.includes(k))) return "entertainment";

  // 8. Healthcare, Pharmacy & Fitness
  const healthKeywords = [
    "apollo", "medplus", "1mg", "tata 1mg", "pharmeasy", "netmeds", "hospital",
    "clinic", "doctor", "diagnostic", "diagnostics", "lab", "pathology",
    "lal pathlabs", "dr lal", "srl", "metropolis", "dental", "dentist",
    "eye care", "optical", "lens", "pharmacy", "chemist", "druggist",
    "medicine", "medicines", "meds", "cult.fit", "cultfit", "gym", "fitness",
    "wellness", "physio", "ayurveda", "homeopathy"
  ];
  if (healthKeywords.some((k) => desc.includes(k))) return "healthcare";

  // 9. Education & Courses & Books
  const educationKeywords = [
    "school", "college", "university", "tuition", "coaching", "fees", "fee",
    "udemy", "coursera", "edx", "unacademy", "byjus", "physics wallah",
    "allen", "akash", "fiitjee", "books", "bookstore", "stationery", "stationers",
    "course", "training", "class", "exam", "testbook", "upgrad", "library"
  ];
  if (educationKeywords.some((k) => desc.includes(k))) return "education";

  // 10. Housing & Rent
  const housingKeywords = [
    "house rent", "room rent", "flat rent", "nobroker", "magicbricks",
    "society maintenance", "apartment maintenance", "security deposit", "brokerage",
    "pg rent", "hostel fees"
  ];
  if (housingKeywords.some((k) => desc.includes(k))) return "housing";

  // 11. Insurance & Investments
  const insuranceKeywords = [
    "lic", "hdfc life", "icici prudential", "icici pru", "max life", "sbi life",
    "star health", "care health", "niva bupa", "policybazaar", "insurance",
    "premium", "zerodha", "kite", "groww", "upstox", "angel one", "kuvera",
    "smallcase", "mutual fund", "sip", "ppf", "nps", "fixed deposit"
  ];
  if (insuranceKeywords.some((k) => desc.includes(k))) return "insurance";

  // 12. Income / Salary / Refunds
  const incomeKeywords = [
    "salary", "payroll", "wages", "stipend", "bonus", "dividend", "interest credit",
    "interest paid", "cashback", "refund", "upi refund", "neft cr", "imps cr",
    "rtgs cr", "ach cr", "credit interest"
  ];
  if (incomeKeywords.some((k) => desc.includes(k))) return "income";

  // 13. Personal Transfers (UPI, Paid To, Individuals)
  const personalKeywords = [
    "paid to", "sent to", "transfer to", "upi/paid", "upi/sent",
    "received from", "upi/received", "to mr", "to ms", "to mrs", "to shri"
  ];
  if (personalKeywords.some((k) => desc.includes(k))) return "personal";

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Normalization Helper for Deduplication & Merchant Keys
// ─────────────────────────────────────────────────────────────────────────────
function normalizeDescription(desc) {
  if (!desc) return "transaction";
  return String(desc)
    .toLowerCase()
    .replace(/[^\w\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function computeTransactionHash(userId, date, amount, description) {
  const dateStr = new Date(date).toISOString().split("T")[0];
  const amtStr = Number(amount).toFixed(2);
  const normDesc = String(description || "").toLowerCase().trim().substring(0, 50);
  const raw = `${userId}|${dateStr}|${amtStr}|${normDesc}`;
  return crypto.createHash("sha256").update(raw).digest("hex");
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Import Action
// ─────────────────────────────────────────────────────────────────────────────
export async function importTransactions(formData) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });
    if (!user) throw new Error("User not found");

    const file = formData.get("file");
    const accountId = formData.get("accountId");

    if (!file) throw new Error("No file uploaded");
    if (!accountId) throw new Error("Please select a target account for import");

    const fileType = file.name.split(".").pop().toLowerCase();
    let rawTransactions = [];

    if (fileType === "csv") {
      console.log(`[Import] Starting CSV processing for: ${file.name}`);
      const text = await file.text();
      const results = Papa.parse(text, { header: true, skipEmptyLines: true });
      console.log(`[Import] CSV parsed: ${results.data?.length || 0} rows found.`);
      rawTransactions = await mapDataToTransactions(results.data);
    } else if (fileType === "pdf") {
      console.log(`[Import] Starting PDF processing for: ${file.name}`);
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const pdfText = await parsePdf(uint8Array);
      console.log(`[Import] PDF text extracted (${pdfText?.length || 0} chars). Parsing with SAMPAT AI...`);
      rawTransactions = await mapDataToTransactions(pdfText);
    } else {
      throw new Error(`Unsupported file type: .${fileType}. Please upload a PDF statement or CSV file.`);
    }

    if (!rawTransactions || rawTransactions.length === 0) {
      return {
        success: false,
        count: 0,
        duplicateCount: 0,
        message: "No valid transactions could be found in the uploaded file.",
      };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 1 & 2: Data Formatting & Deduplication
    // ─────────────────────────────────────────────────────────────────────────
    const newTransactionsToInsert = [];
    const incomingHashes = new Set();
    let totalValidTransactions = 0;

    for (const t of rawTransactions) {
      if (!t.amount || isNaN(Number(t.amount)) || Number(t.amount) <= 0) continue;
      if (!t.date || isNaN(new Date(t.date).getTime())) continue;

      totalValidTransactions++;

      const type = t.type === "INCOME" ? "INCOME" : "EXPENSE";
      const date = new Date(t.date);
      const amount = parseFloat(t.amount);
      const description = t.description ? String(t.description).trim() : "Transaction";
      
      const hash = computeTransactionHash(user.id, date, amount, description);

      if (incomingHashes.has(hash)) {
        continue; // Skip duplicates within the same file
      }
      incomingHashes.add(hash);

      newTransactionsToInsert.push({
        ...t,
        hash,
        amount,
        type,
        date,
        description,
      });
    }

    if (newTransactionsToInsert.length === 0) {
      return {
        success: true,
        count: 0,
        duplicateCount: totalValidTransactions,
        message: "No new valid transactions found in the statement.",
      };
    }

    // Check against existing transactions in the database
    const existingTransactions = await db.transaction.findMany({
      where: {
        userId: user.id,
        hash: {
          in: Array.from(incomingHashes),
        },
      },
      select: {
        hash: true,
      },
    });

    const existingHashes = new Set(existingTransactions.map((tx) => tx.hash));

    const uniqueTransactionsToInsert = newTransactionsToInsert.filter(
      (t) => !existingHashes.has(t.hash)
    );

    const duplicateCount = totalValidTransactions - uniqueTransactionsToInsert.length;

    if (uniqueTransactionsToInsert.length === 0) {
      return {
        success: true,
        count: 0,
        duplicateCount,
        message: "All valid transactions in this statement already exist in your account.",
      };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 3: Smart Dual-Layer Categorization (Heuristic + Cache + AI Batch)
    // ─────────────────────────────────────────────────────────────────────────
    const categorizedTransactions = await categorizeTransactionsSmartly(
      uniqueTransactionsToInsert,
      user.id
    );

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 4: Ledger Persistence & Account Balance Update
    // ─────────────────────────────────────────────────────────────────────────
    const totalBalanceDelta = categorizedTransactions.reduce((acc, t) => {
      return acc + (t.type === "EXPENSE" ? -t.amount : t.amount);
    }, 0);

    const totalInflow = categorizedTransactions
      .filter((t) => t.type === "INCOME")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalOutflow = categorizedTransactions
      .filter((t) => t.type === "EXPENSE")
      .reduce((sum, t) => sum + t.amount, 0);

    await db.$transaction([
      ...categorizedTransactions.map((t) =>
        db.transaction.create({
          data: {
            type: t.type,
            amount: t.amount,
            description: t.description,
            date: t.date,
            category: t.category,
            userId: user.id,
            accountId: accountId,
            hash: t.hash,
          },
        })
      ),
      db.account.update({
        where: { id: accountId },
        data: { balance: { increment: totalBalanceDelta } },
      }),
    ]);

    // Revalidate relevant pages for instant real-time UI updates
    revalidatePath("/dashboard");
    revalidatePath("/reports");
    revalidatePath("/analyzer");
    revalidatePath(`/account/${accountId}`);

    return {
      success: true,
      count: categorizedTransactions.length,
      duplicateCount,
      totalInflow,
      totalOutflow,
      message: `Successfully imported ${categorizedTransactions.length} transaction(s).${duplicateCount > 0 ? ` Skipped ${duplicateCount} duplicates.` : ""}`,
    };
  } catch (error) {
    console.error("Import Transactions Error:", error);
    return {
      success: false,
      message: error.message || "Failed to process statement file",
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Smart Categorization: Rule Engine -> Merchant Cache -> AI Batch
// ─────────────────────────────────────────────────────────────────────────────
async function categorizeTransactionsSmartly(transactions, userId) {
  const VALID_CATEGORIES = [
    "housing", "transportation", "groceries", "utilities", "entertainment",
    "food", "shopping", "healthcare", "education", "personal",
    "travel", "insurance", "gifts", "bills", "other-expense", "income", "salary",
    "soft drinks"
  ];

  // 1. First Pass: Instant Rule-Based Matching
  const unclassified = [];
  const results = [];

  for (const t of transactions) {
    const ruleCat = matchCategoryFromDescription(t.description);
    if (ruleCat && VALID_CATEGORIES.includes(ruleCat)) {
      results.push({ ...t, category: ruleCat });
    } else {
      unclassified.push(t);
    }
  }

  if (unclassified.length === 0) {
    return results;
  }

  // 2. Second Pass: Check DB Merchant Cache
  const getMerchantKey = (desc) =>
    String(desc).toUpperCase().trim().replace(/\s+/g, " ").substring(0, 80);

  const uncachedMerchantKeys = [
    ...new Set(unclassified.map((t) => getMerchantKey(t.description))),
  ];

  const cachedMerchants = await db.merchantCategoryCache.findMany({
    where: { userId, merchantName: { in: uncachedMerchantKeys } },
    select: { merchantName: true, category: true },
  });

  const cacheMap = new Map(cachedMerchants.map((e) => [e.merchantName, e.category]));
  const stillNeedsAI = [];

  for (const t of unclassified) {
    const key = getMerchantKey(t.description);
    const cachedCat = cacheMap.get(key);
    if (cachedCat && VALID_CATEGORIES.includes(cachedCat)) {
      results.push({ ...t, category: cachedCat });
    } else {
      stillNeedsAI.push(t);
    }
  }

  if (stillNeedsAI.length === 0) {
    return results;
  }

  // 3. Third Pass: AI Categorization for remaining unknown merchants
  const uniqueUnknownKeys = [
    ...new Set(stillNeedsAI.map((t) => getMerchantKey(t.description))),
  ];

  const BATCH_SIZE = 20;
  const newCacheEntries = new Map();

  for (let i = 0; i < uniqueUnknownKeys.length; i += BATCH_SIZE) {
    const batch = uniqueUnknownKeys.slice(i, i + BATCH_SIZE);
    const prompt = `
      You are an expert financial transaction categorizer. Categorize each transaction/merchant name into EXACTLY one of these categories:
      - food (shivani veg hotel, dining, meals, restaurants, fast food, bakery, swiggy, zomato, heavy meals)
      - soft drinks (tea, coffee, cold drinks, beverages, juices purchased separately)
      - personal (paid to a person, sent to a friend, upi transfer to a phone number or individual name like "paid to tushar")
      - shopping (amazon, flipkart, clothes, fashion, zara, electronics, retail, footwear)
      - groceries (supermarkets, blinkit, zepto, instamart, bigbasket, dmart, vegetables, milk)
      - transportation (uber, ola, rapido, metro, fuel, petrol, diesel, fastag, parking, bus, cab)
      - travel (flights, hotels, irctc, makemytrip, oyo, airbnb, airlines)
      - utilities (electricity, water, wifi, broadband, airtel, jio, mobile recharge, gas, bills)
      - entertainment (netflix, spotify, movies, cinema, pvr, bookmyshow, games)
      - healthcare (pharmacy, medicines, 1mg, apollo, doctor, clinic, hospital)
      - education (school, college, tuition, fees, courses, books)
      - housing (rent, society maintenance, flat maintenance)
      - insurance (lic, health insurance, policy premium, investments)
      - other-expense (any general miscellaneous expense)

      Understand the intent: If it is a hotel/restaurant meal, use "food". If it's just a beverage/tea stall, use "soft drinks". If it's a direct transfer to a person (like "paid to tushar" or a phone number), use "personal".

      Merchants to categorize:
      ${JSON.stringify(batch)}

      Respond ONLY with a valid JSON object mapping each merchant to its lowercase category. Do NOT write scripts or code.
      Example: {"PAID TO TUSHAR": "personal", "SHIVANI VEG HOTEL": "food", "CHAI POINT": "soft drinks", "AMAZON": "shopping"}
    `;

    try {
      const rawText = await generateWithFallback(prompt);
      const cleaned = rawText.replace(/```(?:json)?\n?/g, "").trim();
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        for (const [mName, cat] of Object.entries(parsed)) {
          const lowerCat = String(cat).toLowerCase().trim();
          if (VALID_CATEGORIES.includes(lowerCat)) {
            newCacheEntries.set(mName, lowerCat);
            cacheMap.set(mName, lowerCat);
          }
        }
      }
    } catch (err) {
      console.warn(`[Categorization AI] Batch failed:`, err.message);
    }
  }

  // Save new categories to DB cache in background
  if (newCacheEntries.size > 0) {
    try {
      const upserts = Array.from(newCacheEntries.entries()).map(([merchantName, category]) =>
        db.merchantCategoryCache.upsert({
          where: { userId_merchantName: { userId, merchantName } },
          update: { category },
          create: { userId, merchantName, category },
        })
      );
      await Promise.all(upserts);
      console.log(`[Cache] Saved ${newCacheEntries.size} new merchant categories.`);
    } catch (cacheErr) {
      console.warn("[Cache] Failed to save merchant categories:", cacheErr.message);
    }
  }

  // Map remaining items
  for (const t of stillNeedsAI) {
    const key = getMerchantKey(t.description);
    const resolvedCat = cacheMap.get(key) || t.category || "other-expense";
    results.push({
      ...t,
      category: VALID_CATEGORIES.includes(resolvedCat) ? resolvedCat : "other-expense",
    });
  }

  return results;
}

function parseJsonArraySafely(rawText) {
  if (!rawText) return [];
  const cleaned = rawText.replace(/```(?:json)?\n?/g, "").trim();

  // 1. Try direct parse
  try {
    const direct = JSON.parse(cleaned);
    if (Array.isArray(direct)) return direct;
    if (direct && typeof direct === "object" && direct.amount) return [direct];
  } catch (e) { }

  // 2. Try extracting between first [ and last ]
  const firstBracket = cleaned.indexOf("[");
  const lastBracket = cleaned.lastIndexOf("]");
  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    const arraySlice = cleaned.substring(firstBracket, lastBracket + 1);
    try {
      const parsed = JSON.parse(arraySlice);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      // Fix trailing commas
      try {
        const fixed = arraySlice.replace(/,\s*([\]}])/g, "$1");
        const parsedFixed = JSON.parse(fixed);
        if (Array.isArray(parsedFixed)) return parsedFixed;
      } catch (e2) { }
    }
  }

  // 3. Fallback: extract individual JSON objects with regex
  const items = [];
  const objectRegex = /\{[^{}]*"amount"\s*:\s*[^,{}]*,[^{}]*\}/g;
  let match;
  while ((match = objectRegex.exec(cleaned)) !== null) {
    try {
      const item = JSON.parse(match[0].replace(/,\s*}/g, "}"));
      if (item && item.amount) items.push(item);
    } catch (e) { }
  }
  return items;
}

// ─────────────────────────────────────────────────────────────────────────────
// Raw Statement Data to Structured Transactions Extraction
// ─────────────────────────────────────────────────────────────────────────────
async function mapDataToTransactions(data) {
  const isCSV = Array.isArray(data);
  let chunks = [];

  if (isCSV) {
    const chunkSize = 50;
    for (let i = 0; i < data.length; i += chunkSize) {
      chunks.push(JSON.stringify(data.slice(i, i + chunkSize)));
    }
  } else {
    // Safely chunk PDF text by newlines to avoid splitting transaction lines in half.
    // 4000 characters ensures the AI doesn't hit output token limits per chunk.
    const chunkSize = 4000;
    const lines = data.split('\n');
    let currentChunk = "";
    
    for (const line of lines) {
      if (currentChunk.length + line.length > chunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk);
        currentChunk = "";
      }
      currentChunk += line + '\n';
    }
    if (currentChunk.trim().length > 0) {
      chunks.push(currentChunk);
    }
  }

  if (chunks.length === 0) {
    throw new Error("No data found to extract from the uploaded statement.");
  }

  let allTransactions = [];

  // Process in batches of 3 to speed up extraction without overwhelming local Ollama/API
  const CONCURRENCY = 3;
  for (let i = 0; i < chunks.length; i += CONCURRENCY) {
    const batch = chunks.slice(i, i + CONCURRENCY);
    
    const batchPromises = batch.map(async (chunk, batchIndex) => {
      const chunkNumber = i + batchIndex + 1;
      console.log(`[Extraction] Processing statement chunk ${chunkNumber}/${chunks.length}...`);

      const prompt = `
      You are an expert financial statement extractor. Extract EVERY single transaction record from this ${isCSV ? "CSV batch" : "Bank Statement PDF chunk"
      }.

      Statement Chunk Content:
      ${chunk}

      Extraction Rules:
      1. Extract EVERY transaction line you find.
      2. For each transaction, return a JSON object with:
         - "amount": positive numeric amount in Indian Rupees (e.g. 240.50). 
           CRITICAL: Do NOT multiply or divide by 100. Read exact numbers. 
           "500.00" -> 500, "1,500.00" -> 1500, "50" -> 50.
         - "date": ISO date string (YYYY-MM-DD, e.g. "2024-03-15"). Parse dates accurately from any format like DD/MM/YYYY, DD-Mon-YYYY, etc.
         - "description": merchant name or transaction summary (e.g. "Swiggy Bangalore", "Amazon India", "Chai Point", "HPCL Petrol Pump", "Netflix Subscription").
         - "type": "EXPENSE" for debits, payments, purchases, ATM withdrawals, fees, or negative values. "INCOME" for deposits, salary, credits, refunds, interest, or "CR".
         - "category": one of: "food", "shopping", "groceries", "transportation", "utilities", "entertainment", "healthcare", "education", "travel", "housing", "insurance", "other-expense", "income".
           - Cold drinks, juices, cafe, tea, restaurants, Swiggy, Zomato -> "food"
           - E-commerce, clothes, electronics, Amazon, Flipkart, Myntra -> "shopping"
           - Blinkit, Zepto, DMart, BigBasket, Supermarket -> "groceries"
           - Uber, Ola, Petrol, Fuel, Metro, Fastag -> "transportation"
           - Electricity, water, mobile recharge, wifi, bills -> "utilities"

      CRITICAL: DO NOT WRITE ANY CODE, SCRIPTS, OR PYTHON. ONLY OUTPUT RAW JSON.
      MUST OUTPUT AN ARRAY OF JSON OBJECTS. START WITH [ AND END WITH ].

      Return ONLY a valid JSON array of objects.
      Example:
      [
        {"amount": 120.0, "date": "2024-03-10", "description": "Cold Drinks & Snacks Store", "type": "EXPENSE", "category": "food"},
        {"amount": 1499.0, "date": "2024-03-11", "description": "Amazon India Apparel", "type": "EXPENSE", "category": "shopping"}
      ]
      If no transactions are in this chunk, return [].
    `;

      try {
        const rawText = await generateWithFallback(prompt);
        const parsed = parseJsonArraySafely(rawText);
        if (Array.isArray(parsed) && parsed.length > 0) {
          console.log(`[Extraction] Chunk ${chunkNumber} extracted ${parsed.length} transactions.`);
          return parsed;
        }
      } catch (err) {
        console.warn(`[Extraction] Error on chunk ${chunkNumber}:`, err.message);
      }
      return [];
    });

    const batchResults = await Promise.all(batchPromises);
    for (const parsed of batchResults) {
      allTransactions = [...allTransactions, ...parsed];
    }
  }

  console.log(`[Extraction] Done. Total raw transactions extracted: ${allTransactions.length}`);
  return allTransactions;
}


