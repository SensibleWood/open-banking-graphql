const { expect } = require('chai');
const fs = require('fs');

const SwaggerToGraphQL = require('../../lib/converters/swagger');

describe(__filename, () => {
  const swagger = JSON.parse(fs.readFileSync(`${__dirname}/../data/account-info-swagger.json`, 'utf-8'));
  const converter = SwaggerToGraphQL({ swagger });

  describe('Type conversion cases', () => {
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
      expect(result.OBActiveOrHistoricCurrencyAndAmount.properties.Currency.required).to.equal(true);
    });
    it('enum string returned as enum', () => {
      const result = converter.convert('OBAddressTypeCode', swagger.definitions.OBAddressTypeCode);
      expect(result.OBAddressTypeCode.type).to.equal('enum');
      expect(result.OBAddressTypeCode.values).to.deep.equal(swagger.definitions.OBAddressTypeCode.enum);
    });
    it('array with inline enum string returned as enum reference', () => {
      const result = converter.convert('OBBCAData1', swagger.definitions.OBBCAData1);

      // TODO: Add test here
    });
  });

  describe('Definition reference conversion', () => {
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

  describe('Rendering of types', () => {
    it('Types without filter', () => {
      const fullSchema = SwaggerToGraphQL({ swagger, template: fs.readFileSync(`${__dirname}/../../src/templates/account-info.graphql`) });
      const schema = fullSchema.renderAll('^((?!(OBRead.*|Links|Meta|OBRisk2|OBError.*)))');


      fs.writeFileSync('build/account-info-types.json', JSON.stringify(converter.skeletonTypes, null, 2));
      fs.writeFileSync('dist/account-info.graphql', schema);
    });
    it('Filtered types', () => {
      // const schema = converter.render(
      //   Object.keys(swagger.definitions)
      //     .reduce((output, key) => {
      //       if (!key.match(/^OBRead(Account|Balance|Beneficiary|Consent.*|DirectDebit|Offer|Party|Product|ScheduledPayment|StandingOrder|Statement|Transaction)[0-9]+$/)) {
      //         output[key] = swagger.definitions[key]; // eslint-disable-line
      //       }
      //       return output;
      //     }, {}),
      // );

      // console.log(schema);
    });
  });
});
