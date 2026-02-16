import { describe, it, expect } from "vitest";
import dedent from "dedent";

import { processMdx } from "./util/integration1";

const source = dedent`
  # {props.frontmatter.title}

  Hi, welcome to MDX expressions!

  expressions: {1 + 1} {true && "true"} {1 === 1 ? "true" : "false"} end

  Process environment language is {process.env.LANG}.

  ## Test Component 

  <Component id="test-id" enabled isOkey={true} value={props.value} dangerous={process.env} {...props.rest} />
`;

describe("remark-mdx-remove-expressions with @mdx-js/mdx", () => {
  // ******************************************
  it("no plugin", async () => {
    expect(await processMdx(source, { withoutPlugin: true })).toMatchInlineSnapshot(`
      "<h1>Test Title</h1>
      <p>Hi, welcome to MDX expressions!</p>
      <p>expressions: 2 true true end</p>
      <p>Process environment language is C.UTF-8.</p>
      <h2>Test Component</h2>
      <p>removed attributes:[]</p>"
    `);
  });

  // ******************************************
  it("no options", async () => {
    expect(await processMdx(source)).toMatchInlineSnapshot(`
      "<p>Hi, welcome to MDX expressions!</p>
      <p>expressions:    end</p>
      <p>Process environment language is .</p>
      <h2>Test Component</h2>
      <p>removed attributes:[isOkey, value, dangerous, ...rest]</p>"
    `);
  });

  // ******************************************
  it("only expressions", async () => {
    expect(await processMdx(source, { includeJsxAttributes: false })).toMatchInlineSnapshot(`
      "<p>Hi, welcome to MDX expressions!</p>
      <p>expressions:    end</p>
      <p>Process environment language is .</p>
      <h2>Test Component</h2>
      <p>removed attributes:[]</p>"
    `);
  });

  // ******************************************
  it("only dangerous", async () => {
    expect(await processMdx(source, { onlyDangerousExpressions: true })).toMatchInlineSnapshot(`
      "<h1>Test Title</h1>
      <p>Hi, welcome to MDX expressions!</p>
      <p>expressions: 2 true true end</p>
      <p>Process environment language is .</p>
      <h2>Test Component</h2>
      <p>removed attributes:[dangerous]</p>"
    `);
  });

  // ******************************************
  it("only dangerous except jsx attributes", async () => {
    expect(
      await processMdx(source, { onlyDangerousExpressions: true, includeJsxAttributes: false }),
    ).toMatchInlineSnapshot(`
      "<h1>Test Title</h1>
      <p>Hi, welcome to MDX expressions!</p>
      <p>expressions: 2 true true end</p>
      <p>Process environment language is .</p>
      <h2>Test Component</h2>
      <p>removed attributes:[]</p>"
    `);
  });
});

const input = dedent`
  # Dangerous expressions

  ## MetaProperty
  {import.meta}

  ## Node globals
  {process}
  {process.env}
  {globalThis}
  {process["exit"]()}

  ## require / dynamic execution
  {require('fs')}
  {eval("alert(1)")}
  {Function("alert(1)")()}

  ## Constructor escape
  {({}).constructor}
  {({}).constructor.constructor("return process")()}
  {[].constructor.constructor("alert(1)")()}
  {this?.constructor?.constructor("alert(1)")()}

  ## Prototype access
  {({}).__proto__}
  {Object.prototype}
  {({}).__proto__.constructor}
  {Object["keys"]()}

  ## Dangerous class (extends + super)
  {class A extends SomeGlobal { constructor() { super() } }}

  ## New expression
  {new Function}
  {new Function()}
  {new Function("alert(1)")}
  {new Function("return process.env")()}

  ## Optional chaining escape
  {globalThis?.process?.env}

  ## Computed escape
  {globalThis["process"]}
  {({})["constructor"]["constructor"]("alert(1)")()}

  ## Dynamic import
  {import("fs")}
  {await import("fs")}

  ## Window/global aliases
  {window.process}
  {self.process}
  {global.process}

  ## Optional chain variant
  {globalThis?.["process"]}

  ## Nested function wrapper
  {(() => process)()}

  ## Computed call on blocked global
  {process["exit"]()}
  {process["env"]()}
  {globalThis["eval"]()}
  {process[method]()}

  ## Safe expression {Math.max(1, 2)} shoud not be removed
`;

describe("remark-mdx-remove-expressions with @mdx-js/mdx for dangerous expressions", () => {
  // ******************************************
  it("only dangerous expressions", async () => {
    expect(await processMdx(input, { onlyDangerousExpressions: true })).toMatchInlineSnapshot(`
      "<h1>Dangerous expressions</h1>
      <h2>MetaProperty</h2>
      <h2>Node globals</h2>
      <h2>require / dynamic execution</h2>
      <h2>Constructor escape</h2>
      <h2>Prototype access</h2>
      <h2>Dangerous class (extends + super)</h2>
      <h2>New expression</h2>
      <h2>Optional chaining escape</h2>
      <h2>Computed escape</h2>
      <h2>Dynamic import</h2>
      <h2>Window/global aliases</h2>
      <h2>Optional chain variant</h2>
      <h2>Nested function wrapper</h2>
      <h2>Computed call on blocked global</h2>
      <h2>Safe expression 2 shoud not be removed</h2>"
    `);
  });
});
