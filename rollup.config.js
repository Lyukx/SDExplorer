import node from "rollup-plugin-node-resolve";

export default {
  entry: "index.js",
  format: "umd",
  moduleName: "sd",
  plugins: [node()],
  dest: "./test/sd.js"
};
