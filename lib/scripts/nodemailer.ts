import nodemailer from "nodemailer";
import hbs, {
  NodemailerExpressHandlebarsOptions, //Handlebar types for typescript
} from "nodemailer-express-handlebars";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

export default function mailer(
  name: string,
  link: string,
  receiver: string,
  subject: string
) {
  //TRANSPORT
  let transport = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    auth: {
      user: "hatirlatsana@gmail.com",
      pass: process.env.EMAIL_USER_PASSWORD,
    },
  });
  //handlebars opt.
  const handlebarOptions: NodemailerExpressHandlebarsOptions = {
    viewEngine: {
      partialsDir: path.resolve("./lib/handlebars/"),
      defaultLayout: false,
    },
    viewPath: path.resolve("./lib/handlebars/"),
  };
  //Middleware for handlebar
  transport.use("compile", hbs(handlebarOptions));
  //Mail Opts.
  const mailOptions = {
    from: "hatirlatsana@gmail.com",
    to: receiver, // List of recipients
    subject: subject, // Subject line
    template: "email", // the name of the template file i.e email.handlebars
    context: {
      name: name,
      link: link,
    },
  };
  //Send Mail
  transport.sendMail(mailOptions, function (err, info) {
    if (err) {
      console.log(err);
    } else {
      console.log(info);
    }
  });
}
