import { describe, it, expect } from "vitest";
import dedent from "dedent";

import { processMdxWithoutPlugin, processMdxWithPlugin } from "./util/index";

const source = dedent`
  # {props.title}

  Hi, welcome to MDX expressions!

  My name is {user.name}.

  expressions: {1 + 1} {true && "true"} {1 === 1 ? "true" : "false"} end

  ## Test Component

  <Component id="test-id" enabled isOkey={true} value={value} {...rest} />
`;

describe("remark-mdx-remove-expressions", () => {
  // ******************************************
  it("no plugin", async () => {
    expect(await processMdxWithoutPlugin(source)).toMatchInlineSnapshot(`
      "# {props.title}

      Hi, welcome to MDX expressions!

      My name is {user.name}.

      expressions: {1 + 1} {true && "true"} {1 === 1 ? "true" : "false"} end

      ## Test Component

      <Component id="test-id" enabled isOkey={true} value={value} {...rest} />
      "
    `);
  });

  // ******************************************
  it("no options", async () => {
    expect(await processMdxWithPlugin(source)).toMatchInlineSnapshot(`
      "Hi, welcome to MDX expressions!

      My name is .

      expressions:    end

      ## Test Component

      <Component id="test-id" enabled />
      "
    `);
  });

  // ******************************************
  it("only expressions", async () => {
    expect(await processMdxWithPlugin(source, { includeJsxAttributes: false }))
      .toMatchInlineSnapshot(`
      "Hi, welcome to MDX expressions!

      My name is .

      expressions:    end

      ## Test Component

      <Component id="test-id" enabled isOkey={true} value={value} {...rest} />
      "
    `);
  });

  // ******************************************
  it("example in README", async () => {
    const input = dedent`
      My number is {1 + 1}.

      {process.env.SECRET}

      <Component {...props} />
    `;
    expect(await processMdxWithPlugin(input)).toMatchInlineSnapshot(`
      "My number is .

      <Component />
      "
    `);
  });
});
