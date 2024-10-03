const fs = require('fs');
const { Client } = require('@elastic/elasticsearch');
const csv = require('csv-parser');
const moment = require('moment'); 
require('dotenv').config();

const client = new Client({ node: process.env.ELASTICSEARCH_NODE });


async function createIndexAndIndexData() {
  const indexName = 'employees'; 

  try {
    
    await client.indices.create({
      index: indexName,
      body: {
        mappings: {
          properties: {
            EmployeeID: { type: 'integer' },
            Name: { type: 'text' },
            JobTitle: { type: 'text' },
            Department: { type: 'text' },
            BusinessUnit: { type: 'text' },
            Gender: { type: 'text' },
            Ethnicity: { type: 'text' },
            Age: { type: 'integer' },
            HireDate: { type: 'date', format: 'MM/dd/yyyy||strict_date_optional_time' },
            AnnualSalary: { type: 'float' },
            BonusPercentage: { type: 'float' },
            Country: { type: 'text' },
            City: { type: 'text' },
            ExitDate: { type: 'date', format: 'MM/dd/yyyy||strict_date_optional_time' },
          },
        },
      },
    });
    console.log(`Index "${indexName}" created successfully.`);
  } catch (error) {
    if (error.meta.statusCode === 400) {
      console.log(`Index "${indexName}" already exists.`);
    } else {
      console.error('Error creating index:', error);
      return;
    }
  }

  const employees = [];
  fs.createReadStream('Employee Sample Data 1.csv')
    .pipe(csv())
    .on('data', (row) => {
      employees.push({
        EmployeeID: parseInt(row['Employee ID']),
        Name: row['Full Name'],
        JobTitle: row['Job Title'],
        Department: row['Department'],
        BusinessUnit: row['Business Unit'],
        Gender: row['Gender'],
        Ethnicity: row['Ethnicity'],
        Age: parseInt(row['Age']),
        HireDate: moment(row['Hire Date'], 'MM/DD/YYYY').toISOString(), 
        AnnualSalary: parseFloat(row['Annual Salary']),
        BonusPercentage: parseFloat(row['Bonus %']),
        Country: row['Country'],
        City: row['City'],
        ExitDate: row['Exit Date'] ? moment(row['Exit Date'], 'MM/DD/YYYY').toISOString() : null, 
      });
    })
    .on('end', async () => {
      try {
        for (const employee of employees) {
          await client.index({
            index: indexName,
            body: employee,
          }).catch((error) => {
            console.error('Error indexing employee:', employee.Name, error);
          });
          console.log(`Indexed employee: ${employee.Name}`);
        }
        console.log('CSV file successfully processed. Finalizing index.');
        await client.indices.refresh({ index: indexName }); 
        console.log(`Indexing completed for index "${indexName}".`);

        
        await fetchAndLogAllEmployees(indexName);
      } catch (error) {
        console.error('Error during indexing:', error);
      }
    });
}


async function fetchAndLogAllEmployees(indexName) {
  try {
    const { body } = await client.search({
      index: indexName,
      body: {
        query: {
          match_all: {}
        }
      }
    });

    
    if (body && body.hits) {
      if (body.hits.hits.length > 0) {
        console.log('All employees:');
        body.hits.hits.forEach(hit => {
          console.log(hit._source); 
        });
      } else {
        console.log('No employees found.');
      }
    } else {
      console.log('Unexpected response format:', body);
    }
  } catch (error) {
    console.error('Error fetching employees:', error);
  }
}


createIndexAndIndexData().catch(console.error);
