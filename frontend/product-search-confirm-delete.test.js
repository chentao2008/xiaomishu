const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function createElement() {
  return {
    children: [],
    dataset: {},
    disabled: false,
    hidden: true,
    innerHTML: "",
    style: {},
    textContent: "",
    addEventListener(type, handler) {
      this[`on${type}`] = handler;
    },
    closest(selector) {
      return selector === ".stock-delete" ? this : null;
    },
  };
}

async function runTest() {
  const cards = createElement();
  const button = createElement();
  button.dataset.id = "7";
  button.dataset.name = "精梳棉";

  const elements = {
    "#stockCards": cards,
    "#emptyState": createElement(),
    "#pager": createElement(),
    "#prevPage": createElement(),
    "#nextPage": createElement(),
    "#pageInfo": createElement(),
    "#keyword": { value: "" },
    "#searchForm": createElement(),
    "#msg": createElement(),
    "#deleteDialog": createElement(),
    "#deleteText": createElement(),
    "#deleteCancel": createElement(),
    "#deleteConfirm": createElement(),
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
    requireLogin: () => ({ username: "staff", is_admin: false }),
    request: async (path, options = {}) => {
      requests.push({ path, method: options.method || "GET" });
      return { items: [], total: 0, page: 1, page_size: 20 };
    },
    setMessage: () => {},
  };

  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(__dirname, "assets/js/product-search.js"), "utf8"), context);

  requests.length = 0;
  cards.onclick({ target: button });
  await Promise.resolve();

  assert.equal(elements["#deleteDialog"].hidden, false);
  assert.match(elements["#deleteText"].textContent, /确认删除精梳棉吗/);
  assert.deepEqual(requests, []);
}

runTest()
  .then(() => {
    console.log("product-search confirm delete test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
