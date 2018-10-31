const axios = require("axios").create({
  baseURL: `http://${process.env.MESSAGE_APP || "localhost"}:3000/message`
});
const isString = string => {
  return typeof string == "string";
};
const isEmpty = string => {
  return string === "";
};
const exceedMaxChar = (string,max) => {
  return string.length > max
}
const stringValidation = (field,max) => {
  console.log(field)
  if(!isString(field)) return "Must be String"
  if(isEmpty(field)) return "Must not be empty"
  if(exceedMaxChar(field,max)) return `Must have ${max} or less characters`
  return ""
}
class MessageApp {
  send({ destination, message }) {
    let error=stringValidation(destination,50)
    if (error){
      return Promise.resolve({
        status: 400,
        data: error
      })
    }
    error=stringValidation(message,200)
    if(error){
      return Promise.resolve({
        status: 400,
        data: error
      })
    }
  
    return axios
      .post("/", { destination, body:message })
      .then(response => {
        // console.log("ok",response)
        return {
          status: response.status,
          data: response.data
        };
      })
      .catch(error => {
        // console.log("error",error)
        let data;
        data = error.response == undefined ? error : error.response.data;
        return {
          status: 500,
          data
        };
      });
  }
}

module.exports = new MessageApp();
