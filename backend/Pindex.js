const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const axios = require("axios");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const merchant_id = "PGTESTPAYUAT86";
const salt_key = "96434309-7796-489d-8924-ab56988a6076";

app.post("/order", async (req, res) => {
  console.log("PGTESTPAYUAT86");
  try {
    const { MUID, transactionId, amount, name, mobile } = req.body;

    const data = {
      merchantUserId: MUID,
      merchantId: merchant_id,
      merchantTransactionId: transactionId,
      name: name,
      amount: amount * 100,
      redirectUrl: `http://localhost:3000/success?id=${transactionId}`,
      redirectMode: "POST",
      mobileNumber: mobile,
      paymentInstrument: { type: "PAY_PAGE" },
    };

    const payload = JSON.stringify(data);
    const payloadMain = Buffer.from(payload).toString("base64");
    const string = payloadMain + "/pg/v1/pay" + salt_key;

    const sha256 = crypto.createHash("sha256").update(string).digest("hex");
    const checksum = sha256 + "###" + 1;

    const options = {
      method: "POST",
      url: "https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "X-VERIFY": checksum,
      },
      data: { request: payloadMain },
    };

    const response = await axios(options);
    res.json(response.data);
    console.log("End");
  } catch (error) {
    console.error("Backend Error Details: ", error.response?.data || error.message);
    res.status(500).json({ error: error.response?.data || error.message });
  }
});


app.post('/status', async (req, res) => {
  console.log("PGTESTPAYUAT86Start");
  try {
  
    const merchantTransactionId = req.query.id;

    const string = `/pg/v1/status/${merchant_id}/${merchantTransactionId}` + salt_key;
    const sha256 = crypto.createHash('sha256').update(string).digest('hex');
    const checksum = sha256 + '###' + 1;

    const options = {
      method: 'GET',
      url: `https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/status/${merchant_id}/${merchantTransactionId}`,
      headers: {
        accept: 'application/json',
        'Content-Type': 'application/json',
        'X-VERIFY': checksum,
        'X-MERCHANT-ID': merchant_id,
      },
    };

    const response = await axios(options);

    if (response.data.success === true) {
      console.log("IFStart");
      res.redirect("http://localhost:3000/success");
      console.log("IFEnd");
    } else {
      res.redirect("http://localhost:3000/failure");
    }
    console.log("EndStatus");
  } catch (error) {
    console.error("Backend Status Check Error: ", error.response?.data || error.message);
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

// Start the server
app.listen(7000, () => {
  console.log("Server is running on port 7000");
});
