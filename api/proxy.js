const fetch = require('node-fetch');
const admin = require('firebase-admin');

// Replace escaped newlines with actual newlines
const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT.replace(/\\n/g, '\n');
const serviceAccount = JSON.parse(serviceAccountString);

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'luxury-climate-portal.appspot.com'
});

const storage = admin.storage();

module.exports = async (req, res) => {
  try {
    // Verify Firebase Authentication token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
    }

    const idToken = authHeader.split('Bearer ')[1];
    await admin.auth().verifyIdToken(idToken);

    // Handle file requests (e.g., CSV from Storage)
    if (req.query.file) {
      const filename = req.query.file;
      const file = storage.bucket().file(filename);
      const [exists] = await file.exists();

      if (!exists) {
        return res.status(404).json({ error: `File ${filename} not found` });
      }

      const [data] = await file.download();
      res.setHeader('Content-Type', 'text/csv');
      res.status(200).send(data);
      return;
    }

    // Handle Housecall Pro API requests
    const { path, ...params } = req.query;
    const url = `https://api.housecallpro.com/v1/${path}?${new URLSearchParams(params).toString()}`;
    const token = 'b1e2512541214c1980aa9fe442f5844a';

    const response = await fetch(url, {
      method: req.method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: req.method === 'POST' ? JSON.stringify(req.body) : undefined,
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Error in proxy:', error.message);
    res.status(500).json({ error: error.message });
  }
};