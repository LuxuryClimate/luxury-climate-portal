const fetch = require('node-fetch');

module.exports = async (req, res) => {
  const { path, ...params } = req.query;
  const url = `https://api.housecallpro.com/v1/${path}?${new URLSearchParams(params).toString()}`;
  const token = 'b1e2512541214c1980aa9fe442f5844a'; // Your API token

  try {
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
    res.status(500).json({ error: error.message });
  }
};