const debug = require("debug")("debug:dbMessageApp");
const uuidv1 = require("uuid/v1");
const moment = require("moment");
const mongoose = require("mongoose");
const toMilliseconds = seconds => {
  return seconds * 1000;
};

const MAX_SECONDS_DELAY = 60;
const INC_SECONDS_DELAY = 2;

class DbMessageApp {
  constructor(user, password, url, port) {
    let hostname1, hostname2, port2;
    if (url == "localhost") {
      hostname1 = "localhost";
      hostname2 = "localhost";
      port2 = +port + 1;
    } else {
      hostname1 = url + "1";
      hostname2 = url + "2";
      port2 = port;
    }
    this.uri1 = `mongodb://${hostname1}:${port}/messageApp`;
    this.uri2 = `mongodb://${hostname2}:${port2}/messageApp`;
    this.reconnects = 0;
    this.DB = {};
    this.connectDb(this.uri1, "main"), this.connectDb(this.uri2, "backup");
  }

  connectDb(uri, env) {
    return mongoose
      .createConnection(uri, { useNewUrlParser: true })
      .then(conn => {
        this.DB[env] = conn;
        require("./models/Credit")(conn);
        require("./models/Message")(conn);
        debug("models", Object.keys(conn.models));
        conn.on("disconnected", a => {
          debug("onDisconnected", `${conn.host}:${conn.port}/${conn.name}`);
        });
        conn.on("reconnected", a => {
          debug("onReconnected", `${conn.host}:${conn.port}/${conn.name}`);
        });
        conn.on("connected", a => {
          debug("onConnected", `${conn.host}:${conn.port}/${conn.name}`);
        });
        this.isConnect(conn);
        console.log(`Connected to Mongo! Database ${conn.host}:${conn.port}/${conn.name}`);
        this.reconnects = 0;
        return conn;
      })
      .catch(err => {
        console.error("Error connecting to mongo", err.message);
        return this.reconnect(uri);
      });
  }

  reconnect(uri) {
    this.reconnects++;
    let delay = INC_SECONDS_DELAY ** this.reconnects;
    delay = delay < MAX_SECONDS_DELAY ? delay : MAX_SECONDS_DELAY;
    console.log(`Reconnecting in ${delay} seconds`);
    setTimeout(() => this.connectDb(uri), toMilliseconds(delay));
  }

  isConnect(db) {
    debug("isConnect", db.readyState);
    return db.readyState == 1;
  }

  createMessage({ destination, message }) {
    return this.haveCredit()
      .then(({ credit, uuidLock }) => {
        debug("haveCredit:ok", uuidLock);
        if (uuidLock) {
          if (this.isConnect(this.DB.backup)) {
            debug("lanzo backup");
            this.DB.backup.models.Message.create({ destination, message, uuidLock }).catch(() =>
              console.log("backup catch")
            );
          }
          debug("lanzo main");
          return this.DB.main.models.Message.create({ destination, message, uuidLock }).then(
            databaseMessage => {
              return Promise.resolve({ databaseMessage, oldCredit: credit });
              console.log("backup");
            }
          );
        } else if (uuidLock === false) {
          return Promise.reject({ message: `There's no credit` });
        }
      })
      .catch(error => {
        debug("haveCredit:catch", error);
        return Promise.reject({ message: error.message });
      });
  }

  confirmMessage(uuidLock) {
    debug("confirmMessage", uuidLock);
    if (this.isConnect(this.DB.backup)) {
      this.DB.backup.models.Message.findOneAndUpdate(
        { uuidLock },
        { state: { delivery: "confirmed" } }
      );
    }
    return this.DB.main.models.Message.findOneAndUpdate(
      { uuidLock },
      { state: { delivery: "confirmed" } }
    );
  }

  notSentMessage(uuidLock) {
    if (this.isConnect(this.DB.backup)) {
      this.DB.backup.models.Message.findOneAndUpdate(
        { uuidLock },
        { state: { delivery: "not_sent" } }
      );
    }
    return this.DB.main.models.Message.findOneAndUpdate(
      { uuidLock },
      { state: { delivery: "not_sent" } }
    );
  }

  confirmMessagePayment(uuidLock) {
    debug("confirmMessagePayment", uuidLock);
    if (this.isConnect(this.DB.backup)) {
      this.DB.backup.models.Message.findOneAndUpdate(
        { uuidLock },
        { state: { payment: "confirmed" } }
      );
    }
    return this.DB.main.models.Message.findOneAndUpdate(
      { uuidLock },
      { state: { payment: "confirmed" } }
    );
  }

  notPayedMessage(uuidLock) {
    if (this.isConnect(this.DB.backup)) {
      this.DB.backup.models.Message.findOneAndUpdate(
        { uuidLock },
        { state: { payment: "not_payed" } }
      );
    }
    return this.DB.main.models.Message.findOneAndUpdate(
      { uuidLock },
      { state: { payment: "not_payed" } }
    );
  }

  getSentMessages() {
    if (this.isConnect(this.DB.backup)) {
      this.DB.backup.models.Message.find();
    }
    return this.DB.main.models.Message.find();
  }

  haveCredit() {
    return this.lock()
      .then(({ credit, uuidLock }) => {
        debug("findCredit", credit);
        if (credit == null) return Promise.reject({ message: "Locked credit" });
        debug("findCredit:balance", credit.balance);
        if (credit.balance > 0) {
          return Promise.resolve({ credit, uuidLock });
        }
        this.unlock();
        return Promise.resolve({ credit: false, uuidLock });
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
    const options = { project: { lock: 1, balance: 1 } };
    debug("Try lock");
    if (this.isConnect(this.DB.backup)) {
      return Promise.all([
        this.DB.main.models.Credit.findOneAndUpdate(queryLock, updateLock, options),
        this.DB.backup.models.Credit.findOneAndUpdate(queryLock, updateLock, options)
      ]).then(locks => Promise.resolve({ credit: locks[0], uuidLock: uuid }));
    }
    return this.DB.main.models.Credit.findOneAndUpdate(queryLock, updateLock, options).then(lock =>
      Promise.resolve({ credit: lock, uuidLock: uuid })
    );
  }

  unlock() {
    debug("unlock");
    if (this.isConnect(this.DB.backup)) {
      this.DB.backup.models.Credit.findOneAndUpdate(
        { lock: { $ne: "" } },
        { lock: "" },
        { new: true }
      );
    }
    this.DB.main.models.Credit.findOneAndUpdate(
      { lock: { $ne: "" } },
      { lock: "" },
      { new: true }
    ).then(() => debug("unlock"));
  }

  increaseCredit(amount) {
    let query = { balance: { $ne: null } };
    let update = { $inc: { balance: amount } };
    let returnNew = { new: true, upsert: true };
    if (this.isConnect(this.DB.backup)) {
      return Promise.all([
        this.DB.main.models.Credit.findOneAndUpdate(query, update, returnNew),
        this.DB.backup.models.Credit.findOneAndUpdate(query, update, returnNew)
      ]).then(balances => Promise.resolve(balances[0]));
    }
    return this.DB.main.models.Credit.findOneAndUpdate(query, update, returnNew);
  }

  pay(uuidLock) {
    debug("pay");
    let query = { lock: uuidLock };
    let update = { $inc: { balance: -1 } };
    let returnNew = { new: true };
    // if (this.isConnect(this.DB.backup)) {
    if (true) {
      return Promise.all([
        this.DB.main.models.Credit.findOneAndUpdate(query, update, returnNew),
        this.DB.backup.models.Credit.findOneAndUpdate(query, update, returnNew)
      ]).then(credits => Promise.resolve(credits[0]));
    }
    return this.DB.main.models.Credit.findOneAndUpdate(query, update, returnNew);
  }
  payRollback(object) {
    debug("payRollback", object);
    object.markModified();
    return object.save();
  }

  manageReplica() {}
}

module.exports = DbMessageApp;
