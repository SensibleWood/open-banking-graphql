const fs = require('fs');
const argv = require('yargs') // eslint-disable-line
  .describe('input', 'Source API specification')
  .describe('template', 'Template to provide Query types')
  .describe('rootInterface', 'Name of object that provides the root type definition')
  .describe('filter', 'Filter for object names')
  .describe('output', 'Target GraphQL schema')
  .demandOption(['input', 'template', 'rootInterface', 'output'])
  .argv;

const SwaggerToGraphQL = require('../lib/converters/swagger');

const swagger = JSON.parse(fs.readFileSync(argv.input, 'utf8'));
const template = fs.readFileSync(argv.template, 'utf8');

const fullSchema = SwaggerToGraphQL({ swagger, template, rootInterface: argv.rootInterface });
const schema = fullSchema.renderAll(argv.filter || '');

fs.writeFileSync(argv.output, schema);

// '^((?!(OBRead.*|Links|Meta|OBRisk2|OBError.*)))'
