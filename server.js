const express = require('express');
const cors = require('cors');
const axios = require('axios');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();

app.set('maxHttpHeaderSize', 16384);  // <<< FIX
app.use(cors());
app.use(express.json());
// --- FIX #1: increase body limit (important for large orders)
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));

// --- FIX #2: trim headers (prevents 431)
app.use((req, res, next) => {
  for (const header in req.headers) {
    if (typeof req.headers[header] === 'string' && req.headers[header].length > 2000) {
      req.headers[header] = req.headers[header].substring(0, 2000);
    }
  }
  next();
});

// --- FIX #3: CORS (frontend → backend local)
app.use(cors({
  origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"],
}));

const MAKE_WEBHOOK = process.env.MAKE_WEBHOOK;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;

function formatItems(items = []) {
  return items.map(it =>
    `- ${it.name} (${it.size}) x${it.qty} = Rs.${it.lineTotal}`
  ).join('\n');
}

// --- MAIN API ENDPOINT ---
app.post('/api/submitOrder', async (req, res) => {
  const payload = req.body || {};
  const { orderId, customer = {}, items = [], subtotal = 0, paymentMethod } = payload;

  console.log("Incoming order:", payload);

  // --- send to Make.com first ---
  try {
    if (MAKE_WEBHOOK) {
      await axios.post(MAKE_WEBHOOK, payload, {
        headers: { "Content-Type": "application/json" }
      });
    }
  } catch (err) {
    console.error("Make webhook error:", err.message);
  }

  // --- send email ---
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn("EMAIL credentials missing — skipping email");
    } else {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: [ADMIN_EMAIL, customer.email].filter(Boolean),
        subject: `New Order - ${orderId}`,
        text: `
Order ID: ${orderId}

Customer:
${customer.name}
${customer.email}
${customer.phone}
${customer.address}

Items:
${formatItems(items)}

Subtotal: Rs.${subtotal}
Payment Method: ${paymentMethod || 'N/A'}
`
      };

      await transporter.sendMail(mailOptions);
    }

    res.json({ success: true, message: "Order processed successfully" });

  } catch (err) {
    console.error("Email error:", err);
    res.status(500).json({ success: false, error: "Email failed" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("API running on port", PORT));
