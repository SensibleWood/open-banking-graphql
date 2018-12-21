Overview
===

I'd had an idea that the UK Open Banking API specifications could be transposed to a GraphQL specification. Why? Well, primarily to prove I could but really because of this from the GraphQL [homepage](https://graphql.org/):

<p align="center"><i>Send a GraphQL query to your API and get exactly what you need, nothing more and nothing less.</i></p>

Open Banking API specifications generally tend towards REST for good reasons, but having the GraphQL kind of granularity available for developers seems like a *"good thing"*. So I started with the Account Information API, and this is the first drop.

> Note: I am a freelancer at UK Open Banking and have worked on the project on-and-off for about 2 years. However, this is a private effort and not allied to Open Banking Limited.

Scope
===

I've only tackled Account Information so far - how Payment Initiation is dealt with needs more brain power than I have available at the moment (well maybe forever!). The source API specification (defined using [Swagger](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md)) can be found [here](https://github.com/OpenBankingUK/read-write-api-specs/blob/v3.1.0/dist/account-info-swagger.json).

The approach I've taken is fairly pragmatic and I'm sure there are plenty of optimizations that could be achieved.

In brief:

* Primitives in Swagger (JSON Schema really) map pretty well to their Scalar equivalent so most of these are just transposed.
* Likewise for `enum`, but the Open Banking enums some need amending to compile in a GraphQL schema i.e. remove spaces, anything that's not `[A-Za-z]`, then sort them nicely.
* Where Swagger references a type and that type is a primitive it gets pulled directly into the parent. For example there is no `AccountId` interface, instead `AccountId` is always defined as `String`. This was done for pragmatism and simplicity in the resultant schema. 
* Any inline type declarations in the source Swagger are pulled into a type with a name comprised of the parent and child names concatenated with underscores. They quickly look hideous! However, it works for the time being until I refactor the approach (see [Next Steps](#Next-Steps)).

If you know the UK Open Banking standards it's pretty obvious what I don't deal with:

* Consent is omitted as conceptually it straddles authorization and data - and I'm not sure this is something worth tackling at a first drop. With some more brains it might be dealt with...
* Authentication/authorization is clearly outside the scope here and it's taken "as read' in this context i.e. the GraphQL query will be made by a client with appropriate entitlements on the data they are asking for.
* The actual mapping for GraphQL query to REST calls at the backend will be done by Resolvers that I've yet to build (see [Next Steps](#Next-Steps)).

Next steps
===

This is what I have planned next, split up into schema, implementation and coverage.

Schema
---

- [ ] Approach for converting `AccountId`, `BeneficiaryId`, etc consistently to a type of `ID`
- [ ] Remove the need for a template by doing something clever
- [ ] Migrate homegrown, not done enough research, must be a way of doing this, typing approach in `lib/converters/swagger.js` to GraphQL.js
- [ ] Tackle the hideous concatenated type name approach together with...
- [ ] Optimise the schema so it `type` definitions can be combined where appropriate

Implementation
---

- [ ] Create a boilerplate bunch of resolvers that will play nicely with a GraphQL server of some sort
- [ ] Implement with something meaning i.e. a real backend

Coverage
---

- [ ] Tackle Payment Initiation
- [ ] Tackle Confirmation of Funds
- [ ] Bring all the APIs together
- [ ] Look at Berlin Group and STET standards and see if they can join the party

Building the schema
===

A copy of the Account Information schema is in `dist` but if you want to build it it's pretty straightforward really:

```bash
npm i
npm run build:account-info
```

This:

- Generates the GraphQL schema
- Lints it using the frankly bloody excellent [Graph Schema Linter](https://github.com/cjoudrey/graphql-schema-linter) #props to @cjoudrey.

You can then take `dist/account-info.graphql` to your favorite GraphQL server and make hay.

Get Involved
===

Contributions are welcome - just get in touch.
