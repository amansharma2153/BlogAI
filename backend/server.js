import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import PDFDocument from "pdfkit";
import fetch from "node-fetch";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

let blogs = [];


app.post("/api/suggest-title", async (req, res) => {
  try {
    const { topic } = req.body;
    console.log("📩 /api/suggest-title received:", req.body);

    if (!topic) {
      return res.status(400).json({ error: "Topic is required" });
    }

    const suggestion = `Amazing Blog About ${topic}`;

    res.json({ suggestion });
  } catch (err) {
    console.error("❌ Error in /api/suggest-title:", err);
    res
      .status(500)
      .json({ error: "Internal server error", details: err.message });
  }
});


app.post("/api/suggest-content", async (req, res) => {
  try {
    const { topic } = req.body;
    console.log("📩 /api/suggest-content received:", req.body);

    if (!topic) {
      return res.status(400).json({ error: "Topic is required" });
    }

    // 🔹 Placeholder suggestion (replace with AI call later)
    const content = `Here’s an engaging paragraph about ${topic}. You can expand this with more details, examples, and unique insights to make it a compelling blog post.`;

    res.json({ content });
  } catch (err) {
    console.error("❌ Error in /api/suggest-content:", err);
    res
      .status(500)
      .json({ error: "Internal server error", details: err.message });
  }
});


app.get("/api/images", async (req, res) => {
  const { query } = req.query;
  if (!query) return res.status(400).json({ error: "Query is required" });

  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
        query
      )}&per_page=3`,
      {
        headers: {
          Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`,
        },
      }
    );

    const data = await response.json();
    const images = data.results.map((img) => img.urls.small);
    res.json(images);
  } catch (error) {
    console.error("Unsplash API Error:", error);
    res.status(500).json({ error: "Failed to fetch images" });
  }
});


app.post("/api/save-pdf", async (req, res) => {
  try {
    const { title, content, author, imageBase64, imageUrl } = req.body;
    if (!title || !content || !author) {
      return res
        .status(400)
        .json({ error: "Title, content, and author are required" });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${title.replace(/\s+/g, "_")}.pdf"`
    );

    const doc = new PDFDocument();
    doc.pipe(res);


    doc.fontSize(20).text(title, { align: "center" });
    doc.moveDown();


    doc.fontSize(12).text(`By: ${author}`, { align: "center" });
    doc.moveDown();


    if (imageBase64 && imageBase64.startsWith("data:")) {
      const imageData = imageBase64.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(imageData, "base64");
      doc.image(buffer, { fit: [400, 300], align: "center" });
      doc.moveDown();
    } else if (imageUrl && imageUrl.startsWith("http")) {
      try {
        const response = await fetch(imageUrl);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        doc.image(buffer, { fit: [400, 300], align: "center" });
        doc.moveDown();
      } catch (err) {
        console.error("Image fetch failed:", err.message);
        doc
          .fontSize(10)
          .fillColor("red")
          .text("[Image failed to load]", { align: "center" });
        doc.moveDown();
      }
    }

    doc.fontSize(14).fillColor("black").text(content, { align: "left" });

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate PDF" });
  }
});


app.post("/api/blogs", (req, res) => {
  const { title, content, author, imageBase64, imageUrl } = req.body;
  const newBlog = {
    id: Date.now(),
    title,
    content,
    author,
    image: imageBase64 || imageUrl || null,
    createdAt: new Date(),
  };
  blogs.push(newBlog);
  res.json(newBlog);
});


app.get("/api/blogs", (req, res) => {
  res.json(blogs);
});

app.get("/api/save-pdf", (req, res) => {
  res.status(405).send("Use POST instead of GET for /api/save-pdf");
});


const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
