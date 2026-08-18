import express, { Router } from "express";
import { GoogleGenAI } from "@google/genai";
import prisma from "../db.js";
import { protect } from "../authMiddleware/protect.js";

const menuScanRouter = Router();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_KEY,
});

const SYSTEM_PROMPT = `
Extract food items from restaurant menu text.

Return JSON ONLY.

Schema:
{
  "items": [
    {
      "name": "",
      "price": 0,
      "category": "",
      "description": "",
      "stockAmount": 0
    }
  ]
}

Rules:
- price must be a number
- infer category
- missing values = 0
`;

const PLAN_LIMITS = {
  free: 5,
  pro: 100,
};

menuScanRouter.post("/parse", protect, async (req, res) => {
  const { cleanText } = req.body;

  if (!cleanText || typeof cleanText !== "string") {
    return res.status(400).json({ error: "cleanText is required", items: [] });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        plan: true,
        restList: {
          select: {
            id: true,
            _count: { select: { inventories: true } },
          },
        },
      },
    });

    const rest = user?.restList?.[0];

    if (!rest) {
      return res.status(403).json({ error: "No restaurant found for this account", items: [] });
    }

    const limit = PLAN_LIMITS[user.plan] ?? 0;
    if (rest._count.inventories >= limit) {
      return res.status(403).json({
        error: `${user.plan === "free" ? "Only 5 items are allowed in the free plan." : "Pro plan only allows 100 items"}`,
        items: [],
      });
    }

    const cleaned = cleanText.slice(0, 6000);

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: SYSTEM_PROMPT + "\n\n" + cleaned,
      config: {
        temperature: 0,
        maxOutputTokens: 2048,
      },
    });

    const text = response.text.trim();
    const cleanJSON = text.replace(/```json|```/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(cleanJSON);
    } catch {
      console.error("Gemini did not return valid JSON:", text);
      return res.status(422).json({
        error: "Could not detect menu items in this file. Try a clearer photo or a different file.",
        items: [],
      });
    }

    const unique = Object.values(
      parsed.items.reduce((acc, item) => {
        const key = item.name?.toLowerCase();
        if (key) acc[key] ??= item;
        return acc;
      }, {})
    );

    res.json({ items: unique });
  } catch (err) {
    console.error("Gemini parsing failed:", err?.message, err);
    res.status(500).json({ error: "Failed to parse menu", items: [] });
  }
});

export default menuScanRouter;