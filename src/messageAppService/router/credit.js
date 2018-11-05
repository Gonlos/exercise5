var express = require("express");
const router = express.Router();
const MessageApp = require("../../messageAppClient/MessageApp");
const debug = require("debug")("debug:credit");

router.post("/", (req, res, next) => {
  const { amount } = req.body;
  MessageApp.increaseCredit(amount)
    .then(response => {
      debug("ok", response);
      const { message } = response;
      res.status(200).json({
        ok: true,
        message
      });
    })
    .catch(error => {
      debug("error", error);
      res.status(500).json({
        ok: false,
        message: error.message
      });
    });
});

module.exports = router;
