import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FB_PROJECT_ID,
      clientEmail: process.env.FB_CLIENT_EMAIL,
      privateKey: process.env.FB_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
    databaseURL: process.env.FB_DB_URL
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const { name, email } = req.body;

  if (!email.endsWith("iitm.ac.in")) {
    return res.status(403).json({ error: "Unauthorized email" });
  }

  const key = email.replace(/\./g, ",");

  await admin.database().ref(`registrations/${key}`).set({
    name,
    email,
    timestamp: Date.now()
  });

  res.json({ success: true });
}
