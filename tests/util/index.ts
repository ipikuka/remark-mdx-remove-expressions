import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkMdx from "remark-mdx";
import gfm from "remark-gfm";
import remarkStringify from "remark-stringify";
import type { VFileCompatible } from "vfile";

import plugin, { type MdxRemoveExpressionsOptions } from "../../src";

export const processMdxWithoutPlugin = async (content: VFileCompatible) => {
  const compiler = unified().use(remarkParse).use(remarkMdx).use(gfm).use(remarkStringify);
  const file = await compiler.process(content);
  return String(file);
};

export const processMdxWithPlugin = async (
  content: VFileCompatible,
  options?: MdxRemoveExpressionsOptions,
): Promise<string> => {
  const compiler = unified()
    .use(remarkParse)
    .use(remarkMdx)
    .use(gfm)
    .use(plugin, options)
    .use(remarkStringify);
  const file = await compiler.process(content);
  return String(file);
};
