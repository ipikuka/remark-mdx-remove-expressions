import type { Plugin } from "unified";
import type { Root, Node } from "mdast";
import type { Node as EstreeNode, Program } from "estree";
import type {
  MdxJsxFlowElement,
  MdxJsxTextElement,
  MdxJsxAttribute,
  MdxJsxExpressionAttribute,
} from "mdast-util-mdx-jsx";
import type { MdxFlowExpression, MdxTextExpression } from "mdast-util-mdx-expression";

import { remove } from "unist-util-remove";
import { visit } from "unist-util-visit";

export type MdxRemoveExpressionsOptions = {
  includeJsxAttributes?: boolean;
  onlyDangerousExpressions?: boolean;
};

function isMdxExpression(node: Node): node is MdxFlowExpression | MdxTextExpression {
  return node.type === "mdxFlowExpression" || node.type === "mdxTextExpression";
}

function isMdxJsxElement(node: Node): node is MdxJsxFlowElement | MdxJsxTextElement {
  return node.type === "mdxJsxFlowElement" || node.type === "mdxJsxTextElement";
}

const RemarkMdxRemoveExpressions: Plugin<[MdxRemoveExpressionsOptions?], Root> = (options) => {
  const { includeJsxAttributes = true, onlyDangerousExpressions = false } = options || {};

  const BLOCKED_GLOBALS = [
    "eval",
    "Function",
    "AsyncFunction",
    "GeneratorFunction",
    "FunctionConstructor",
    "require",
    "process",
    "global",
    "globalThis",
    "window",
    "self",
    "module",
    "exports",
    "__dirname",
    "__filename",
    "child_process",
    "fs",
    "net",
    "http",
    "https",
    "vm",
    "worker_threads",
    "Reflect",
  ];

  const BUILTIN_CONSTRUCTORS = [
    "Object",
    "Array",
    "String",
    "Number",
    "Boolean",
    "Symbol",
    "Error",
    "Date",
    "RegExp",
    "Promise",
    "Proxy",
    "Reflect",
    "WeakMap",
    "WeakSet",
    "Map",
    "Set",
  ];

  const BLOCKED_PROPERTIES = [
    "constructor",
    "prototype",
    "__proto__",
    "eval",
    "Reflect",
    "Function",
    "AsyncFunction",
    "GeneratorFunction",
    "FunctionConstructor",
    "require",
  ];

  function isDangerousEstree(program: Program): boolean {
    return walk(program, null);

    function isEstreeNode(value: unknown): value is EstreeNode {
      return (
        typeof value === "object" &&
        value !== null &&
        "type" in value &&
        typeof (value as { type?: unknown }).type === "string"
      );
    }

    function walk(node: unknown, parent: EstreeNode | null): boolean {
      if (!node || typeof node !== "object") return false;

      if (!isEstreeNode(node)) return false;

      // -------------------------------------------------
      // 1️⃣ Block MetaProperty (e.g., import.meta)
      // -------------------------------------------------
      if (node.type === "MetaProperty") {
        return true;
      }

      // -------------------------------------------------
      // 2️⃣ Block Super
      // -------------------------------------------------
      if (node.type === "Super") {
        return true;
      }

      // -------------------------------------------------
      // 6️⃣ new Function(), new eval(), etc.
      // actually identifer check below is enough to catch these
      // -------------------------------------------------
      // if (node.type === "NewExpression") {
      //   if (node.callee.type === "Identifier" && BLOCKED_GLOBALS.includes(node.callee.name)) {
      //     return true;
      //   }
      // }

      // -------------------------------------------------
      // 3️⃣ Identifier checks
      // -------------------------------------------------
      if (node.type === "Identifier") {
        if (BLOCKED_GLOBALS.includes(node.name)) {
          const isProperty =
            parent?.type === "MemberExpression" && parent.property === node && !parent.computed;

          const isParam =
            parent &&
            (parent.type === "FunctionDeclaration" ||
              parent.type === "FunctionExpression" ||
              parent.type === "ArrowFunctionExpression") &&
            parent.params.includes(node); // safe: params are Pattern[]

          if (!isProperty && !isParam) {
            return true;
          }
        }
      }

      // -------------------------------------------------
      // 4️⃣ CallExpression checks
      // -------------------------------------------------
      if (node.type === "CallExpression") {
        // Direct call: eval(), require(), etc.
        if (node.callee.type === "Identifier" && BLOCKED_GLOBALS.includes(node.callee.name)) {
          return true;
        }

        // Computed call on blocked global: process[expr]()
        if (
          node.callee.type === "MemberExpression" &&
          node.callee.computed &&
          node.callee.object.type === "Identifier" &&
          BLOCKED_GLOBALS.includes(node.callee.object.name)
        ) {
          return true;
        }

        // Computed call on builtin constructor: Object[expr]()
        if (
          node.callee.type === "MemberExpression" &&
          node.callee.computed &&
          node.callee.object.type === "Identifier" &&
          BUILTIN_CONSTRUCTORS.includes(node.callee.object.name)
        ) {
          return true;
        }
      }

      // -------------------------------------------------
      // 5️⃣ MemberExpression checks
      // -------------------------------------------------
      if (node.type === "MemberExpression") {
        const prop = node.property;

        // obj.constructor / obj.prototype
        if (
          prop.type === "Identifier" &&
          !node.computed &&
          BLOCKED_PROPERTIES.includes(prop.name)
        ) {
          return true;
        }

        // obj["constructor"]
        if (prop.type === "Literal" && BLOCKED_PROPERTIES.includes(String(prop.value))) {
          return true;
        }

        // computed access on blocked global
        if (
          node.computed &&
          node.object.type === "Identifier" &&
          BLOCKED_GLOBALS.includes(node.object.name)
        ) {
          return true;
        }

        // direct access on blocked global
        if (node.object.type === "Identifier" && BLOCKED_GLOBALS.includes(node.object.name)) {
          return true;
        }
      }

      // -------------------------------------------------
      // 6️⃣ ImortExpreesions such as import("fs")
      // -------------------------------------------------
      if (node.type === "ImportExpression") {
        return true;
      }

      // -------------------------------------------------
      // 7️⃣ Structural recursion
      // -------------------------------------------------

      for (const key of Object.keys(node)) {
        const value = node[key as keyof typeof node];

        if (Array.isArray(value)) {
          for (const child of value) {
            if (walk(child, node)) return true;
          }
        } else {
          if (walk(value, node)) return true;
        }
      }

      return false;
    }
  }

  return (tree: Root): undefined => {
    remove(tree, (node) => {
      if (!isMdxExpression(node)) return false;

      // Remove everything mode
      if (!onlyDangerousExpressions) return true;

      // Remove only dangerous mode
      const estree = node.data?.estree;
      /* v8 ignore next -- @preserve */
      if (!estree) return false;
      return isDangerousEstree(estree);
    });

    if (!includeJsxAttributes) return;

    visit(tree, (node) => {
      if (!isMdxJsxElement(node)) return;
      /* v8 ignore next -- @preserve */
      if (!node.attributes) return;

      node.attributes = node.attributes.filter(
        (attr: MdxJsxAttribute | MdxJsxExpressionAttribute) => {
          // Remove spread attributes
          if (attr.type === "mdxJsxExpressionAttribute") {
            if (!onlyDangerousExpressions) return false;

            const estree = attr.data?.estree;
            /* v8 ignore next -- @preserve */
            if (!estree) return true;
            return !isDangerousEstree(estree);
          }

          // Keep boolean attributes
          if (!attr.value) return true;

          // Remove expression attributes
          if (
            typeof attr.value !== "string" &&
            attr.value &&
            attr.value.type === "mdxJsxAttributeValueExpression"
          ) {
            if (!onlyDangerousExpressions) return false;

            const estree = attr.value.data?.estree;
            /* v8 ignore next -- @preserve */
            if (!estree) return true;
            return !isDangerousEstree(estree);
          }

          // SKeep string attributes
          return true;
        },
      );
    });
  };
};

export default RemarkMdxRemoveExpressions;
