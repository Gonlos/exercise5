var express = require("express");
const router = express.Router();
const MessageApp = require("../../messageAppClient/MessageApp");
const debug = require("debug")("debug:message");
const { validateBody, middlewareValidationError } = require("../validateBody");

router.get("/", (req, res, next) => {
  MessageApp.getSentMessages()
    .then(messages => {
      debug("getSentMessages:ok", messages);
      res.status(200).json({
        ok: true,
        messages
      });
    })
    .catch(error => {
      debug("getSentMessages:error", error);
      res.status(500).json({
        ok: false,
        message: error.message
      });
    });
});

router.post("/", validateBody, (req, res, next) => {
  const { destination, message } = req.body;
  MessageApp.send({ destination, message })
    .then(response => {
      debug("ok", response);
      const { ok, message } = response;
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

router.use(middlewareValidationError);

module.exports = router;
