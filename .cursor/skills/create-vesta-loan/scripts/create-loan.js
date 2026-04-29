#!/usr/bin/env node
/**
 * create-loan.js
 *
 * Usage:
 *   node create-loan.js [jsonFilePath] [env] [actions]
 *
 * Defaults:
 *   jsonFilePath = /Users/sijaiswal/Documents/Dev/LC-NextJs/nextjs-loancreate/public/jsons/johnHomeowner-Purchase.json
 *   env          = dev
 *   actions      = {"pullCredit":true,"pullCosts":true,"runAus":true}
 */

const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");

const DEFAULT_JSON = path.resolve(
  "/Users/sijaiswal/Documents/Dev/LC-NextJs/nextjs-loancreate/public/jsons/johnHomeowner-Purchase.json"
);

// Runtime-injected values (never stored in the JSON file)
const LOAN_ORIGINATOR_ID = "7426ba78-984b-4f10-a872-2a58d9d53365";
const BORROWER_EMAIL = "siddhant.jaiswal+1@pnmac.com";
const LOANCREATE_API = "http://localhost:3001";
const ADMIN_CONFIG_PATH = "/admin/admin-config";
const LOANS_PATH = "/loans";

const jsonFilePath = process.argv[2] || DEFAULT_JSON;
const env = process.argv[3] || "dev";
const actions = process.argv[4]
  ? JSON.parse(process.argv[4])
  : { pullCredit: true, pullCosts: true, runAus: true };
const selectedUserName = process.argv[5] || "Sids Agent";
const isDocUploadEnabled = process.argv[6] !== undefined ? process.argv[6] : "true";

function httpGet(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith("https") ? https : http;
    lib.get(url, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve(JSON.parse(data)));
    }).on("error", reject);
  });
}

function httpPost(url, body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 3001,
      path: urlObj.pathname + urlObj.search,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
      },
    };
    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve(JSON.parse(data)));
    });
    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

function buildDates() {
  const today = new Date();
  const closing = new Date(today);
  closing.setDate(closing.getDate() + 14);
  return {
    tridTriggeredDateTimestamp: today.toISOString().split("T")[0] + "T00:00:00.000Z",
    closingDate: closing.toISOString().split("T")[0],
    pdaAcknowledged: today.toISOString().split("T")[0] + "T00:00:00.000Z",
  };
}

async function run() {
  // 1. Load and patch payload
  const payload = JSON.parse(fs.readFileSync(jsonFilePath, "utf8"));
  const dates = buildDates();

  payload.closingDate = dates.closingDate;
  payload.tridTriggeredDateTimestamp = dates.tridTriggeredDateTimestamp;
  if (payload.customFields) {
    payload.customFields.pdaAcknowledged = dates.pdaAcknowledged;
  }

  // Inject fields that are never stored in the JSON file
  payload.loanOriginator = { id: LOAN_ORIGINATOR_ID };
  if (payload.borrowers?.[0]) {
    payload.borrowers[0].emailAddress = BORROWER_EMAIL;
  }

  console.log(`closingDate               : ${payload.closingDate}`);
  console.log(`tridTriggeredDateTimestamp : ${payload.tridTriggeredDateTimestamp}`);
  console.log(`loanOriginator.id          : ${payload.loanOriginator.id}`);
  console.log(`borrower email             : ${payload.borrowers?.[0]?.emailAddress}`);
  console.log(`selectedUserName           : ${selectedUserName}`);
  console.log(`isDocUploadEnabled         : ${isDocUploadEnabled}`);

  // 2. Fetch default version ID
  console.log(`\nFetching default version (env=${env})...`);
  const adminConfig = await httpGet(`${LOANCREATE_API}${ADMIN_CONFIG_PATH}?env=${env}`);
  const defaultVersionId = adminConfig.defaultProcessVersionId;
  if (!defaultVersionId) throw new Error("Could not find defaultProcessVersionId in admin-config");
  console.log(`defaultVersionId        : ${defaultVersionId}`);

  // 3. POST loan
  const actionsParam = encodeURIComponent(JSON.stringify(actions));
  const url = `${LOANCREATE_API}${LOANS_PATH}?env=${env}&selectedVersionId=${defaultVersionId}&isDefaultVersion=true&selectedUserName=${encodeURIComponent(selectedUserName)}&isDocUploadEnabled=${isDocUploadEnabled}&actions=${actionsParam}`;

  console.log("\nCreating loan...");
  const result = await httpPost(url, payload);

  if (result.success) {
    const loanId = result.loanData?.loanId || result.loanData?.id;
    const loanNumber = result.loanData?.loanNumber;

    const rows = [
      ["Field", "Value"],
      ["─".repeat(30), "─".repeat(40)],
      ["Loan ID", loanId],
      ["Loan Number", loanNumber],
      ["─".repeat(30), "─".repeat(40)],
      ["Environment", env],
      ["Process Version ID", defaultVersionId],
      ["─".repeat(30), "─".repeat(40)],
      ["Borrower Email", payload.borrowers?.[0]?.emailAddress],
      ["Loan Originator ID", payload.loanOriginator.id],
      ["Selected User", selectedUserName],
      ["Doc Upload Enabled", isDocUploadEnabled],
      ["─".repeat(30), "─".repeat(40)],
      ["Closing Date", payload.closingDate],
      ["TRID Triggered Date", payload.tridTriggeredDateTimestamp],
      ["PDA Acknowledged", payload.customFields?.pdaAcknowledged],
      ["─".repeat(30), "─".repeat(40)],
      ["Pull Credit", actions.pullCredit ?? false],
      ["Pull Costs", actions.pullCosts ?? false],
      ["Run AUS", actions.runAus ?? false],
    ];

    const colW = [32, 42];
    const border = `+${"─".repeat(colW[0] + 2)}+${"─".repeat(colW[1] + 2)}+`;

    console.log("\n✅ Loan created successfully!\n");
    console.log(border);
    rows.forEach(([a, b]) => {
      const isSep = String(a).startsWith("─");
      if (isSep) {
        console.log(`+${"─".repeat(colW[0] + 2)}+${"─".repeat(colW[1] + 2)}+`);
      } else {
        const label = String(a).padEnd(colW[0]);
        const val = String(b ?? "").padEnd(colW[1]);
        console.log(`| ${label} | ${val} |`);
      }
    });
    console.log(border);
  } else {
    console.error("\n❌ Loan creation failed:");
    console.error(`   ${result.message}`);
    console.error(`   ${result.error || ""}`);
    process.exit(1);
  }
}

run().catch((err) => {
  console.error("Fatal error:", err.message);
  process.exit(1);
});
