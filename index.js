const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
require("cors")({ origin: true });

admin.initializeApp();

const db = admin.firestore();

// Twilio credentials
const accountSid = process.env.accountSid
const authToken = process.env.authToken
const client = require('twilio')(accountSid, authToken);

const transporter = nodemailer.createTransport({
    host:process.env.host ,
    port: process.env.port,
    secure: false,
    requireTLS: true,
    auth: {
      user:process.env.username ,
      pass:process.env.password ,
    }
  });

exports.sendUploadEmailNotification = functions.firestore
  .document('uploads/{documentName}')
  .onCreate(async (snap) => {

    const newUpload = snap.data();

    const mailOptions = {
      from:process.env.username,
      to: "luk23bonnie8@gmail.com",  
      subject: "New Document Uploaded",
      text: `A new document has been uploaded: ${newUpload.documentName}`, 
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log("Email sent successfully");
    } catch (error) {  
      console.error("Error sending email", error);  
    }

    
 });

 exports.sendWhatsappNotification = functions.firestore
 .document('uploads/{documentName}')
 .onCreate(async (snap) => {
    const newUpload = snap.data();
    const message = `A new document has been uploaded: ${newUpload.documentName}`;
    await client.messages.create({
        body: message,
        from:'whatsapp:+14155238886',
        to: 'whatsapp:+256782443845'
    });
    console.log("Whatsapp notification sent successfully");
    return message; 
 
 })

 //document status change
 exports.DocStatusChangeNotification = functions.firestore
 .document('uploads/{documentName}')
 .onUpdate(async (change, context) => {

  const newStatus = change.after.data().status;
  const previousStatus = change.before.data().status;

  if(newStatus !== previousStatus){
    
    const whatsappOptions = {
      body: `Document status changed from ${previousStatus} to ${newStatus}`,
      from:'whatsapp:+14155238886',
      to: 'whatsapp:+256782443845'
    }

    const mailOptions = {
      from:"bonnie.lou23@outlook.com",
      to: "luk23bonnie8@gmail.com",  
      subject: "Document Status Change",
      text: `Document status changed from ${previousStatus} to ${newStatus}`,
    }
    return transporter.sendMail(mailOptions)
    .then(() => {
      return console.log("Email sent successfully");
    })
    .catch((error) => {
      return console.error("Error sending email", error);  
    
    })
 }
})

// Filter uploads 
exports.filterUploads = functions.https.onRequest(async (req, res) => {

  try {

    const uploadsRef = admin.firestore().collection('uploads');

    let query = uploadsRef;

    if(req.query.companyName){   
      query = query.where('companyName', '==', req.query.companyName);
      console.log(req.query.companyName)
    }

    if (req.query.department) {
      query = query.where('department', '==', req.query.department);
      console.log(req.query.department)
    }

    if (req.query.status) {
      query = query.where('status', '==', req.query.status);
      console.log(req.query.status)
    }

    if (req.query.date) {
      query = query.where('date', '==', req.query.date);
      console.log(req.query.date)
    }

    const snapshot = await query.get();

    console.log('Number of user uploads found:', snapshot.size);

    const uploads = snapshot.docs.map(doc => doc.data());
    
    res.json({uploads});

  } catch (error) {
    res.status(500).send(error); 
  }

});


// Filter users
exports.filterUsers = functions.https.onRequest(async (req, res) => {

  try {

    const usersRef = admin.firestore().collection('users');

    let query = usersRef;

    if (req.query.department) {
      query = query.where('department', '==', req.query.department);
      console.log(req.query.department)
    }

    if (req.query.companyName) {
      query = query.where('companyName', '==', req.query.companyName);
      console.log(req.query.companyName)
    }

    if (req.query.role) {
      query = query.where('role', '==', req.query.role);
      console.log(req.query.role)  
    }

    const snapshot = await query.get();

    console.log('Number of user docs found:', snapshot.size);

    const users = snapshot.docs.map(doc => doc.data());
    
    res.json({users});

  } catch (error) {
    res.status(500).send(error);
  }

});