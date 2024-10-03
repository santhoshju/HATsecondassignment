const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Client } = require('@elastic/elasticsearch');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

const client = new Client({ node: 'http://localhost:9200' });

app.get('/api/employees', async (req, res) => {
  const searchTerm = req.query.q;

  try {
    let body;

    if (searchTerm) {
      console.log('Search term:', searchTerm);
      body = await client.search({
        index: 'employees',
        body: {
          query: {
            multi_match: {
              query: searchTerm,
              fields: ['FullName', 'Department'], 
              type: 'phrase_prefix'
            }
          }
        }
      });
    } else {
      
      console.log('Fetching all employees');
      body = await client.search({
        index: 'employees',
        body: {
          query: {
            match_all: {}
          }
        }
      });
    }

    
    if (body && body.hits && body.hits.hits.length > 0) {
        console.log(body,'00000')
      const employees = body.hits.hits.map(hit => hit._source);
      console.log('Employees found:', employees);
      res.json(employees);
    } else {
      console.error('No employees found or unexpected response structure:', body);
      res.status(404).json({ message: 'No employees found' });
    }
  } catch (error) {
    console.error('Elasticsearch error:', error);
    if (error.meta && error.meta.body) {
      console.error('Elasticsearch response:', error.meta.body);
    }
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
