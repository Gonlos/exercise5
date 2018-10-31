var express = require("express");
const router = express.Router();
const MessageApp = require("../MessageApp");

router.post("/", (req, res, next) => {
  const { destination, message } = req.body;
  MessageApp.send({ destination, message })
  .then(response => {
    res
      .status(response.status)
      .send(
        `Env: ${
          process.env.NODE_ENV || "local"
        },\nStatus: ${
          response.status
        }, \nData: ${response.data}`
      );
  });
});

module.exports = router;
