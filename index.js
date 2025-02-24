const express = require("express");
const path = require("path");
const cookieParser = require('cookie-parser')
const fs = require("fs");

const app = express();
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public"), {extensions: ["css","js"]}));
app.use(express.static(path.join(__dirname, "media"), {extensions: ["gif","jpg", "png"]}));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.listen(8000, (err) =>{
	if(err) throw err;
	console.log("Server has started. Port 8000");
});

app.get("/", (req,res) =>{
	var username = req.cookies.username;
	res.render("homePage", {
		username: username,
		pageType: "homePage"
	})
//	res.sendFile("homePageStyle.css", { root: path.join(__dirname, "public") })
});

app.get("/contact", (req,res) =>{
	var username = req.cookies.username;
	res.render("contactPage", {
		username: username,
		pageType: "contactPage"
	})
});

app.get("/packages", (req,res) =>{
	var username = req.cookies.username;
	var mysql = require('mysql');
	var con = mysql.createConnection({
		host: "localhost",
		user: "traveldbadmin",
		password: "tdba123",
		database: "travelexperts"
	});
	con.connect(function(err) {
		if (err) throw err;
		var querytext = "SELECT * FROM packages;"
		con.query(querytext, function (err, result, fields) {
			if (err) throw err;			
			res.render("vp", {
				username: username,
				pageType: "G2_Vacationpackage",
				packages: result
			});
		});
	});
});

app.get("/registration", (req,res) =>{ 
	var username = req.cookies.username;
	res.render("custregister", {
		username: username,
		usernameError: false,
		pageType: "custregister"
	})
});

app.get("/profile", (req,res) =>{ 
	var username = req.cookies.username;
	var FirstName = req.cookies.FirstName;
	var LastName = req.cookies.LastName;
	if(username){
		var finalpackages = []
		var mysql = require('mysql');
		var con = mysql.createConnection({
		host: "localhost",
		user: "traveldbadmin",
		password: "tdba123",
		database: "travelexperts"
		});
		con.connect(function(err) {
			if (err) throw err;
			var querytext = "SELECT PackageId FROM simplebookings WHERE CustomerId = '"+username+"'";
			con.query(querytext, function (err, result, fields) {
				if (err) throw err;
				if(!result.length){
					res.render("profilePage", {
						username: username,
						pageType: "profilePage",
						FirstName: FirstName,
						LastName: LastName,
						availablePackages : finalpackages
					})
					res.end();
					return;
				}
				for(var i=0; i < result.length; i++){
					var i2 = 0
					querytext = "SELECT * FROM packages WHERE PackageId = '"+result[i].PackageId+"'";
					con.query(querytext, function (err2, result2, fields2) {
						i2++
						if (err2) throw err2;
						finalpackages.push(result2)
						if(i2==result.length){
							res.render("profilePage", {
								username: username,
								pageType: "profilePage",
								FirstName: FirstName,
								LastName: LastName,
								availablePackages : finalpackages
							})
							res.end();
							return;
						}
					})
					
				}
			});
		})
		
	}else{
		res.redirect("/registration");
		res.end();
	}
});

app.post("/logout", (req, res)=>{
	res.clearCookie("username");
	res.clearCookie("FirstName");
	res.clearCookie("LastName");
	res.redirect("/");
	res.end();
})

app.post("/login", (req, res)=>{
	var tryUsername = req.body.tUsername;
	var tryPassword = req.body.tPassword;
	var mysql = require('mysql');
	var con = mysql.createConnection({
	host: "localhost",
	user: "traveldbadmin",
	password: "tdba123",
	database: "travelexperts"
	});
	con.connect(function(err) {
		if (err) throw err;
		var querytext = "SELECT CustFirstName, CustLastName FROM customers WHERE CustUsername = '"+tryUsername+"' AND CustPassword = '"+tryPassword+"'";
		con.query(querytext, function (err, result, fields) {
			if (err) throw err;
			if(!result.length){
				res.redirect(req.get('referer'));
				res.end();
				return false;
			} else{
				var queryResult = result[0];
				res.cookie("username", tryUsername);
				res.cookie("FirstName", queryResult.CustFirstName);
				res.cookie("LastName", queryResult.CustLastName);
				res.redirect("/profile");
				res.end();
				return true;
			}
		});
	})
	
})

app.post("/registration", (req, res)=>{
	var username = req.cookies.username;
	var tryUsername = req.body.Username;
	var mysql = require('mysql');
	var con = mysql.createConnection({
	host: "localhost",
	user: "traveldbadmin",
	password: "tdba123",
	database: "travelexperts"
	});
	var validUsername = false;
	con.connect(function(err) {
		if (err) throw err;
		var querytext = "SELECT CustomerId FROM customers WHERE CustUsername = '"+tryUsername+"'";
		con.query(querytext, function (err, result, fields) {
			if (err) throw err;
			if(!result.length){
				validUsername = true;
			} else{
				validUsername = false;
			}
			
			if(validUsername){
				querytext = "INSERT INTO customers (CustFirstName, CustLastName, CustAddress, CustCity, CustProv, CustPostal, CustCountry, CustHomePhone, CustBusPhone, CustEmail, CustUsername, CustPassword) VALUES ('";
				querytext += req.body.FirstName+"', '"+req.body.LastName+"', '"+req.body.StreetAddress+"', '"+req.body.City+"', '"+req.body.Province+"', '"+req.body.PostalCode+"', '"+"Canada"+"', '"+req.body.PhoneNumber+"', '"+req.body.BusinessPhone+"', '"+req.body.Email+"', '"+req.body.Username+"', '"+req.body.Password+"')";
				con.query(querytext, function (err, result, fields) {
				if (err) throw err;
				});
				res.cookie("username", req.body.Username)
				res.cookie("FirstName", req.body.FirstName)
				res.cookie("LastName", req.body.LastName)
				res.redirect("/profile")
				res.end()
				return true
			}else{
				res.render("custregister", {
					usernameError: true,
					pageType: "custregister",
					username: username
				})
				res.end()
				return false
			}

		});
	
	})
})


app.post("/packages", (req, res)=>{
	var username = req.cookies.username;
	var packageId = req.body.packageId;
	var mysql = require('mysql');
	var con = mysql.createConnection({
		host: "localhost",
		user: "traveldbadmin",
		password: "tdba123",
		database: "travelexperts"
	});
	con.connect(function(err) {
		if (err) throw err;
		var querytext = "SELECT * FROM packages WHERE PackageId = '"+packageId+"'";
		con.query(querytext, function (err, result, fields) {
			if (err) throw err;			
			if(!result.length){
				console.log("no package found"+packageId)
				res.redirect(req.get('referer'));
				res.end();
				return false;
			} else{
				var queryResult = result[0];
				res.render("orderPage", {
					pageType: "orderPage",
					username: username,
					package: queryResult
				})
				res.end();
				return true;
			}
		});
	});
})

app.post("/orderPage", (req, res)=>{
	var username = req.cookies.username;
	var packageId = req.body.packageId;
	var mysql = require('mysql');
	var con = mysql.createConnection({
		host: "localhost",
		user: "traveldbadmin",
		password: "tdba123",
		database: "travelexperts"
	});
	con.connect(function(err) {
		if (err) throw err;
		var querytext = "INSERT INTO simplebookings (CustomerId, PackageId) VALUES ('";
		querytext += username+"', '"+packageId+"')";
		con.query(querytext, function (err, result, fields) {
			if (err) throw err;
			res.redirect("/profile");
			res.end();
			return true;
		});
	});	
})

/** 
app.use((req,res, next) =>{
	res.status(404);
	res.sendFile("404.html", { root: path.join(__dirname, "views") })
	res.sendFile("styles.css", { root: path.join(__dirname, "public")})
});
*/