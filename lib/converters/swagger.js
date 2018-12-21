/**
 * @description GraphQL constructor based on attributes of Swagger document
 * @param {*} options Root properties of the object
 */
function SwaggerToGraphQL(options) {
  if (!options.swagger || !options.rootInterface) {
    throw new Error('Missing required properties from options: { swagger, rootInterface }');
  }

  this.swagger = options.swagger;
  this.template = options.template;
  this.rootInterface = options.rootInterface;

  this.skeletonTypes = {};
  this.graphQL = [];

  return this;
}

SwaggerToGraphQL.prototype.convert = function convert(
  name, definition, parent = null, requiredProperties = [],
) {
  const addReference = (
    swagger, definitionName, referenceDefinition, description, requiredProperty,
  ) => {
    const ref = referenceDefinition.$ref || referenceDefinition.items.$ref;
    const referenceName = ref.split('/').pop();
    const reference = swagger.definitions[referenceName];
    const typeReference = referenceDefinition.$ref ? referenceName : `[${referenceName}]`;

    // If its a scalar type then grab the type from the referenced object
    // Note that enum will be specified as a distinct type
    if (reference.type !== 'object' && reference.type !== 'array' && !reference.enum) {
      return this.convert(
        definitionName, reference, null, requiredProperty ? [definitionName] : [],
      );
    }

    // If it's an object then it'll decant nicely so just reference the name
    // However, borrow the description so the field definition in the schema is as full as possible
    return { [definitionName]: { type: typeReference, description: reference.description, required: requiredProperty } };
  };
  const setScalarType = (property, type, description, required) => (
    { [property]: { type, description, required } }
  );

  const concatenatedName = parent ? `${parent}_${name}` : name;
  const required = requiredProperties.includes(name);
  const { description } = definition;

  try {
    if (definition.enum) {
      const skeleton = {
        [concatenatedName]: {
          name, type: 'enum', description, values: definition.enum.map(value => value.replace(/( |-)/g, '')), required,
        },
      };
      this.skeletonTypes = Object.assign(this.skeletonTypes, skeleton);
      return skeleton;
    }

    if (definition.type === 'string') return setScalarType(name, 'String', description, required);
    if (definition.type === 'integer') return setScalarType(name, 'Int', description, required);
    if (definition.type === 'number') return setScalarType(name, 'Float', description, required);
    if (definition.type === 'boolean') return setScalarType(name, 'Boolean', description, required);

    if (definition.$ref || (definition.items && definition.items.$ref)) {
      return addReference(this.swagger, name, definition, description, required);
    }

    if ((definition.type === 'object' && definition.properties)
      || (definition.type === 'array' && definition.items.properties)) {
      const properties = definition.properties || definition.items.properties;
      const requiredInObject = definition.required
        || (definition.items ? definition.items.required : []);
      const childProperties = Object.keys(properties)
        .reduce((objects, property) => Object.assign(
          objects,
          this.convert(property, properties[property], concatenatedName, requiredInObject),
        ), {});
      const skeleton = {
        [concatenatedName]: {
          name,
          type: concatenatedName === this.rootInterface ? 'interface' : 'type',
          properties: Object.keys(childProperties).length === 0
            ? { _: { type: 'String' } }
            : childProperties, // Add a placeholder for empty types
          description,
          required,
        },
      };

      this.skeletonTypes = Object.assign(this.skeletonTypes, skeleton);
      return skeleton;
    }

    // definition declared inline from an array that resolves to a scalar
    if (definition.type === 'array' && definition.items.type !== 'object') {
      const skeleton = this.convert(name, definition.items, concatenatedName);
      const property = Object.keys(skeleton)[0];

      return { [name]: { type: `[${skeleton[property].type === 'enum' ? property : skeleton[property].type}]`, description } };
    }
  } catch (err) {
    console.log(name, definition, parent);
    console.log(err);
    throw err;
  }

  throw new Error(`Could not map Swagger defintion to GraphQL type: ${name}`);
};

SwaggerToGraphQL.prototype.render = function render(name, skeleton) {
  // Allow GraphQL to be defined from a filtered list
  // Mechanics of filter handled outside class
  let body = null;
  const prefix = `${skeleton.description ? `"""\n${skeleton.description}\n"""\n` : ''}${skeleton.type} ${name} {`;

  if (skeleton.type === 'type' || skeleton.type === 'interface') {
    body = Object.keys(skeleton.properties)
      .map((property) => {
        const description = skeleton.properties[property].description // eslint-disable-line
          ? (skeleton.properties[property].description.match(/\n/)
            ? `  """\n  ${skeleton.properties[property].description.split('\n').join('\n  ').replace(/"/g, '')}\n  """\n`
            : `  "${skeleton.properties[property].description.replace(/"/g, '')}"\n`)
          : '';

        if (['enum', 'type'].includes(skeleton.properties[property].type)) {
          return `${description}  ${skeleton.properties[property].name}: ${property}${skeleton.properties[property].required ? '!' : ''}`;
        }
        return `${description}  ${property}: ${skeleton.properties[property].type}${skeleton.properties[property].required ? '!' : ''}`;
      }).join('\n');
  } else {
    body = skeleton.values
      .sort()
      .map(value => `  ${value}`).join('\n');
  }

  return `${prefix}\n${body}\n}`;
};

SwaggerToGraphQL.prototype.renderAll = function renderAll(filter) {
  this.skeletonTypes = {};

  if (filter) {
    const regex = new RegExp(filter);
    Object.keys(this.swagger.definitions)
      .filter(key => regex.test(key))
      .forEach((key) => {
        this.convert(key, this.swagger.definitions[key], null);
      });
  } else {
    Object.keys(this.swagger.definitions).forEach((key) => {
      this.convert(key, this.swagger.definitions[key], null);
    });
  }

  this.graphQL = Object.keys(this.skeletonTypes)
    .map(key => this.render(key, this.skeletonTypes[key]))
    .join('\n');

  return this.template ? `${this.graphQL}\n${this.template}` : `${this.graphQL}`;
};


function create(options) {
  return new SwaggerToGraphQL(options);
}

module.exports = create;
