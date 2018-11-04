const debug = require("debug")("debug:MessageApp");

const MESSAGE_APP = process.env.MESSAGE_APP || 'localhost'
const MESSAGE_APP_PORT = process.env.MESSAGE_APP_PORT || 3000
const DATABASE = process.env.DATABASE || 'mongodb'
const DATABASE_PORT = process.env.DATABASE_PORT || '27017'

const axios = require("axios").create({
  baseURL: `http://${MESSAGE_APP}:${MESSAGE_APP_PORT}/message`,
  timeout: 3000
});

const DbMessageApp = require("../databaseClient");
const dataBase = new DbMessageApp('','',DATABASE,DATABASE_PORT);
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
        debug("axios:error", error);
        return Promise.reject(error);
      });
  }

  getSentMessages() {
    return dataBase.getSentMessages()
      .catch(error => {
        debug("getSentMessages:error", error);
        return Promise.reject(error);
      })
  }

  send({ destination, message }) {
    let error = stringValidation(destination, 50);
    if (error) {
      return Promise.resolve({
        ok: false,
        message: error
      });
    }
    error = stringValidation(message, 200);
    if (error) {
      return Promise.resolve({
        ok: false,
        message: error
      });
    }
  
    return dataBase
      .createMessage({ destination, message })
      .then(databaseMessage => {
        debug("createMessage:ok:", databaseMessage);
        const { messageId } = databaseMessage;
        // dataBase.addMessageBackup(messageId,"not_confirmed");
        return this.sendMessage({ destination, message })
          .then(ok => {
            debug("sendMessage:ok: ", ok);
            // dataBase.addMessageBackup(messageId, "confirmed");
            return dataBase.confirmMessage(messageId).then(() => {
              // dataBase.deleteMessageBackup(messageId);
              return Promise.resolve({
                message: "Message sent and confirmed"
              });
            });
          })
          .catch(error => {
            debug("sendMessage:error: ", error.message);
            if (error.code == "ECONNABORTED") {
              // dataBase.addMessageBackup(messageId, "not_sent");
              return dataBase.notSentMessage(messageId).then(() => {
                // dataBase.deleteMessageBackup(messageId);
                return Promise.resolve({
                  message: "Message sent but not confirmed"
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
  
}

module.exports = new MessageApp();
