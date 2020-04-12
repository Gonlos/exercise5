const debug = require("debug")("debug:MessageApp");

const MESSAGE_APP = process.env.MESSAGE_APP || "localhost";
const MESSAGE_APP_PORT = process.env.MESSAGE_APP_PORT || 3000;
const DATABASE = process.env.DATABASE || "localhost";
const DATABASE_PORT = process.env.DATABASE_PORT || 27017;

const axios = require("axios").create({
  baseURL: `http://${MESSAGE_APP}:${MESSAGE_APP_PORT}/message`,
  timeout: 3000
});

const DbMessageApp = require("../databaseClient");
const dataBase = new DbMessageApp("", "", DATABASE, DATABASE_PORT);

const isString = string => {
  return typeof string == "string";
};
const isEmpty = string => {
  return string === "";
};
const exceedMaxChar = (string, max) => {
  return string.length > max;
};
const stringValidation = (field, max) => {
  debug(field);
  if (!isString(field)) return "Must be String";
  if (isEmpty(field)) return "Must not be empty";
  if (exceedMaxChar(field, max)) return `Must have ${max} or less characters`;
  return "";
};
class MessageApp {
  sendMessage({ destination, message }) {
    debug("senMessage->", destination, message);
    return axios
      .post("/", { destination, body: message })
      .then(response => {
        debug("axios:ok", response.data);
        return Promise.resolve({
          message: response.data
        });
      })
      .catch(error => {
        debug("axios:error", error.message);
        return Promise.reject(error);
      });
  }

  getSentMessages() {
    return dataBase.getSentMessages().catch(error => {
      debug("getSentMessages:error", error);
      return Promise.reject(error);
    });
  }

  send({ destination, message }) {
    let error = stringValidation(destination, 50);
    if (error) {
      return Promise.resolve({
        message: error
      });
    }
    error = stringValidation(message, 200);
    if (error) {
      return Promise.resolve({
        message: error
      });
    }

    return dataBase
      .createMessage({ destination, message })
      .then(newMessage => {
        const { databaseMessage, oldCredit } = newMessage;
        debug("createMessage:ok:", databaseMessage, oldCredit);
        const uuidLock = databaseMessage.lock;
        return this.sendMessage({ uuidLock, destination, message })
          .then(ok => {
            let sendingIsConfirmed, paymentIsConfirmed;
            debug("sendMessage:ok: ", ok);
            dataBase
              .confirmMessage(uuidLock)
              .then(confirm => {
                debug("confirmMessage:ok", confirm);
                // return Promise.resolve(true);
              })
              .catch(() => {
                // return Promise.reject(false);
              });
            return dataBase
              .pay(uuidLock)
              .then(credit => {
                dataBase.unlock();
                debug("pay:ok", credit);
                dataBase.confirmMessagePayment(uuidLock);
                return Promise.resolve({ message: "Message sent and payed" });
              })
              .catch(error => {
                dataBase.payRollback(oldCredit).then(() => dataBase.unlock());
                debug("pay:catch", error);
                dataBase.notPayedMessage(uuidLock);
                return Promise.resolve({ message: "Message sent but not payed" });
              });
          })
          .catch(error => {
            debug("sendMessage:error: ", error.message);
            if (error.code == "ECONNABORTED") {
              return dataBase.notSentMessage(uuidLock).then(response => {
                debug("notSentMessage:ok:", response);
                return dataBase
                  .pay(uuidLock)
                  .then(credit => {
                    dataBase.unlock();
                    debug("pay:ok", credit);
                    dataBase.confirmMessagePayment(uuidLock);
                    return Promise.resolve({ message: "Message payed but sending not confirm" });
                  })
                  .catch(error => {
                    dataBase.payRollback(oldCredit).then(() => dataBase.unlock());
                    debug("pay:catch", error);
                    return Promise.resolve({
                      message: "Message sent but not confirm and not payed"
                    });
                  });
              });
            }
            return Promise.reject({
              message: `Message not sent`
            });
          });
      })
      .catch(error => {
        debug("createMessage:catch:", error.message);
        if (error.name) {
          error = { message: `Message not sent because it couldn't be saved` };
        }
        return Promise.reject(error);
      });
  }

  increaseCredit(amount) {
    return dataBase
      .increaseCredit(amount)
      .then(credit => Promise.resolve({ message: `Credit increased to ${credit.balance}` }))
      .catch(error => {
        debug("increaseCredit:error", error);
        return Promise.reject(error.message);
      });
  }
}

module.exports = new MessageApp();
