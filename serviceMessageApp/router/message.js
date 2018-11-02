var express = require("express");
const router = express.Router();
const MessageApp = require("../MessageApp");
const debug = require('debug')('express:message');

router.post("/", (req, res, next) => {
  const { destination, message } = req.body;
  MessageApp.send({ destination, message })
  .then(response => {
    const {ok,message} = response
    res
      .status(200)
      .json({
        ok,
        message
});
  })
  .catch(error => {
    debug(error)
    res.status(500)
    .json({
          ok: false,
          message:error.message
        })
  })
})

module.exports = router;
