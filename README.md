**A robust Next.js newsletter `Next.js Weekly` is sponsoring me** 💖
[![NextjsWeekly banner](./assets/next-js-weekly.png)](https://nextjsweekly.com/)

### [Become a sponsor](https://github.com/sponsors/ipikuka) 🚀

If you find **`remark-mdx-remove-expressions`** useful in your projects, consider supporting my work.  
Your sponsorship means a lot 💖

My sponsors are going to be featured here and on [my sponsor wall](https://github.com/sponsors/ipikuka).

A warm thanks 🙌 to [@ErfanEbrahimnia](https://github.com/ErfanEbrahimnia), [@recepkyk](https://github.com/recepkyk), and [@LSeaburg](https://github.com/LSeaburg) for the support!

Thank you for supporting open source! 🙌

# remark-mdx-remove-expressions

[![npm version][badge-npm-version]][url-npm-package]
[![npm downloads][badge-npm-download]][url-npm-package]
[![publish to npm][badge-publish-to-npm]][url-publish-github-actions]
[![code-coverage][badge-codecov]][url-codecov]
[![type-coverage][badge-type-coverage]][url-github-package]
[![typescript][badge-typescript]][url-typescript]
[![license][badge-license]][url-license]

This package is a [**unified**][unified] ([**remark**][remark]) plugin **to remove MDX epressions within curlybraces {} in MDX documents.**

[**unified**][unified] is a project that transforms content with abstract syntax trees (ASTs) using the new parser [**micromark**][micromark]. [**remark**][remark] adds support for markdown to unified. [**mdast**][mdast] is the Markdown Abstract Syntax Tree (AST) which is a specification for representing markdown in a syntax tree.

**This plugin is a remark plugin that removes `MdxFlowExpression` and `MdxTextExpression` type AST nodes, and JSX attributes of `mdxJsxFlowElement` and `mdxJsxTextElement` type AST nodes that have expression value which is parsed via [remark-mdx][remarkmdx].**

## When should I use this?

**`remark-mdx-remove-expressions`** is useful when you need to strip MDX expressions such as `{true}`, `{1 + 1}`, `{frontmatter.title}`,  or `{myFunc()}` from untrusted MDX content.

These expressions allow arbitrary JavaScript execution during compilation or rendering. If the MDX source is not fully controlled or sanitized, they can introduce Remote Code Execution (RCE) vulnerabilities, potentially enabling attackers to access sensitive data, execute malicious code, install malware, or compromise the server.

By removing MDX expressions entirely, the plugin helps block the attack and improves the security of environments that process user-provided MDX.

**`remark-mdx-remove-expressions`** also strips JSX attribute expressions such as the  `prop` (since the value of the prop is an expression `{value}`) in `<Component prop={value} />`, by default. If you want to preserve JSX attribute expressions, you can disable this behavior by setting the `includeJsxAttributes` option to `false`.

**`remark-mdx-remove-expressions`** provides an `onlyDangerousExpressions` option that removes clearly dangerous expressions such as `{process.env}` while preserving safe ones such as `{true}`, or `{user.name}`.

Keep in mind that, **`remark-mdx-remove-expressions`** performs an early, syntax-level sanitization step to reduce the attack surface. It is designed to block obvious high-risk patterns (e.g., dynamic code execution, global access, constructor escapes) during the remark phase.

JavaScript expressions in MDX are now can be blocked or sanitized using **`remark-mdx-remove-expressions`** in the remark plugin chain in **`@mdx-js/mdx`**, **`@next/mdx`**, **`next-mdx-remote-client`**. However, in **`next-mdx-remote`** this feature is already provided as a built-in option in version.6. You should use that built-in option instead of adding **`remark-mdx-remove-expressions`** manually.

When using **`next-mdx-remote-client`**, **`@mdx-js/mdx`**, **`@next/mdx`** or other MDX integrations on top of **`@mdx-js/mdx`** , installing **`remark-mdx-remove-expressions`** at least with the option `{onlyDangerousExpressions: true}` directly in your remark plugin chain is recommended. **It gives you explicit control over MDX sanitization, and keeps security concerns clearly separated from the rendering layer. This makes your MDX pipeline more portable, testable, and easier to maintain across different setups.**

However, for stricter and more comprehensive protection, a `recma` plugin operating on the final JavaScript AST (`esast`) is recommended. A recma-level “AST firewall” can enforce deeper guarantees after MDX compilation, providing stronger runtime security boundaries. For high-security environments, combining both approaches is the safest strategy.

## How the Attack Works

MDX mixes Markdown’s simplicity with React components, making it great for blogs, docs, and user-generated content.

The problem lies in the library’s serialize and compile/run functions. These lacked proper sanitization for JavaScript expressions in untrusted MDX.

Attackers could sneak in malicious code such as `eval()`, `Function()`, or `require()` hidden in curly braces `{}`. When the server processes this **during server-side rendering (SSR)**, it executes the code with full server privileges.

This leads to **remote code execution (RCE)**, potentially letting hackers steal data, install malware, or take over the server.

For example, an attacker submits MDX like: `{require(‘child_process’).execSync(‘rm -rf /’)}`. If JavaScript expressions are not sanitized in MDX content, the server runs them blindly.

Never render user-supplied MDX without sanitization.

## Installation

This package is suitable for ESM only. In Node.js (version 16+), install with npm:

```bash
npm install remark-mdx-remove-expressions
```

or

```bash
yarn add remark-mdx-remove-expressions
```

## Usage

Say we have the following MDX file, `example.mdx`, which consists some MDX expressions.

```mdx
My number is {1 + 1}.

{process.env.SECRET}

<Component {...props} />
```

And our module, `example.js`, looks as follows:

```javascript
import { read } from "to-vfile";
import unified from "unified"
import remarkParse from "remark-parse";
import remarkMdx from "remark-mdx";
import remarkStringify from "remark-stringify";
import remarkMdxRemoveExpressions from "remark-mdx-remove-expressions";

main();

async function main() {
  const file = await unified()
    .use(remarkParse)
    .use(remarkMdx)
    .use(remarkMdxRemoveExpressions)
    .use(remarkStringify)
    .process(await read("example.mdx"));

  console.log(String(file));
}
```

Now, running `node example.js` you see all expressions are removed from your mdx input:

```mdx
My number is .

<Component />
```

Without **`remark-mdx-remove-expressions`**, all expressions will remain as it is.

## Options

The options are optional.

```typescript
use(remarkFlexibleContainers, {
  includeJsxAttributes?: boolean; // default is true
  onlyDangerousExpressions?: boolean; // default is false
} as MdxRemoveExpressionsOptions);
```

#### `includeJsxAttributes`

It is a **boolean** option whether or not stripping JSX expression atrributes and JSX attributes with value expression from MDX source.

By default it is **true**, meaningly JSX expression atrributes and JSX attributes with value expression are also removed from MDX document when you use **`remark-mdx-remove-expressions`**. 

```typescript
const options: MdxRemoveExpressionsOptions = {
  includeJsxAttributes: false;
};
```

Now, JSX expression atrributes and JSX attributes with value expression will not be processed and not stripped out while plain MDX expressions are removed.

#### `onlyDangerousExpressions`

It is a **boolean** option whether or not stripping only dangerous javascript expressions from MDX source while keeping safe ones.

By default it is **false**, meaningly all expressions are removed when you use **`remark-mdx-remove-expressions`**. 

```typescript
const options: MdxRemoveExpressionsOptions = {
  onlyDangerousExpressions: true;
};
```

Now, only dangerous expressions will be removed while safe expressions are kept. If you would like to see some example dangerous and safe expressions you can have a look at the test file `dangerous.spec.ts` in this repository.

## Syntax tree

This plugin modifies the `mdast` (markdown abstract syntax tree).

## Types

This package is fully typed with [TypeScript][url-typescript]. The plugin exports the types `MdxRemoveExpressionsOptions`.

## Compatibility

This plugin works with unified version 6+ and remark version 7+. It is compatible with MDX version 3.

## Security

Use of **`remark-mdx-remove-expressions`** does not involve rehype (hast) or user content so there are no openings for cross-site scripting (XSS) attacks.

## My Plugins

I like to contribute the Unified / Remark / MDX ecosystem, so I recommend you to have a look my plugins.

### My Remark Plugins

- [`remark-flexible-code-titles`](https://www.npmjs.com/package/remark-flexible-code-titles)
  – Remark plugin to add titles or/and containers for the code blocks with customizable properties
- [`remark-flexible-containers`](https://www.npmjs.com/package/remark-flexible-containers)
  – Remark plugin to add custom containers with customizable properties in markdown
- [`remark-ins`](https://www.npmjs.com/package/remark-ins)
  – Remark plugin to add `ins` element in markdown
- [`remark-flexible-paragraphs`](https://www.npmjs.com/package/remark-flexible-paragraphs)
  – Remark plugin to add custom paragraphs with customizable properties in markdown
- [`remark-flexible-markers`](https://www.npmjs.com/package/remark-flexible-markers)
  – Remark plugin to add custom `mark` element with customizable properties in markdown
- [`remark-flexible-toc`](https://www.npmjs.com/package/remark-flexible-toc)
  – Remark plugin to expose the table of contents via `vfile.data` or via an option reference
- [`remark-mdx-remove-esm`](https://www.npmjs.com/package/remark-mdx-remove-esm)
  – Remark plugin to remove import and/or export statements (mdxjsEsm)
- [`remark-mdx-remove-expressions`](https://www.npmjs.com/package/remark-mdx-remove-expressions)
  – Remark plugin to remove MDX expressions within curlybraces {} in MDX content

### My Rehype Plugins

- [`rehype-pre-language`](https://www.npmjs.com/package/rehype-pre-language)
  – Rehype plugin to add language information as a property to `pre` element
- [`rehype-highlight-code-lines`](https://www.npmjs.com/package/rehype-highlight-code-lines)
  – Rehype plugin to add line numbers to code blocks and allow highlighting of desired code lines
- [`rehype-code-meta`](https://www.npmjs.com/package/rehype-code-meta)
  – Rehype plugin to copy `code.data.meta` to `code.properties.metastring`
- [`rehype-image-toolkit`](https://www.npmjs.com/package/rehype-image-toolkit)
  – Rehype plugin to enhance Markdown image syntax `![]()` and Markdown/MDX media elements (`<img>`, `<audio>`, `<video>`) by auto-linking bracketed or parenthesized image URLs, wrapping them in `<figure>` with optional captions, unwrapping images/videos/audio from paragraph, parsing directives in title for styling and adding attributes, and dynamically converting images into `<video>` or `<audio>` elements based on file extension.

### My Recma Plugins

- [`recma-mdx-escape-missing-components`](https://www.npmjs.com/package/recma-mdx-escape-missing-components)
  – Recma plugin to set the default value `() => null` for the Components in MDX in case of missing or not provided so as not to throw an error
- [`recma-mdx-change-props`](https://www.npmjs.com/package/recma-mdx-change-props)
  – Recma plugin to change the `props` parameter into the `_props` in the `function _createMdxContent(props) {/* */}` in the compiled source in order to be able to use `{props.foo}` like expressions. It is useful for the `next-mdx-remote` or `next-mdx-remote-client` users in `nextjs` applications.
- [`recma-mdx-change-imports`](https://www.npmjs.com/package/recma-mdx-change-imports)
  – Recma plugin to convert import declarations for assets and media with relative links into variable declarations with string URLs, enabling direct asset URL resolution in compiled MDX.
- [`recma-mdx-import-media`](https://www.npmjs.com/package/recma-mdx-import-media)
  – Recma plugin to turn media relative paths into import declarations for both markdown and html syntax in MDX.
- [`recma-mdx-import-react`](https://www.npmjs.com/package/recma-mdx-import-react)
  – Recma plugin to ensure getting `React` instance from the arguments and to make the runtime props `{React, jsx, jsxs, jsxDev, Fragment}` is available in the dynamically imported components in the compiled source of MDX.
- [`recma-mdx-html-override`](https://www.npmjs.com/package/recma-mdx-html-override)
  – Recma plugin to allow selected raw HTML elements to be overridden via MDX components.
- [`recma-mdx-interpolate`](https://www.npmjs.com/package/recma-mdx-interpolate)
  – Recma plugin to enable interpolation of identifiers wrapped in curly braces within the `alt`, `src`, `href`, and `title` attributes of markdown link and image syntax in MDX.

### My Unist Utils and Plugins

I also build low-level utilities and plugins for the Unist ecosystem that can be used across Remark, Rehype, Recma, and other syntax trees.

- [`unist-util-find-between-all`](https://www.npmjs.com/package/unist-util-find-between-all)
  – Unist utility to find the nodes between two nodes.
- [`unist-plugin-log-tree`](https://www.npmjs.com/package/unist-plugin-log-tree)
  – Debugging plugin for the unified ecosystem that logs abstract syntax trees (ASTs) without transforming.

## License

[MIT License](./LICENSE) © ipikuka

[unified]: https://github.com/unifiedjs/unified
[micromark]: https://github.com/micromark/micromark
[remark]: https://github.com/remarkjs/remark
[remarkplugins]: https://github.com/remarkjs/remark/blob/main/doc/plugins.md
[mdast]: https://github.com/syntax-tree/mdast
[remarkmdx]: https://mdxjs.com/packages/remark-mdx/

[badge-npm-version]: https://img.shields.io/npm/v/remark-mdx-remove-expressions
[badge-npm-download]:https://img.shields.io/npm/dt/remark-mdx-remove-expressions
[url-npm-package]: https://www.npmjs.com/package/remark-mdx-remove-expressions
[url-github-package]: https://github.com/ipikuka/remark-mdx-remove-expressions

[badge-license]: https://img.shields.io/github/license/ipikuka/remark-mdx-remove-expressions
[url-license]: https://github.com/ipikuka/remark-mdx-remove-expressions/blob/main/LICENSE

[badge-publish-to-npm]: https://github.com/ipikuka/remark-mdx-remove-expressions/actions/workflows/publish.yml/badge.svg
[url-publish-github-actions]: https://github.com/ipikuka/remark-mdx-remove-expressions/actions/workflows/publish.yml

[badge-typescript]: https://img.shields.io/npm/types/remark-mdx-remove-expressions
[url-typescript]: https://www.typescriptlang.org/

[badge-codecov]: https://codecov.io/gh/ipikuka/remark-mdx-remove-expressions/graph/badge.svg?token=8idzMS2vAJ
[url-codecov]: https://codecov.io/gh/ipikuka/remark-mdx-remove-expressions

[badge-type-coverage]: https://img.shields.io/badge/dynamic/json.svg?label=type-coverage&prefix=%E2%89%A5&suffix=%&query=$.typeCoverage.atLeast&uri=https%3A%2F%2Fraw.githubusercontent.com%2Fipikuka%2Fremark-mdx-remove-expressions%2Fmaster%2Fpackage.json
