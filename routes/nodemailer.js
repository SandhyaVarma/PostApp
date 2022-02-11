const nodemailer = require("nodemailer");
const {google} = require("googleapis");

const CLIENT_ID = `768378197113-o2hi26mgn9qph52e082tb1pi0o90gnr0.apps.googleusercontent.com`;
const CLIENT_SECRET = `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`;
const REDIRECT_URI = `https://developers.google.com/oauthplayground`;
const REFRESH_TOKEN = `1//042MThjRmfmnSCgYIARAAGAQSNwF-L9Ir8vzbHYRARPFlQW1dd3-MT8ly80-bvw9VYHK4sM-F1seD6fZHOJgalHyb9VcJF0PizCo`;

const oauthclient = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
oauthclient.setCredentials({refresh_token: REFRESH_TOKEN});

async function sendMail(receiver, text){ 
  try{
    const access_token = await oauthclient.getAccessToken();
    const transport = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: "OAuth2", 
        user:"varmasandhya2020@gmail.com",
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
        refreshToken: REFRESH_TOKEN,
        accessToken: access_token
      }
    })
    const mailOpts = {
      from: "varmasandhya2020@gmail.com",
      to: receiver,
      subject: "hello user",
      text: "Hey hey",
      html: text
    }

    const result =  await transport.sendMail(mailOpts);
    return result

  }
  catch(err){
    return err;
  }
}
module.exports = sendMail;