const argv = require('yargs') // eslint-disable-line
  .describe('input', 'Source Swagger specification')
  .demandOption(['input'])
  .argv;
const jsonpath = require('jsonpath');
const fs = require('fs');

const Accounts = {
};
const accountType = {};
let accountTypeName = null;

const graphQlTypes = {
  string: 'String',
};

const getDefinitionName = reference => reference.$ref.split('/').pop();

const renderType = (typeName, type, interfaceName) => {
  const typeDefinitions = Object.keys(type)
    .reduce((output, key) => {
      output[key] = type[key]; // eslint-disable-line
      return output;
    }, {});
  const interfacePhrase = interfaceName ? ` implements ${interfaceName}` : '';
  return `type ${typeName}${interfacePhrase} ${JSON.stringify(typeDefinitions, null, 2).replace(/("|,)/g, '')}`;
};


const getDataType = (parent, propertyName, typeDefinition, sharedDefinitions) => {
  const idName = parent.replace(/(OB|[0-9]+$)/g, '');

  if (propertyName === `${idName}Id` || propertyName === 'AccountId') {
    return 'ID';
  }

  if (typeDefinition.properties[propertyName].enum) {
    return propertyName;
  }

  if (typeDefinition.properties[propertyName].type === 'string') {
    return 'String';
  }

  if (typeDefinition.properties[propertyName].$ref) {
    const referenceName = getDefinitionName(typeDefinition.properties[propertyName]);

    if (sharedDefinitions[referenceName]) {
      if (sharedDefinitions[referenceName].type === 'String') {
        return 'String';
      }

      return referenceName;
    }
  }
  return null;
};


const document = JSON.parse(fs.readFileSync(argv.input, 'utf-8'));
const dictionary = {};
const topLevelTypes = [];
const enumTypes = [];

const sharedDefinitions = Object.keys(document.definitions)
  .reduce((definitions, key) => {
    const definition = document.definitions[key];

    if (definition.enum) {
      definitions[key] = { type: 'enum', values: definition.enum } // eslint-disable-line  
      return definitions;
    }

    if (definition.type === 'string') {
      definitions[key] = { type: 'String' }; // eslint-disable-line  
      return definitions;
    }

    definitions[key] = definition; // eslint-disable-line 
    return definitions;
  }, {});


// Only GET for the first version
jsonpath.nodes(document, '$.paths..get').forEach((path) => {
  const matches = path.path.filter(fragment => fragment.match(/\{AccountId\}/));
  const fragments = matches.length > 0 ? matches[0].split('/') : [];
  const entity = fragments.length > 2 && fragments.length < 5 ? fragments.pop() : null;

  if (entity) {
    const name = entity === '{AccountId}' ? 'account' : entity
      .split('-')
      .map(word => word.replace(/^[a-z]/, value => value.toUpperCase()))
      .join('');
    const responseDefinition = jsonpath.query(path.value, '$.responses.200');
    const responseDefinitionName = getDefinitionName(responseDefinition.pop());

    const obReadDefinitionName = getDefinitionName(document.responses[responseDefinitionName].schema);

    const topLevelQuery = `$.definitions.${obReadDefinitionName}.properties.Data.properties`;
    const topLevelType = jsonpath.query(document, topLevelQuery);
    let topLevelName = null;

    if (topLevelType.length > 0) {
      const propertyName = Object.keys(topLevelType[0])[0];

      topLevelName = topLevelType[0][propertyName].$ref
        ? getDefinitionName(topLevelType[0][propertyName])
        : getDefinitionName(topLevelType[0][propertyName].items);
      topLevelTypes.push({ name: topLevelName, obj: document.definitions[topLevelName] });
    } else {
      throw new Error(`Could not find top-level type for definition: ${obReadDefinitionName}`);
    }

    if (name === 'account') {
      accountTypeName = topLevelName;
    } else if (document.responses[responseDefinitionName].schema.$ref) {
      accountType[name] = `[${topLevelName}]`;
    } else {
      throw new Error(`Cannot evaluate this puppy: ${name}`);
    }
  }
});

topLevelTypes.forEach((type) => {
  const obj = Object.keys(type.obj.properties).reduce((obj, key) => {
    obj[key] = getDataType(type.name, key, type.obj, sharedDefinitions);
    return obj;
  }, {});

  // console.log(renderType(type.name, obj));
});

// console.log(renderType('Account', accountType, accountTypeName));
