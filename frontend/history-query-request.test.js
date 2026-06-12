const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function createElement(value = "") {
  return {
    value,
    hidden: false,
    innerHTML: "",
    textContent: "",
    className: "",
    addEventListener(type, handler) {
      this[`on${type}`] = handler;
    },
  };
}

async function runTest() {
  const elements = {
    "#historyForm": createElement(),
    "#startDate": createElement("2026-06-01"),
    "#endDate": createElement("2026-06-12"),
    "#warehouse": createElement("贵阳"),
    "#actionType": createElement("deleted"),
    "#createdTotal": createElement(),
    "#deletedTotal": createElement(),
    "#historyRows": createElement(),
    "#msg": createElement(),
  };
  const requests = [];
  const context = {
    console,
    document: {
      querySelector(selector) {
        return elements[selector] || createElement();
      },
    },
    encodeURIComponent,
    localStorage: { getItem: () => null },
    requireLogin: () => ({ username: "admin", is_admin: true }),
    bindLogout: () => {},
    request: async (url) => {
      requests.push(url);
      return {
        created_total: 2,
        deleted_total: 1,
        rows: [{ date: "2026-06-12", warehouse: "贵阳", created_count: 2, deleted_count: 1 }],
      };
    },
    setMessage: () => {},
    Date,
  };

  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(__dirname, "assets/js/history-query.js"), "utf8"), context);

  requests.length = 0;
  await elements["#historyForm"].onsubmit({ preventDefault() {} });

  assert.equal(
    requests[0],
    "/fabric-tails/history?start_date=2026-06-01&end_date=2026-06-12&warehouse=%E8%B4%B5%E9%98%B3&action=deleted"
  );
  assert.equal(elements["#createdTotal"].textContent, "2");
  assert.equal(elements["#deletedTotal"].textContent, "1");
  assert.equal(elements["#msg"].textContent, "");
  assert.match(elements["#historyRows"].innerHTML, /贵阳/);
}

runTest()
  .then(() => {
    console.log("history query request test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
