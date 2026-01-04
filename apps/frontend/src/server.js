const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const app = express();

app.use(cors());
app.use(express.json());

app.post('/write-file', (req, res) => {
  const { content, filename } = req.body;
  const filePath = path.join(__dirname, filename);

  fs.writeFile(filePath, content, { flag: 'a' }, (err) => {
    if (err) {
      console.error('Error writing file:', err);
      return res.status(500).send('Failed to write file');
    }
    res.send('File written successfully!');
  });
});

app.get('/winners', (req, res) => {
  const filePath = path.join(__dirname, 'winners.csv');
  let lastRank = 0;
  const winners = [];

  fs.createReadStream(filePath) 
  .pipe(csv({
    headers: ['rank', 'prizeLevel', 'prizeName', 'role', 'department', 'employeeId', 'name'],
  }))
  .on('data', (row) => {
    const rank = parseInt(row['rank'], 10);

    if (rank > lastRank) {
      lastRank = rank;
    }

    winners.push({
      department: row['department'],
      employeeId: row['employeeId'],
      name: row['name'],
      role: row['role'] === '資深組' ? 0 : 1,
      prize: row['prizeName'],
    });
  })
  .on('end', () => {
    res.send({
      lastRank,
      winners,
    });
  });
});

app.listen(5566, () => {
  console.log('Server running on http://localhost:5566');
});
