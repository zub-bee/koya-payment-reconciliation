// Payment reconciliation.
//
// Reads payments.jsonl and works out how much money we actually collected.
// Run:  node reconcile.js

const fs = require("fs");

let total = 0;
let count = 0;
let txnIds = {};

const lines = fs
  .readFileSync("payments.jsonl", "utf8")
  .split("\n")
  .filter((l) => l.length > 0);
for (const line of lines) {
  try {
    const event = JSON.parse(line);

    // set up dictionary to gather latest transactions before counting
    if (!event.txn_id) {
      continue; // added this to skip and move to next iteration if no txn_id exists
    } else if (txnIds[event.txn_id]) {
      // dict tracks previous attempts
      if (txnIds[event.txn_id].ts < event.ts)
        // for a previous attempt, check the ts difference
        txnIds[event.txn_id] = {
          ts: event.ts,
          status: event.status,
          amount: event.amount,
        };
      else continue; // if the ts is not the latest do not update
    } else {
      txnIds[event.txn_id] = {
        ts: event.ts,
        status: event.status,
        amount: event.amount,
      };
    }
  } catch (err) {
    if (err instanceof SyntaxError) {
      continue; // I added this error check to skip malformed data
    }
  }
}

// count values in dictionary
for (const id of Object.values(txnIds)) {
  if (id.status === "success") {
    total += Number(String(id.amount).replace(",", ""));
    count += 1;
  }
}

const expected = parseInt(fs.readFileSync("expected.txt", "utf8").trim(), 10);

if (count !== expected) {
  console.log(
    `Check failed: counted ${count} successful payments, expected ${expected}.`,
  );
  console.log(
    "Something in the data isn't being handled the way the README describes.",
  );
} else {
  console.log(`Check passed: ${count} successful payments.`);
  console.log(`Your code: KOYA-${Math.round(total)}`);
}
