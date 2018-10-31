const axios = require("axios").create({
  baseURL: "localhost:9001"
});
class TestClient {
  send(verb,path,body) {
    return axios[verb](path, body)
      .then(response => {
        console.log("ok",response,data)
      })
      .catch(error => {
        let data;
        data = error.response == undefined ? error : error.response.data;
        console.log("error")
      });
  }
}

module.exports = new TestClient();
