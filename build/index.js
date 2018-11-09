'use strict';

// Server Function
var run = function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2() {
    var _this = this;

    var createRemoteSchema, remoteWeatherAPI, myRemoteAPI, myTransformedAPI, linkTypeDefs, schema, server;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:

            /* First we need to fetch our remote APIs,
            inspect their content and then apply the use
            Apollo to merge their schemas. */
            createRemoteSchema = function () {
              var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(uri) {
                var link, _schema;

                return regeneratorRuntime.wrap(function _callee$(_context) {
                  while (1) {
                    switch (_context.prev = _context.next) {
                      case 0:
                        _context.prev = 0;
                        link = new _apolloLinkHttp.HttpLink({ uri: uri, fetch: _nodeFetch2.default });
                        // Introspection is what gives us
                        //the self documenting magic of GraphQL

                        _context.next = 4;
                        return (0, _graphqlTools.introspectSchema)(link);

                      case 4:
                        _schema = _context.sent;
                        return _context.abrupt('return', (0, _graphqlTools.makeRemoteExecutableSchema)({
                          schema: _schema,
                          link: link
                        }));

                      case 8:
                        _context.prev = 8;
                        _context.t0 = _context['catch'](0);

                        console.log(_context.t0);

                      case 11:
                      case 'end':
                        return _context.stop();
                    }
                  }
                }, _callee, _this, [[0, 8]]);
              }));

              return function createRemoteSchema(_x) {
                return _ref2.apply(this, arguments);
              };
            }();

            // Process the APIs


            _context2.next = 3;
            return createRemoteSchema(WEATHER_API);

          case 3:
            remoteWeatherAPI = _context2.sent;
            _context2.next = 6;
            return createRemoteSchema(MY_API);

          case 6:
            myRemoteAPI = _context2.sent;


            /* Here I rename some more collisions around the name 'location'
            - but I also remove all non query operations just to keep things
            cleaner. We see those from our GraphCMS API. */
            myTransformedAPI = (0, _graphqlTools.transformSchema)(myRemoteAPI, [new _graphqlTools.FilterRootFields(function (operation, rootField) {
              return operation === 'Query';
            }), new _graphqlTools.RenameTypes(function (name) {
              return name === 'Location' ? 'GCMS_' + name : name;
            }), new _graphqlTools.RenameRootFields(function (operation, name) {
              return name === 'location' ? 'GCMS_' + name : name;
            })]);

            /* This is an important step, it lets us tell the schema
            which fields should be connected between the schemas. */

            linkTypeDefs = '\n  extend type Venue {\n    location: Location\n  }\n';

            /* Finally we merge the schemas but also add the resolvers
            which tells GraphQL how to resolve our newly added fields. */

            schema = (0, _graphqlTools.mergeSchemas)({

              // Merge these Schemas
              schemas: [remoteWeatherAPI, myTransformedAPI, linkTypeDefs],

              // Resolve them here
              resolvers: {

                // Which type gets the new fields
                Venue: {

                  // Which field
                  location: {

                    // What's the 'value' we will pass in from our existing Schema
                    fragment: '... on Venue { city, country }',
                    resolve: function resolve(response, args, context, info) {
                      return info.mergeInfo.delegateToSchema({

                        // Which Schema returns the data for the field above
                        schema: remoteWeatherAPI,

                        // What's the operation it should perform 
                        operation: 'query',

                        // What field is is querying ON the delegated Schema?
                        fieldName: 'location',

                        // What arguments do we pass in -
                        // from our query above which is a JSON response?
                        args: {
                          place: response.city + ', ' + response.country
                        },
                        context: context,
                        info: info,
                        transforms: myTransformedAPI.transforms
                      });
                    }
                  }
                }

              }
            });

            // Server Code - the end.

            server = new _apolloServer.ApolloServer({ schema: schema });

            server.listen().then(function (_ref3) {
              var url = _ref3.url;

              console.log('\uD83D\uDE80  Server ready at ' + url);
            });

          case 12:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));

  return function run() {
    return _ref.apply(this, arguments);
  };
}();

var _apolloServer = require('apollo-server');

var _apolloLinkHttp = require('apollo-link-http');

var _graphqlTools = require('graphql-tools');

var _nodeFetch = require('node-fetch');

var _nodeFetch2 = _interopRequireDefault(_nodeFetch);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

// Our APIs
var WEATHER_API = 'https://geocodeql.now.sh';
var MY_API = 'https://api-euwest.graphcms.com/v1/cjo9rdfea63cx01dgfkqtrcad/master';

try {
  console.log('get ready');
  run();
} catch (e) {
  console.log(e);
}
//# sourceMappingURL=index.js.map