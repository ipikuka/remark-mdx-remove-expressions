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
  // ******************************************
  it("blockJS is true", async () => {
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
  it("only dangerous", async () => {
    expect(await processMdx(source, { blockJS: false })).toMatchInlineSnapshot(`
      "<h1>Test Title</h1>
      <p>Hi, welcome to MDX expressions!</p>
      <p>expressions: 2 true true end</p>
      <p>Process environment language is .</p>
      <h2>Test Component</h2>
      <p>removed attributes:[dangerous]</p>"
    `);
  });
});
