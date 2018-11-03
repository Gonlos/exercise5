var express = require("express");
const router = express.Router();
const MessageApp = require("../../messageAppClient/MessageApp");
const { validateBody, middlewareValidationError } = require("../validateBody");

router.post("/", validateBody, (req, res, next) => {
  const { destination, message } = req.body;
  MessageApp.send({ destination, message })
    .then(response => {
      const { ok, message } = response;
      res.status(200).json({
        ok,
        message
      });
    })
    .catch(error => {
      debug(error);
      res.status(500).json({
        ok: false,
        message: error.message
      });
    });
});

router.use(middlewareValidationError);

module.exports = router;

