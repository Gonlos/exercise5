const debug = require("debug")("debug:dbMessageApp");

const toMilliseconds = seconds => {
  return seconds * 1000;
};

const MAX_SECONDS_DELAY = 60;
const INC_SECONDS_DELAY = 2;

class DbMessageApp {
  constructor(user, password, url, port) {
    this.uri = `mongodb://${url}:${port}/messageApp`;
    this.reconnects = 0;
    this.mongoose = require("mongoose");
    this.Message = require("./models/Message");
    this.connectDb(this.uri);
  }

  connectDb(uri) {
    this.mongoose
      .connect(
        this.uri,
        { useNewUrlParser: true }
      )
      .then(x => {
        console.log(`Connected to Mongo! Database name: "${x.connections[0].name}"`);
        this.reconnect = 0;
      })
      .catch(err => {
        console.error("Error connecting to mongo", err.message);
        this.reconnect(uri);
      });
  }

  reconnect(uri) {
    this.reconnects++;
    let delay = INC_SECONDS_DELAY ** this.reconnects;
    delay = delay < MAX_SECONDS_DELAY ? delay : MAX_SECONDS_DELAY;
    console.log(`Reconnecting in ${delay} seconds`);
    setTimeout(() => this.connectDb(uri), toMilliseconds(delay));
  }

  isConnect() {
    return this.mongoose.connection.readyState == 1;
  }

  createMessage(obj) {
    return this.Message.create(obj);
  }

  confirmMessage(messageId) {
    return this.Message.findOneAndUpdate({ _id: messageId }, { state: "confirmed" });
  }

  notSentMessage(messageId) {
    return this.Message.findOneAndUpdate({ _id: messageId }, { state: "not_sent" });
  }

  getSentMessages() {
    return this.Message.find();
  }
}

module.exports = DbMessageApp;
