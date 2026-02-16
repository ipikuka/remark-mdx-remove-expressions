import React, { Suspense } from "react";
import ReactDOMServer from "react-dom/server";
import { compileMDX } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";

import { Component } from "./Component";

type Options = { blockJS?: boolean; blockDangerousJS?: boolean };

export const processMdx = async (source: string, options?: Options): Promise<string> => {
  const { content } = await compileMDX({
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
        remarkPlugins: [remarkGfm],
      },
      ...options,
    },
  });

  const wrapped = React.createElement(Suspense, { fallback: "Loading..." }, content);

  return ReactDOMServer.renderToStaticMarkup(wrapped);
};
