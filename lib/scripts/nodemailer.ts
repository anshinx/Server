import nodemailer from "nodemailer";
import hbs, {
  NodemailerExpressHandlebarsOptions,
} from "nodemailer-express-handlebars";
import path from "path";

export default function mailer(
  name: string,
  link: string,
  receiver: string,
  subject: string,
) {
  let transport = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    auth: {
      user: "yenersg.58@gmail.com",
      pass: "uipttxtgssuadxxv",
    },
  });

  const handlebarOptions: NodemailerExpressHandlebarsOptions = {
    viewEngine: {
      partialsDir: path.resolve("./lib/handlebars/"),
      defaultLayout: false,
    },
    viewPath: path.resolve("./lib/handlebars/"),
  };

  transport.use("compile", hbs(handlebarOptions));

  const mailOptions = {
    from: "yenersg.58@gmail.com", // Sender address
    to: receiver, // List of recipients
    subject: subject, // Subject line
    template: "email", // the name of the template file i.e email.handlebars
    context: {
      name: name, // replace {{name}} with Adebola
      link: link // replace {{company}} with My Company
    },
  };

  transport.sendMail(mailOptions, function (err, info) {
    if (err) {
      console.log(err);
    } else {
      console.log(info);
    }
  });
}
