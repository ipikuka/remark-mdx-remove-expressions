import React from "react";
import ReactDOMServer from "react-dom/server";
import { evaluate, type EvaluateOptions } from "@mdx-js/mdx";
import * as runtime from "react/jsx-runtime";
import remarkGfm from "remark-gfm";
import type { VFileCompatible } from "vfile";

import plugin, { type MdxRemoveExpressionsOptions } from "../../src";
import { Component } from "./Component";

type Options = MdxRemoveExpressionsOptions & { withoutPlugin?: boolean };

export const processMdx = async (
  source: VFileCompatible,
  options?: Options,
): Promise<string> => {
  const result = await evaluate(source, {
    ...runtime,
    outputFormat: "function-body",
    remarkPlugins: [remarkGfm, ...(options?.withoutPlugin ? [] : [[plugin, options]])],
  } as EvaluateOptions);

  const element = React.createElement(result.default, {
    components: { Component },
    value: "test-value",
    frontmatter: { title: "Test Title" },
    rest: { x: "test-x", y: "test-y" },
  });

  return ReactDOMServer.renderToStaticMarkup(element);
};
