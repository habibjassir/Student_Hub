const express = require("express");
const fs = require('fs');
const path = require('path');
const server = express();

const DATABASE = path.join(__dirname, "database.json");

console.log(DATABASE);

server.use(express.json());
//Here I will receive request and responses
server.use("/login", function login(request, responses){
   
} )

//Run the server
server.listen(3000, function run(){
    console.log("Server is running @Port 3000");
});




Post
Get
Delete