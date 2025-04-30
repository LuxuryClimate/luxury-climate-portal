const fetch = require('node-fetch');
const admin = require('firebase-admin');
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
const { Storage } = require('@google-cloud/storage');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "YOUR_FIREBASE_STORAGE_BUCKET"
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

    // Handle file requests
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
    const token = 'b1e2512541214c1980aa9fe442f5844a'; // Consider using environment variables

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