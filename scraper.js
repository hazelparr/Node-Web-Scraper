//requires for the npm modules used
var fs = require("fs");
var cheerio = require("cheerio");
var request = require('request');
var urlHelper = require('url');
var csv = require('fast-csv');
var moment = require('moment');

//declaring global variables
var csvStream = csv.createWriteStream({headers: true});
var date = moment().format("YYYY-MM-DD");
var rootURL = "http://shirts4mike.com/shirts.php";
var errorURL = "shirts4mike.com/shirts.php"; //used to test the error log

//checking if date folder exists, and make one if it doesn't
try {
    fs.accessSync("./data");
    console.log("data exists");
} catch (e) {
    console.log("data doesn't exists");
    fs.mkdirSync("./data");
}

// connecting to website
request( rootURL, function (error, response, body) {
  if (error || response.statusCode != 200) {
    //console.log(error.message);
    console.log("Sorry there was an error");
    errorLog(error);
  } else {
    readFrontPage(body);  
  }
});

//grabs the url link of the shirts from the front page
function readFrontPage(html) {
    var $ = cheerio.load(html);
    var shirtLinks = $(".products a").each(function(index, element){
        var relativeURL = $(element).attr("href");
        var url = urlHelper.resolve(rootURL, relativeURL);
        downloadProductPage(url);
    });
}

//function to go to each product page and scrape the data
function downloadProductPage(url) {
    console.log("We're about to download", url);
    request(url, function (error, response, body) {
      if (error || response.statusCode != 200) {
          errorLog(error);
        } else {
          readProductPage(body, url); 
        }
    });
}

//write to data scraped to csv file
csvStream.pipe(fs.createWriteStream("./data/" + date + ".csv"))

// reads each the price, title, url and imageurl from each page
function readProductPage(html, url) {
    var price, title, url, imageUrl; 
    var $ = cheerio.load(html);
    var price = $(".price").text();
    var title = $(".shirt-details h1").text().substr(price.length + 1);
    var relativeImageUrl = $(".shirt-picture img").attr("src");
    var imageUrl = urlHelper.resolve(url, relativeImageUrl);

    csvStream.write({
        Title: title,
        Price:  price,
        ImageURL: imageUrl,
        URL: url,
        Time: moment().format("HH:mm:ss")
    })
}

// creation of a log file for the errors
function errorLog(error) {
    console.log(error.message);
    var errorTime = moment().format("MMM-DD-YYYY HH:mm:ss");
    var errorMessage = error.message + " " + errorTime + "\n";

    fs.appendFile("scraper-error.log", errorMessage, function(error) {
        if (error) throw error;
    });
}


