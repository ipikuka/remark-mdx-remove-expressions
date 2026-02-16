import React from "react";

export const Component = ({ id, enabled, isOkey, value, dangerous, ...rest }) => {
  const results = [];

  if (id === undefined) {
    results.push("id");
  }

  if (enabled === undefined) {
    results.push("enabled");
  }

  if (isOkey === undefined) {
    results.push("isOkey");
  }

  if (value === undefined) {
    results.push("value");
  }

  if (dangerous === undefined) {
    results.push("dangerous");
  }

  if (!Object.keys(rest).length) {
    results.push("...rest");
  }

  return <p>removed attributes:[{results.join(", ")}]</p>;
};
