# ConfQL Schema Stitching Demo

💻🧵

## Explanation
GraphQL schema stitching is an excellent way to enhance APIs with a wealth of extra data. The concept is simple and the execution is straight forward. The idea is simply to access two or more APIs in one.

We will combine 4 services:
Yelp
Google
Darksky
[GraphCMS'](https://www.graphcms.com)

The execution involves four steps.

1. Introspect the remote APIs. Finding out what schema structure you have to work with.
2. Handle type name collisions.
3. Associate which fields get added to which types.
4. Resolve the data.

## Stitching Gotchas
It's not always a good idea to stitch your schemas together. Here are some reasons why you might not want to stitch.

* The endpoints are not versioned or reliable and might change on you without proper notice.
* One endpoint for all your data also means one endpoint to take down the project.
* Difference in TTL for your data.

## Stitch _Some_ of the Things!
Withe the gotchas in mind, stitching is a great way to combine multiple data sets into a single distributable, explorable and maintainable API. Particularly in API design for MVP projects or one off sites, it's a great way to get the developers up and running, fast.

## Requirements

API | Requirements
------------ | -------------
Geocode API | You need to build your own Geocode API. You can run this repo locally, or host it with Zeit Now.
Content API | Feel free to use the one we have provided! No limits!
Yelp API | Register for a yelp authentication key and add it to a .env file. `YELP_TOKEN=...`

1. Install dependencies with `yarn`
2. Run the server with `yarn start`

Happy coding!