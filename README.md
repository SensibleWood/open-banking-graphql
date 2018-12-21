Overview
===

I'd had an idea that the UK Open Banking API specifications could be transposed to a GraphQL specification. 

Progress to date
===

I've only tackled Account Information so far - how Payment Initiation is dealt with needs more brain power. The source API specification defined using [Swagger](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md) can be found [here](https://github.com/OpenBankingUK/read-write-api-specs/blob/v3.1.0/dist/account-info-swagger.json).

The approach I've taken is fairly opinionated and I'm sure there are plenty of optimisations that could be achieved. In brief:

* Primitives in Swagger (JSON Schema really) map pretty well to their GraphQL equivilents.
