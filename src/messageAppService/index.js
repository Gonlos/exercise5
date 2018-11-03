const express = require("express");
const debug = require("debug")("express:index");
const bodyParser = require("body-parser");
const app = express();

app.use(bodyParser.json({ limit: "5mb" }));
app.use((err, req, res, next) => {
  debug(err.message);
  res.status(400).json({ ok: false, message: "JSON syntax Error" });
});
app.use(bodyParser.urlencoded({ extended: false }));

const message = require("./router/message");
app.use("/message", message);

app.use(function(err, req, res, next) {
  debug(err);
  res.status(500).json({ ok: false, message: err });
});

app.listen(process.env.SERVICE_PORT || 9001, function() {
  console.log(
    `Server Express Ready on port ${process.env.SERVICE_PORT || 9001}!`
  );
});
