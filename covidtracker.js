const fetch = require("node-fetch");
const nodemailer = require("nodemailer");

const gmailAddress = "";
const gmailAppPassword = "";
const txtMessageEmailAddress = "";

var transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: gmailAddress,
    pass: gmailAppPassword,
  },
});

var mailOptions = {
  from: gmailAddress,
  to: txtMessageEmailAddress,
  subject: "COVID Vaccine Update",
  text: "",
};

async function getData() {
  response = await fetch(
    "https://mzqsa4noec.execute-api.us-east-1.amazonaws.com/prod"
  );
  if (response.ok) {
    jsonData = await response.json();

    bodyData = JSON.parse(jsonData.body);
    locations = bodyData.results;

    // Get rid of old data
    const oldTimestamp = new Date() - 60 * 60 * 1000;
    console.log(oldTimestamp);
    filteredData = locations.filter(
      (item) => !item.timestamp || new Date(item.timestamp) >= oldTimestamp
    );

    //filteredData = locations;

    // This could be much better.  Save an array above
    // then look through that
    acceptableSites = filteredData.filter((item) => {
      return (
        (item.city === "Hudson" ||
          item.city === "Maynard" ||
          item.city === "Natick" ||
          item.city === "Sudbury" ||
          item.city === "Wayland" ||
          item.city === "Southborough" ||
          item.city === "Westborough" ||
          item.city === "Northborough" ||
          item.city === "Marlborough") &&
        item.hasAvailability === true
      );
    });
    if (acceptableSites.length > 0) {
      var sMessage = "Availability at: \n\n";
      acceptableSites.forEach((element) => {
	console.log(element);
        sMessage +=
          "[" +
          element.city +
          "] as of " +
          element.timestamp +
          "  Signup link: " +
          element.signUpLink +
          "\n\n";
      });
      sMessage += "Script run at " + Date();
      console.log(sMessage);
      mailOptions.text = sMessage;
      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log(error);
        } else {
          console.log("Email sent: " + info.response);
        }
      });
    } else {
      console.log("None available");
    }
    setTimeout(getData, 120000);
  } else {
    console.log("Exitting bad response" + response);
  }
}

getData();

