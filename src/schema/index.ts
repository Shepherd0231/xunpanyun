import { type SchemaTypeDefinition } from 'sanity';
import post from './post';
import product from './product';

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [post, product],
};
