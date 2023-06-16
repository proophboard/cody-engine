import {
  generateFiles,
  Tree,
} from '@nx/devkit';
import * as path from 'path';
import { PrepareContributionGeneratorSchema } from './schema';

export default async function (
  tree: Tree,
  options: PrepareContributionGeneratorSchema
) {
  generateFiles(tree, path.join(__dirname, 'files'), 'packages', {
    'tmpl': ''
  });
}
