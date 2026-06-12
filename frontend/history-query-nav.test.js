const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const html = fs.readFileSync(path.join(__dirname, "history-query.html"), "utf8");

assert.match(html, /href="home\.html"/);
assert.match(html, />首页</);
assert.doesNotMatch(html, />账号列表</);

console.log("history query nav test passed");
