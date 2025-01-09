import { algoliasearch } from 'algoliasearch';

//
const client = algoliasearch('ALGOLIA_APPLICATION_ID', 'ALGOLIA_API_KEY');

const response = await client.searchSingleIndex({
  indexName: 'indexName',
  searchParams: { query: 'myQuery', facetFilters: ['tags:algolia'] },
});
