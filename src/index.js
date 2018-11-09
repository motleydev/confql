require("dotenv").config()
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
const WEATHER_API = 'http://localhost:9000';
const MY_API = 'https://api-euwest.graphcms.com/v1/cjslyzurw378n01bs1c3ip1ds/master';
const YELP_API = 'https://api.yelp.com/v3/graphql';

// Server Function
async function run(){

/* First we need to fetch our remote APIs,
inspect their content and then apply the use
Apollo to merge their schemas. */
  const createRemoteSchema = async (uri,settings) => {
    const config = {uri: uri, fetch, ...settings}
  try {
    const link = new HttpLink(config);
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
const remoteYelp = await createRemoteSchema(YELP_API, {
  credentials: "include",
  headers: {
    "Authorization": `Bearer ${process.env.YELP_TOKEN}`
  }
})

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


const yelpTransformedAPI = transformSchema(remoteYelp, [
  new FilterRootFields(
    (operation, rootField) => operation === 'Query'
  ),
  new RenameTypes((name) =>
    name === 'Location' ? `Place` : name),
  new RenameRootFields((operation, name) =>
    name === 'location' ? `place` : name),
]);


/* This is an important step, it lets us tell the schema
which fields should be connected between the schemas. */
const linkTypeDefs = `
  extend type Conference {
    location: Location
  }

  extend type Location {
    hotels: Businesses
    food: Businesses
  }
`;

/* Finally we merge the schemas but also add the resolvers
which tells GraphQL how to resolve our newly added fields. */
const schema = mergeSchemas({

    // Merge these Schemas
    schemas: [
      remoteWeatherAPI,
      myTransformedAPI,
      yelpTransformedAPI,
      linkTypeDefs,
    ],

    // Resolve them here
    resolvers: {
      // Which type gets the new fields
      Conference: {
        
        // Which field
        location: {
          
          // What's the 'value' we will pass in from our existing Schema
          fragment: `... on Conference { city, country, startDate }`,
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
                date: `${response.startDate}`
              },
              context,
              info,
              transforms: myTransformedAPI.transforms
            });
          },
        },
      },

      Location: {
        // Which field
        hotels: {
          
          // What's the 'value' we will pass in from our existing Schema
          fragment: `... on Conference { city, country }`,
          resolve(response, args, context, info) {
            return info.mergeInfo.delegateToSchema({
              
              // Which Schema returns the data for the field above
              schema: remoteYelp,
              
              // What's the operation it should perform 
              operation: 'query',
              
              // What field is is querying ON the delegated Schema?
              fieldName: 'search',
              
              // What arguments do we pass in -
              // from our query above which is a JSON response?
              args: {
                location: `${response.city}, ${response.country}`,
                term: "Hotels"
              },
              context,
              info,
              transforms: yelpTransformedAPI.transforms
            });
          },
        },
        food: {
          // What's the 'value' we will pass in from our existing Schema
          fragment: `... on Conference { city, country }`,
          resolve(response, args, context, info) {
            return info.mergeInfo.delegateToSchema({
              
              // Which Schema returns the data for the field above
              schema: remoteYelp,
              
              // What's the operation it should perform 
              operation: 'query',
              
              // What field is is querying ON the delegated Schema?
              fieldName: 'search',
              
              // What arguments do we pass in -
              // from our query above which is a JSON response?
              args: {
                location: `${response.city}, ${response.country}`,
                term: "Burgers"
              },
              context,
              info,
              // transforms: myTransformedAPI.transforms
            });
          },
        }
      }
    
    }
  });


// Server Code - the end.
const server = new ApolloServer({ schema });
  server.listen(8000).then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`);
});

}

try {
  console.log('get ready')
  run()
}  catch (e) {
  console.log(e)
}
  