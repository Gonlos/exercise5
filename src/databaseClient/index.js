const debug = require("debug")("debug:dbMessageApp");
const uuidv1 = require("uuid/v1");
const moment = require("moment");

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
    this.Credit = require("./models/Credit");
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

  createMessage({ destination, message }) {
    return this.haveCredit()
      .then(uuidLock => {
        debug("haveCredit:ok", uuidLock);
        if (uuidLock) {
          return this.Message.create({ destination, message, uuidLock });
        } else if (uuidLock === false) {
          return Promise.reject({ message: `There's no credit` });
        }
      })
      .catch(error => Promise.reject({ message: error.message }));
  }

  pay(uuidLock) {
    return this.Credit.findOneAndUpdate(
      { lock: uuidLock },
      { $inc: { balance: -1 } },
      { new: true }
    );
  }

  confirmMessage(uuidLock) {
    debug("confirmMessage", uuidLock);
    return this.Message.findOneAndUpdate({ uuidLock }, { state: { delivery: "confirmed" } });
  }

  notSentMessage(uuidLock) {
    return this.Message.findOneAndUpdate({ uuidLock }, { state: { delivery: "not_sent" } });
  }

  confirmMessagePayment(uuidLock) {
    debug("confirmMessagePayment", uuidLock);
    return this.Message.findOneAndUpdate({ uuidLock }, { state: { payment: "confirmed" } });
  }

  notPayedMessage(uuidLock) {
    return this.Message.findOneAndUpdate({ uuidLock }, { state: { payment: "not_payed" } });
  }

  getSentMessages() {
    return this.Message.find();
  }

  haveCredit() {
    return this.lock()
      .then(credit => {
        debug("findCredit", credit);
        if (credit == null) return Promise.reject({ message: "Locked credit" });
        debug("findCredit:balance", credit.balance);
        if (credit.balance > 0) {
          return Promise.resolve(credit.lock);
        }
        this.unlock();
        return Promise.resolve(false);
      })
      .catch(error => {
        debug("findCredit:catch", error);
        return Promise.reject({ message: error.message });
      });
  }

  lock() {
    let uuid = uuidv1();
    const secondsOfLock = moment()
      .subtract(4, "seconds")
      .toDate();
    const queryLock = {
      $or: [{ lock: uuid }, { lock: "" }, { lock: null }, { updated_at: { $lte: secondsOfLock } }]
    };
    const updateLock = { lock: uuid };
    const options = { new: true, project: { lock: 1, balance: 1 } };
    debug("Try lock");
    return this.Credit.findOneAndUpdate(queryLock, updateLock, options);
  }

  unlock() {
    debug("unlock");
    this.Credit.findOneAndUpdate({ lock: { $ne: "" } }, { lock: "" }, { new: true }).then(r =>
      debug("unlock")
    );
  }

  increaseCredit(amount) {
    return this.Credit.findOneAndUpdate(
      { balance: { $ne: null } },
      { $inc: { balance: amount } },
      { new: true }
    );
  }
}

module.exports = DbMessageApp;
