import React, { Suspense } from "react";
import ReactDOMServer from "react-dom/server";
import { evaluate } from "next-mdx-remote-client/rsc";
import remarkGfm from "remark-gfm";

import plugin, { type MdxRemoveExpressionsOptions } from "../../src";
import { Component } from "./Component";

type Options = MdxRemoveExpressionsOptions & { withoutPlugin?: boolean };

export const processMdx = async (source: string, options?: Options): Promise<string> => {
  const { content, error } = await evaluate({
    source,
    components: { Component },
    options: {
      parseFrontmatter: true,
      scope: {
        value: "test-value",
        rest: {
          x: "test-x",
          y: "test-y",
        },
        headingTitle: "Test Heading",
      },
      mdxOptions: {
        remarkPlugins: options?.withoutPlugin ? [remarkGfm] : [remarkGfm, [plugin, options]],
      },
    },
  });

  if (error) {
    console.error("MDX Error:", error);
    throw error;
  }

  const wrapped = React.createElement(Suspense, { fallback: "Loading..." }, content);

  return ReactDOMServer.renderToStaticMarkup(wrapped);
};
