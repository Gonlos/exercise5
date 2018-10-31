const TestClient = require('./testClient').send

TestClient("post","/message",{destination:"a",message:"a"})
TestClient("post","/other",{destination:"a",message:"a"})
TestClient("get","/other",{destination:"a",message:"a"})
TestClient("get","/message",{destination:"a",message:"a"})
TestClient("post","/message","")
TestClient("post","/message")
TestClient("post","/message","a")
TestClient("post","/message",'{"a":a}')
TestClient("post","/message",'{"destination":0,"message":"a"}')
TestClient("post","/message",'{"destination":"a" "message":"a"}')
TestClient("post","/message",{destination:"a",message:"a",other:"a"})
TestClient("post","/message",{destination: "console.log(\"hola\")" ,message:"a",other:"a"})

let destination=""
for(let i=0 ; i<500;i++){
  destination+="aaaa"
}
TestClient("post","/message",{destination,message:"a"})

for(let i=0 ; i<500;i++){
  destination+="aaaa"
}
TestClient("post","/message",{destination,message:"a"})

for(let i=0 ; i<500;i++){
  destination+="aaaa"
}
TestClient("post","/message",{destination,message:"a"})
