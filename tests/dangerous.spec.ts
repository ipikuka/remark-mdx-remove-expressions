import { describe, it, expect } from "vitest";
import dedent from "dedent";

import { processMdxWithPlugin } from "./util/index";

const source = dedent`
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

  ---

  # Safe expressions

  ## Literals
  {true}
  {false}
  {null}
  {undefined}
  {123}
  {"hello"}
  {[1,2,3]}
  {{ a: 1, b: 2 }}

  ## Arithmetic / logic
  {1 + 2}
  {a && b}
  {a || b}
  {!flag}
  {count > 5 ? "yes" : "no"}

  ## Safe identifiers
  {a}
  {count}
  {props.title}
  {user.name}
  {items.length}
  {obj.process}

  ## Safe Math usage
  {Math.max(1, 2)}

  ## Safe class (no extends, no super)
  {class A { constructor() { this.key = true } }}

  ## Safe arrow function
  {(x) => x + 1}

  ## Safe function expression
  {function test() { return 1 }}
  {function test(process) { return 1 }}

  ## Safe new built-in objects 
  {new Date()}

  ---

  # JSX attribute tests

  <MyComponent />

  <MyComponent disabled />

  <MyComponent {...props} />

  <MyComponent prop={a} />

  <MyComponent safe={1 + 2} />

  <MyComponent dangerous={process.env} />

  <MyComponent escape={({}).constructor.constructor("alert(1)")()} />

  <MyComponent literal="safe" />

  ---

  # Mixed nesting tests

  {({ a: { b: { c: process }}})}

  {[{ x: 1 }, { y: require("fs") }]}

  {{
    safe: 1,
    nested: {
      ok: true,
      bad: globalThis.process
    }
  }}
`;

describe("remark-mdx-remove-expressions", () => {
  // ******************************************
  it("no options", async () => {
    expect(await processMdxWithPlugin(source)).toMatchInlineSnapshot(`
      "# Dangerous expressions

      ## MetaProperty

      ## Node globals

      ## require / dynamic execution

      ## Constructor escape

      ## Prototype access

      ## Dangerous class (extends + super)

      ## New expression

      ## Optional chaining escape

      ## Computed escape

      ## Dynamic import

      ## Window/global aliases

      ## Optional chain variant

      ## Nested function wrapper

      ## Computed call on blocked global

      ***

      # Safe expressions

      ## Literals

      ## Arithmetic / logic

      ## Safe identifiers

      ## Safe Math usage

      ## Safe class (no extends, no super)

      ## Safe arrow function

      ## Safe function expression

      ## Safe new built-in objects

      ***

      # JSX attribute tests

      <MyComponent />

      <MyComponent disabled />

      <MyComponent />

      <MyComponent />

      <MyComponent />

      <MyComponent />

      <MyComponent />

      <MyComponent literal="safe" />

      ***

      # Mixed nesting tests
      "
    `);
  });

  // ******************************************
  it("only dangerous expressions", async () => {
    expect(await processMdxWithPlugin(source, { onlyDangerousExpressions: true }))
      .toMatchInlineSnapshot(`
      "# Dangerous expressions

      ## MetaProperty

      ## Node globals

      ## require / dynamic execution

      ## Constructor escape

      ## Prototype access

      ## Dangerous class (extends + super)

      ## New expression

      ## Optional chaining escape

      ## Computed escape

      ## Dynamic import

      ## Window/global aliases

      ## Optional chain variant

      ## Nested function wrapper

      ## Computed call on blocked global

      ***

      # Safe expressions

      ## Literals

      {true}

      {false}

      {null}

      {undefined}

      {123}

      {"hello"}

      {[1,2,3]}

      {{ a: 1, b: 2 }}

      ## Arithmetic / logic

      {1 + 2}

      {a && b}

      {a || b}

      {!flag}

      {count > 5 ? "yes" : "no"}

      ## Safe identifiers

      {a}

      {count}

      {props.title}

      {user.name}

      {items.length}

      {obj.process}

      ## Safe Math usage

      {Math.max(1, 2)}

      ## Safe class (no extends, no super)

      {class A { constructor() { this.key = true } }}

      ## Safe arrow function

      {(x) => x + 1}

      ## Safe function expression

      {function test() { return 1 }}

      {function test(process) { return 1 }}

      ## Safe new built-in objects

      {new Date()}

      ***

      # JSX attribute tests

      <MyComponent />

      <MyComponent disabled />

      <MyComponent {...props} />

      <MyComponent prop={a} />

      <MyComponent safe={1 + 2} />

      <MyComponent />

      <MyComponent />

      <MyComponent literal="safe" />

      ***

      # Mixed nesting tests
      "
    `);
  });
});
