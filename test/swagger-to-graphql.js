const { expect } = require('chai');
const fs = require('fs');

const SwaggerToGraphQL = require('../lib/swagger-to-graphql');

describe(__filename, () => {
  const swagger = JSON.parse(fs.readFileSync(`${__dirname}/data/specs/account-info-swagger.json`, 'utf-8'));
  const template = fs.readFileSync(`${__dirname}/data/templates/account-info.graphql`, 'utf-8');
  const rootInterface = 'OBAccount3';


  describe('Initialisation', () => {
    it('Missing arguments throws an error', () => {
      expect(SwaggerToGraphQL.bind(SwaggerToGraphQL, { swagger })).to.throw('Missing required properties from options: { swagger, rootInterface }');
    });
  });

  describe('Type conversion cases', () => {
    const converter = SwaggerToGraphQL({ swagger, template, rootInterface });

    it('type conversion with bad arguments throws an error', () => {
      expect(converter.convert.bind(converter, 'AccountId', null, null, ['AccountId']))
        .to.throw('Cannot destructure property `description` of \'undefined\' or \'null\'.');
    });
    it('type conversion with unprofiled Swagger characteristic throws and error', () => {
      const definition = JSON.parse(JSON.stringify(swagger.definitions.AccountId));
      definition.type = 'unknown';

      expect(converter.convert.bind(converter, 'AccountId', definition, null, ['AccountId']))
        .to.throw('Could not map Swagger defintion to GraphQL type: AccountId');
    });
    it('string conversion returned as type String', () => {
      const result = converter.convert('AccountId', swagger.definitions.AccountId, null, ['AccountId']);
      expect(result.AccountId.type).to.equal('String');
      expect(result.AccountId.required).to.equal(true);
      expect(result.AccountId.description).to.equal('A unique and immutable identifier used to identify the account resource. This identifier has no meaning to the account owner.');
    });
    it('integer conversion returned as Int', () => {
      const result = converter.convert('OBStatementValue1', swagger.definitions.OBStatementValue1);
      expect(result.OBStatementValue1.properties.Value.type).to.equal('Int');
      expect(result.OBStatementValue1.properties.Value.required).to.equal(true);
    });
    it('boolean conversion returned as Boolean', () => {
      const result = converter.convert('OBCreditLine1', swagger.definitions.OBCreditLine1);
      expect(result.OBCreditLine1.properties.Included.type).to.equal('Boolean');
      expect(result.OBCreditLine1.properties.Included.required).to.equal(true);
    });
    it('number conversion returned as Float', () => {
      const result = converter.convert('OBCurrencyExchange5', swagger.definitions.OBCurrencyExchange5);
      expect(result.OBCurrencyExchange5.properties.ExchangeRate.type).to.equal('Float');
      expect(result.OBCurrencyExchange5.properties.ExchangeRate.required).to.equal(true);
    });
    it('object conversion returned as type', () => {
      const result = converter.convert(
        'OBActiveOrHistoricCurrencyAndAmount',
        swagger.definitions.OBActiveOrHistoricCurrencyAndAmount,
      );
      expect(result.OBActiveOrHistoricCurrencyAndAmount.type).to.equal('type');
      expect(result.OBActiveOrHistoricCurrencyAndAmount.properties.Amount.type).to.equal('String');
      expect(result.OBActiveOrHistoricCurrencyAndAmount.properties.Amount.required).to.equal(true);
      expect(result.OBActiveOrHistoricCurrencyAndAmount.properties.Currency.type).to.equal('String');
      expect(
        result.OBActiveOrHistoricCurrencyAndAmount.properties.Currency.required,
      ).to.equal(true);
    });
    it('enum string returned as enum', () => {
      const result = converter.convert('OBAddressTypeCode', swagger.definitions.OBAddressTypeCode);
      expect(result.OBAddressTypeCode.type).to.equal('enum');
      expect(
        result.OBAddressTypeCode.values,
      ).to.deep.equal(swagger.definitions.OBAddressTypeCode.enum);
    });
    it('array with inline enum string returned as enum reference and added to schema types', () => {
      const result = converter.convert('OBBCAData1', swagger.definitions.OBBCAData1);

      expect(result.OBBCAData1.properties.OBBCAData1_ProductDetails.properties.Segment.type).to.equal('[OBBCAData1_ProductDetails_Segment_Segment]');
      expect(converter.skeletonTypes.OBBCAData1_ProductDetails_Segment_Segment.type).to.equal('enum');
    });
  });

  describe('Definition reference conversion', () => {
    const converter = SwaggerToGraphQL({ swagger, template, rootInterface });

    it('object conversion with referenced object definition is transposed to schema', () => {
      const result = converter.convert('OBOffer1', swagger.definitions.OBOffer1);
      expect(result.OBOffer1.type).to.equal('type');
      expect(result.OBOffer1.properties.OfferType.type).to.equal('OBExternalOfferType1Code');
    });
    it('object conversion with referenced array definition is transposed to schema', () => {
      const result = converter.convert('OBReadData1', swagger.definitions.OBReadData1);
      expect(result.OBReadData1.type).to.equal('type');
      expect(result.OBReadData1.properties.Permissions.type).to.equal('[OBExternalPermissions1Code]');
    });
  });

  describe('Rendering of types with a filter', () => {
    const regexCheck = (text, expression) => (new RegExp(expression)).test(text);
    const fullSchema = SwaggerToGraphQL({ swagger, template, rootInterface });
    const schema = fullSchema.renderAll('^((?!(OBRead.*|Links|Meta|OBRisk2|OBError.*)))');

    // const schemaObj = graphql.buildSchema(schema);
    // console.log(schemaObj);

    // Some cursory tests - most of the work will be done by the linter
    it('Check that the root interface has been defined', () => {
      expect(regexCheck(schema, `interface ${rootInterface}`)).to.equal(true);
    });
    it('Check that the Account type implements the root interface', () => {
      expect(regexCheck(schema, `type Account implements ${rootInterface}`)).to.equal(true);
    });
  });

  describe('Rendering of types without a filter', () => {
    const regexCheck = (text, expression) => (new RegExp(expression)).test(text);
    const fullSchema = SwaggerToGraphQL({ swagger, rootInterface });
    const schema = fullSchema.renderAll();

    // const schemaObj = graphql.buildSchema(schema);
    // console.log(schemaObj);

    // Some cursory tests - most of the work will be done by the linter
    it('Check that the root interface has been defined', () => {
      expect(regexCheck(schema, `interface ${rootInterface}`)).to.equal(true);
    });
  });
});
