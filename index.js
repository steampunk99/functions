const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
require("cors")({ origin: true });

admin.initializeApp();

const db = admin.firestore();

// Twilio credentials
const accountSid = 'AC4769704fa53d75b5d54fa0f6f469fbc2';
const authToken = '580a30caacac3efaf7c0d01bc1b63fe4';
const client = require('twilio')(accountSid, authToken);

const transporter = nodemailer.createTransport({
    host: "smtp-mail.outlook.com",
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
      user: "bonnie.lou23@outlook.com",
      pass: "Riddickluke987",
    }
  });

exports.sendUploadEmailNotification = functions.firestore
  .document('uploads/{documentName}')
  .onCreate(async (snap) => {

    const newUpload = snap.data();

    const mailOptions = {
      from:"bonnie.lou23@outlook.com",
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

//filtering  uploads
exports.filterUploads = functions.https.onCall(async (data, context)=>{

  //check auth status
  if(!context.auth){
    throw new functions.https.HttpsError('unauthenticated', 'User is not authenticated');
  }

  try {
    const uploadsRef = admin.firestore.collection('uploads');
    let query = uploadsRef;

    if(data.companyName){
      query = query.where('companyName', '==', data.companyName);
    } 
    if (data.department) {
      query = query.where('department', '==', data.department);
    }
    if (data.status) {
      query = query.where('status', '==', data.status);
    }
    if (data.date) {
      query = query.where('date', '==', data.date);
    }

    const snapshot = await query.get();
    const uploads = snapshot.docs.map(doc => doc.data());

    return { uploads };
  }
  catch (error) {}
})

//filter users
exports.filterUsers = functions.https.onCall(async (data, context)=>{
    //check auth status
    if(!context.auth){
      throw new functions.https.HttpsError('unauthenticated', 'User is not authenticated');
    }

    try{
      const usersRef = admin.firestore.collection('users')
      const query = usersRef;

      
    if (data.department) {
      query = query.where('department', '==', data.department);
    }
    if (data.companyName) {
      query = query.where('companyName', '==', data.companyName);
    }
    if (data.role) {
      query = query.where('role', '==', data.role);
    }

    const snapshot = await query.get();
    const users = snapshot.docs.map(doc => doc.data());
    return { users };
    }catch(error){}
})