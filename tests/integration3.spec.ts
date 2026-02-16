import { describe, it, expect } from "vitest";
import dedent from "dedent";

import { processMdx } from "./util/integration3";

const source = dedent`
  ---
  title: "Test Title"
  ---
  # {frontmatter.title}

  Hi, welcome to MDX expressions!

  expressions: {1 + 1} {true && "true"} {1 === 1 ? "true" : "false"} end

  Process environment language is {process.env.LANG}.

  ## Test Component 

  <Component id="test-id" enabled isOkey={true} value={value} dangerous={process.env} {...rest} />
`;

describe("remark-mdx-remove-expressions with next-mdx-remote", () => {
  // the diff is empty h1 (containing js expression) instead of removing it
  // ******************************************
  it("blockJS is true by default", async () => {
    expect(await processMdx(source)).toMatchInlineSnapshot(`
      "<h1></h1>
      <p>Hi, welcome to MDX expressions!</p>
      <p>expressions:    end</p>
      <p>Process environment language is .</p>
      <h2>Test Component</h2>
      <p>removed attributes:[isOkey, value, dangerous, ...rest]</p>"
    `);
  });

  // ******************************************
  // the diff is it throws an error because of the access to process.env
  it("only dangerous", async () => {
    await expect(processMdx(source, { blockJS: false })).rejects
      .toThrowErrorMatchingInlineSnapshot(`
      [Error: [next-mdx-remote] error compiling MDX:
      Security: Access to 'process' properties is not allowed

      More information: https://mdxjs.com/docs/troubleshooting-mdx]
    `);
  });
});
