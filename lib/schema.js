function GraphQLSchema(options) {
  return this;
}

GraphQLSchema.prototype.addDefinition = function addDefinition(definition) {

};

function create(options) {
  return new GraphQLSchema(options);
}

module.exports = {
  create,
};
