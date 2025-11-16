import axios from 'axios';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const response = await axios.post('https://hook.us2.make.com/fyext0qe7r45x69j2bkq6q9ic8qb26ta', req.body);
      res.status(200).json({ success: true, data: response.data });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ success: false, error: 'Failed to process the order.' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}


//"https://hook.us2.make.com/fyext0qe7r45x69j2bkq6q9ic8qb26ta"; // your Make webhook