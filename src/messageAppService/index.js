const express = require("express");
const debug = require("debug")("debug:index");
const bodyParser = require("body-parser");

const app = express();
const SERVICE_PORT = process.env.SERVICE_PORT || 9004;
app.use(bodyParser.json({ limit: "5mb" }));
app.use((err, req, res, next) => {
  debug(err.message);
  res.status(200).json({ ok: false, message: "JSON syntax Error" });
});
app.use(bodyParser.urlencoded({ extended: false }));

const messages = require("./router/messages");
app.use("/messages", messages);

const credit = require("./router/credit");
app.use("/credit", credit);

app.use(function(err, req, res, next) {
  debug(err);
  res.status(200).json({ ok: false, message: err });
});

app.listen(SERVICE_PORT, function() {
  console.log(`Server Express Ready on port ${SERVICE_PORT}!`);
});
