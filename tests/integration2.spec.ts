import { describe, it, expect } from "vitest";
import dedent from "dedent";

import { processMdx } from "./util/integration2";

const source = dedent`
  ---
  title: "Test Title"
  ---
  # {frontmatter.title}

  Hi, welcome to MDX expressions!

  expressions: {1 + 1} {true && "true"} {1 === 1 ? "true" : "false"} end

  ## Test Component 

  <Component id="test-id" enabled isOkey={true} value={value} {...rest} />
`;

describe("remark-mdx-remove-expressions", () => {
  // ******************************************
  it("no plugin", async () => {
    expect(String(await processMdx(source, { withoutPlugin: true }))).toMatchInlineSnapshot(`
      "<h1>Test Title</h1>
      <p>Hi, welcome to MDX expressions!</p>
      <p>expressions: 2 true true end</p>
      <h2>Test Component</h2>
      <p>removed attributes:[]</p>"
    `);
  });

  // ******************************************
  it("no options", async () => {
    expect(String(await processMdx(source))).toMatchInlineSnapshot(`
      "<p>Hi, welcome to MDX expressions!</p>
      <p>expressions:    end</p>
      <h2>Test Component</h2>
      <p>removed attributes:[isOkey, value, ...rest]</p>"
    `);
  });

  // ******************************************
  it("only expressions", async () => {
    expect(String(await processMdx(source, { includeJsxAttributes: false })))
      .toMatchInlineSnapshot(`
      "<p>Hi, welcome to MDX expressions!</p>
      <p>expressions:    end</p>
      <h2>Test Component</h2>
      <p>removed attributes:[]</p>"
    `);
  });
});
