import { ApolloServer } from 'apollo-server';
import { HttpLink } from 'apollo-link-http';
import {
    makeRemoteExecutableSchema,
    mergeSchemas,
    transformSchema,
    FilterRootFields,
    RenameTypes,
    RenameRootFields,
    introspectSchema
  } from 'graphql-tools';
import fetch from 'node-fetch';

// Our APIs
const WEATHER_API =
  'https://geocodeql.now.sh';
const MY_API =
  'https://api-euwest.graphcms.com/v1/cjo9rdfea63cx01dgfkqtrcad/master'


// Server Function
async function run(){


/* First we need to fetch our remote APIs,
inspect their content and then apply the use
Apollo to merge their schemas. */
  const createRemoteSchema = async (uri) => {
  try {
    const link = new HttpLink({uri: uri, fetch});
    // Introspection is what gives us
    //the self documenting magic of GraphQL
    const schema = await introspectSchema(link);
    return makeRemoteExecutableSchema({
      schema,
      link,
    });
  } catch (error) {
    console.log(error)
  }
};

// Process the APIs
const remoteWeatherAPI = await createRemoteSchema(WEATHER_API)
const myRemoteAPI = await createRemoteSchema(MY_API)

/* Here I rename some more collisions around the name 'location'
- but I also remove all non query operations just to keep things
cleaner. We see those from our GraphCMS API. */
const myTransformedAPI = transformSchema(myRemoteAPI, [
  new FilterRootFields(
    (operation, rootField) => operation === 'Query'
  ),
  new RenameTypes((name) =>
    name === 'Location' ? `GCMS_${name}` : name),
  new RenameRootFields((operation, name) =>
    name === 'location' ? `GCMS_${name}` : name),
]);

/* This is an important step, it lets us tell the schema
which fields should be connected between the schemas. */
const linkTypeDefs = `
  extend type Venue {
    location: Location
  }
`;

/* Finally we merge the schemas but also add the resolvers
which tells GraphQL how to resolve our newly added fields. */
const schema = mergeSchemas({

    // Merge these Schemas
    schemas: [
      remoteWeatherAPI,
      myTransformedAPI,
      linkTypeDefs,
    ],

    // Resolve them here
    resolvers: {

      
      // Which type gets the new fields
      Venue: {
        
        // Which field
        location: {
          
          // What's the 'value' we will pass in from our existing Schema
          fragment: `... on Venue { city, country }`,
          resolve(response, args, context, info) {
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
                place: `${response.city}, ${response.country}`,
              },
              context,
              info,
              transforms: myTransformedAPI.transforms
            });
          },
        }
      }
    
    }
  });

// Server Code - the end.
const server = new ApolloServer({ schema });
  server.listen().then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`);
});

}

try {
  console.log('get ready')
  run()
}  catch (e) {
  console.log(e)
}
  