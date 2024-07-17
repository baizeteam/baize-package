// webpack.base.js
const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const webpackAddCdnScript = require("../../dist/index.umd.cjs");

const externals = {
  react: "React",
  "react-dom": "ReactDOM",
  "@remix-run/router": "@remix-run/router",
  "react-router": "react-router",
  "react-router-dom": "ReactRouterDOM",
};
module.exports = {
  entry: path.join(__dirname, "./src/index.tsx"),
  output: {
    filename: "static/js/[name].js",
    path: path.join(__dirname, "./dist"),
    clean: true,
    publicPath: "/",
  },
  module: {
    rules: [
      {
        test: /.tsx?$/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-react", "@babel/preset-typescript"],
          },
        },
      },
    ],
  },
  externals: externals,
  resolve: {
    extensions: [".js", ".tsx", ".ts"],
  },
  plugins: [
    new webpackAddCdnScript({}),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, "./public/index.html"), // 模板取定义root节点的模板
      inject: true, // 自动注入静态资源
    }),
  ],
};
