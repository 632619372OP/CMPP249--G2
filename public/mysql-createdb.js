var mysql = require('mysql');

var con = mysql.createConnection({
  host: "localhost",
  user: "harv",
  password: "password"
});

con.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
  con.query("CREATE DATABASE travelexperts", function (err, result) {
    if (err) throw err;
    console.log("Database created");
  });
});