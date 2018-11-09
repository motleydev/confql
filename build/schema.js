'use strict';

var _templateObject = _taggedTemplateLiteral(['\n  type Query {\n    hello: String\n  }\n'], ['\n  type Query {\n    hello: String\n  }\n']);

function _taggedTemplateLiteral(strings, raw) { return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

var _require = require('apollo-server'),
    gql = _require.gql;

var typeDefs = gql(_templateObject);

var resolvers = {
  Query: {
    hello: function hello() {
      return 'world';
    }
  }
};

module.exports = [typeDefs, resolvers];
//# sourceMappingURL=schema.js.map