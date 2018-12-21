const fs = require('fs');
const argv = require('yargs') // eslint-disable-line
  .describe('input', 'Source API specification')
  .describe('template', 'Template to provide Query types')
  .describe('rootInterface', 'Name of object that provides the root type definition')
  .describe('filter', 'Filter for object names')
  .describe('output', 'Target GraphQL schema')
  .demandOption(['input', 'template', 'rootInterface', 'output'])
  .argv;

const SwaggerToGraphQL = require('../lib/swagger-to-graphql');

fs.writeFileSync(
  argv.output,
  SwaggerToGraphQL({
    swagger: JSON.parse(fs.readFileSync(argv.input, 'utf8')),
    template: fs.readFileSync(argv.template, 'utf8'),
    rootInterface: argv.rootInterface,
  }).renderAll(argv.filter || ''),
);
