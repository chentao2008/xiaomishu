const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const html = fs.readFileSync(path.join(__dirname, "admin.html"), "utf8");

assert.match(html, /href="history-query\.html"/);
assert.match(html, />数据查询</);

console.log("admin history link test passed");
