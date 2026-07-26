const express = require("express");
const axios = require("axios");

const app = express();
const PORT = 4010;

const FINERACT_URL =
  "https://155.117.183.133:8443/fineract-provider/api/v1/authentication";

async function authenticateFineract() {
  try {
    const response = await axios.post(
      FINERACT_URL,
      {
        username: "mifos",
        password: "password",
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Fineract-Platform-TenantId": "default",
        },
        httpsAgent: new (require("https").Agent)({
          rejectUnauthorized: false, // same as curl -k
        }),
      }
    );

    console.log("✅ Fineract Auth Success:");
    console.log(response.data);
  } catch (error) {
    console.error("❌ Fineract Auth Failed:");

    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    } else {
      console.error(error.message);
    }
  }
}

// Run auth immediately when server starts
app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);

  await authenticateFineract();
});