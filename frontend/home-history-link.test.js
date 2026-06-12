const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const html = fs.readFileSync(path.join(__dirname, "home.html"), "utf8");
const historyIndex = html.indexOf('href="history-query.html"');
const entryIndex = html.indexOf('href="product-entry.html"');

assert.ok(historyIndex >= 0, "首页需要数据查询入口");
assert.ok(entryIndex >= 0, "首页需要保留录入库存入口");
assert.ok(historyIndex < entryIndex, "数据查询入口需要放在录入库存上方");
assert.match(html, />数据查询</);

console.log("home history link test passed");
