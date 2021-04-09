const fetch = require("node-fetch");
const nodemailer = require("nodemailer");
const {createLogger, format, transports} = require('winston');
const { combine, timestamp, label, printf } = format;

const myFormat = printf(({ level, message, label, timestamp }) => {
  return `${timestamp} ${level}: ${message}`;
});

const logger = createLogger({
  level: 'info',
  format: combine( timestamp(), myFormat),
  defaultMeta: { service: 'user-service' },
  transports: [
    //new transports.File({ filename: '/home/john/covid/covidtracker.log' }),
    new transports.Console( { format: format.simple() }),
  ],
});

// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
//
if (process.env.NODE_ENV !== 'production') {
  logger.add(new transports.Console({
    format: format.simple(),
  }));
}

var transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "john.reardon@gmail.com",
    pass: "qfctggqfntqwuyae",
  },
});

var mailOptions = {
  from: "john.reardon@gmail.com",
  to: "6177949974@tmomail.net",
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
    filteredData = locations.filter(
      (item) => !item.timestamp || new Date(item.timestamp) >= oldTimestamp
    );

    //filteredData = locations;

    acceptableSites = filteredData.filter((item) => {
      return (
        (item.city === "Hudson" ||
          item.city === "Maynard" ||
          item.city === "Concord" ||
          item.city === "Marlborough") &&
        item.hasAvailability === true
      );
    });
    if (acceptableSites.length > 0) {
      var sMessage = "Availability at: \n\n";
      acceptableSites.forEach((element) => {
        sMessage +=
          "[" +
          element.city +
          "] as of " +
          element.timestamp +
          "  Signup link: " +
          element.signUpLink +
          "\n\n";
      });
      sMessage += "Script run at" + Date();
      logger.info(sMessage);
      mailOptions.text = sMessage;
      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log(error);
        } else {
          // console.log("Email sent: " + info.response);
	  logger.info("Email sent: " + info.response);
        }
      });
    } else {
      // console.log("None available");
      logger.info("None available");
    }
    setTimeout(getData, 120000);
  } else {
    // console.log("Exitting bad response" + response);
    logger.error( "Exitting bad response: " + response);
  }
}

getData();

