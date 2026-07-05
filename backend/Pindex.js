require('dotenv').config();
const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const axios = require("axios");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const merchant_id = process.env.PHONEPE_MERCHANT_ID || "PGTESTPAYUAT86";
const salt_key = process.env.PHONEPE_SALT_KEY || "96434309-7796-489d-8924-ab56988a6076";
const frontendBaseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
const orderBackendUrl = process.env.ORDER_BACKEND_URL || "http://localhost:5000";
const paymentCallbackUrl = process.env.PAYMENT_CALLBACK_URL || `${frontendBaseUrl}/payment-callback`;

const phonepeBaseUrls = [
  process.env.PHONEPE_BASE_URL,
  "https://api-preprod.phonepe.com/apis/pg-sandbox",
  "https://api3-preprod.phonepe.com/apis/pg-sandbox",
].filter(Boolean);

const buildPhonePeChecksum = (payload, path = "") => {
  const stringToHash = `${payload}${path}${salt_key}`;
  const checksumHash = crypto.createHash("sha256").update(stringToHash).digest("hex");
  return `${checksumHash}###1`;
};

const requestPhonePe = async (method, path, data, headers = {}) => {
  let lastError = null;

  for (const baseUrl of phonepeBaseUrls) {
    try {
      const url = `${baseUrl}${path}`;
      const response = await axios({ method, url, headers, data });
      return response;
    } catch (err) {
      lastError = err;
      if (!['ENOTFOUND', 'EAI_AGAIN'].includes(err.code)) {
        throw err;
      }
      console.warn(`PhonePe host unavailable: ${baseUrl} (${err.code}). Trying next host if available.`);
    }
  }

  throw lastError;
};

const checkPhonePeStatus = async (merchantTransactionId) => {
  const path = `/pg/v1/status/${merchant_id}/${merchantTransactionId}`;
  const checksum = buildPhonePeChecksum(path, "");

  const response = await requestPhonePe('GET', path, null, {
    accept: "application/json",
    "Content-Type": "application/json",
    "X-VERIFY": checksum,
    "X-MERCHANT-ID": merchant_id,
  });

  return response.data;
};

app.post("/order", async (req, res) => {
  try {
    const { MUID, transactionId, amount, name, mobile } = req.body;

    if (!MUID || !transactionId || !amount || !name || !mobile) {
      return res.status(400).json({ error: "Missing required payment fields." });
    }

    const payload = {
      merchantUserId: MUID,
      merchantId: merchant_id,
      merchantTransactionId: transactionId,
      name,
      amount: amount * 100,
      redirectUrl: paymentCallbackUrl,
      redirectMode: "POST",
      mobileNumber: mobile,
      paymentInstrument: { type: "PAY_PAGE" },
    };

    const requestPayload = JSON.stringify(payload);
    const requestBase64 = Buffer.from(requestPayload).toString("base64");
    const checksum = buildPhonePeChecksum(requestBase64, "/pg/v1/pay");

    const response = await requestPhonePe('POST', '/pg/v1/pay', { request: requestBase64 }, {
      accept: "application/json",
      "content-type": "application/json",
      "X-VERIFY": checksum,
    });
    const responseData = response.data;

    const findPaymentUrl = (obj) => {
      if (!obj || typeof obj !== 'object') return null;
      if (typeof obj === 'string') {
        return obj.startsWith('http') ? obj : null;
      }
      for (const key of Object.keys(obj)) {
        const value = obj[key];
        if (typeof value === 'string' && value.startsWith('http')) {
          return value;
        }
        const nested = findPaymentUrl(value);
        if (nested) return nested;
      }
      return null;
    };

    const paymentUrl =
      responseData.paymentUrl ||
      responseData.redirectUrl ||
      responseData.data?.paymentUrl ||
      responseData.data?.redirectUrl ||
      responseData.body?.paymentUrl ||
      responseData.body?.redirectUrl ||
      findPaymentUrl(responseData);

    if (!paymentUrl) {
      console.error('PhonePe response did not include a payment URL:', JSON.stringify(responseData, null, 2));
      return res.status(500).json({
        error: 'PhonePe did not return a payment URL.',
        response: responseData,
      });
    }

    return res.json({
      success: true,
      paymentUrl,
      transactionId,
      payload: responseData,
    });
  } catch (error) {
    console.error("Payment creation failed:", error.response?.data || error.message);
    return res.status(500).json({ error: error.response?.data || error.message });
  }
});

app.all("/payment-callback", async (req, res) => {
  try {
    const callbackBody = req.method === 'POST' && req.body?.request
      ? JSON.parse(Buffer.from(req.body.request, "base64").toString("utf-8"))
      : req.method === 'POST'
      ? req.body
      : null;

    const merchantTransactionId =
      callbackBody?.merchantTransactionId ||
      req.query.id ||
      req.body?.merchantTransactionId;

    if (!merchantTransactionId) {
      console.error("Payment callback missing transaction id", callbackBody || req.body);
      return res.status(400).send("Missing transaction id");
    }

    const statusResponse = await checkPhonePeStatus(merchantTransactionId);
    const isSuccess =
      statusResponse?.success === true ||
      statusResponse?.data?.status === "SUCCESS" ||
      statusResponse?.data?.paymentStatus === "SUCCESS";

    if (isSuccess) {
      try {
        await axios.post(`${orderBackendUrl}/updateorderstatus`, {
          transactionId: merchantTransactionId,
          status: true,
        });
      } catch (updateError) {
        console.warn('Order status update failed for transaction', merchantTransactionId, updateError.response?.data || updateError.message);
      }
    }

    const statusParam = isSuccess ? "success" : "failed";
    return res.redirect(`${frontendBaseUrl}/success?status=${statusParam}&id=${encodeURIComponent(merchantTransactionId)}`);
  } catch (error) {
    console.error("Payment callback verification failed:", error.response?.data || error.message);
    return res.redirect(`${frontendBaseUrl}/success?status=failed&id=${encodeURIComponent(req.query.id || req.body?.merchantTransactionId || "unknown")}`);
  }
});

app.get('/status', async (req, res) => {
  try {
    const merchantTransactionId = req.query.id;
    if (!merchantTransactionId) {
      return res.status(400).json({ error: "Transaction id is required" });
    }

    const statusResponse = await checkPhonePeStatus(merchantTransactionId);
    return res.json({ success: true, status: statusResponse });
  } catch (error) {
    console.error("Backend Status Check Error:", error.response?.data || error.message);
    return res.status(500).json({ error: error.response?.data || error.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 7000;
app.listen(PORT, () => {
  console.log(`Payment service is running on port ${PORT}`);
});