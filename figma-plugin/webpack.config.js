const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const isProduction = process.env.NODE_ENV === 'production';

module.exports = [
  // Plugin code configuration (runs in Figma sandbox)
  {
    name: 'plugin',
    mode: isProduction ? 'production' : 'development',
    devtool: false, // Disable source maps for plugin code

    entry: './src/plugin/code.ts',

    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'code.js',
      clean: false,
      globalObject: 'this',
      library: {
        type: 'umd',
        name: 'AnimaGenPlugin'
      }
    },
  
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx'],
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@ui': path.resolve(__dirname, 'src/ui'),
        '@plugin': path.resolve(__dirname, 'src/plugin'),
        '@shared': path.resolve(__dirname, 'src/shared')
      }
    },

    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: [
            {
              loader: 'ts-loader',
              options: {
                transpileOnly: !isProduction,
                configFile: 'tsconfig.json'
              }
            }
          ],
          exclude: /node_modules/
        }
      ]
    },

    target: 'web',
    externals: {
      figma: 'figma'
    },

    optimization: {
      minimize: false,
      splitChunks: false,
      runtimeChunk: false,
      concatenateModules: true
    },

    plugins: [
      // Copy manifest.json
      {
        apply: (compiler) => {
          compiler.hooks.afterEmit.tap('CopyManifest', () => {
            const fs = require('fs');
            const path = require('path');

            const manifestSource = path.resolve(__dirname, 'manifest.json');
            const manifestDest = path.resolve(__dirname, 'dist/manifest.json');

            if (fs.existsSync(manifestSource)) {
              fs.copyFileSync(manifestSource, manifestDest);
              console.log('✅ Manifest copied to dist/');
            }
          });
        }
      }
    ]
  },

  // UI configuration (runs in browser)
  {
    name: 'ui',
    mode: isProduction ? 'production' : 'development',
    devtool: isProduction ? 'source-map' : 'eval-source-map',

    entry: './src/ui/index.tsx',

    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'ui.js',
      clean: false
    },

    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx'],
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@ui': path.resolve(__dirname, 'src/ui'),
        '@plugin': path.resolve(__dirname, 'src/plugin'),
        '@shared': path.resolve(__dirname, 'src/shared')
      }
    },

    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: [
            {
              loader: 'ts-loader',
              options: {
                transpileOnly: !isProduction,
                configFile: 'tsconfig.json'
              }
            }
          ],
          exclude: /node_modules/
        },
        {
          test: /\.module\.css$/,
          use: [
            isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
            {
              loader: 'css-loader',
              options: {
                modules: {
                  localIdentName: isProduction
                    ? '[hash:base64:8]'
                    : '[name]__[local]__[hash:base64:5]'
                },
                importLoaders: 1
              }
            },
            'postcss-loader'
          ]
        },
        {
          test: /\.css$/,
          exclude: /\.module\.css$/,
          use: [
            isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
            'css-loader',
            'postcss-loader'
          ]
        },
        {
          test: /\.(png|jpg|jpeg|gif|svg)$/i,
          type: 'asset/resource',
          generator: {
            filename: 'assets/images/[name].[hash][ext]'
          }
        }
      ]
    },

    plugins: [
      new HtmlWebpackPlugin({
        template: './src/ui/index.html',
        filename: 'ui.html',
        chunks: ['main'],
        inject: 'body',
        minify: isProduction ? {
          removeComments: true,
          collapseWhitespace: true,
          removeRedundantAttributes: true,
          useShortDoctype: true,
          removeEmptyAttributes: true,
          removeStyleLinkTypeAttributes: true,
          keepClosingSlash: true,
          minifyJS: true,
          minifyCSS: true,
          minifyURLs: true
        } : false
      }),

      ...(isProduction ? [
        new MiniCssExtractPlugin({
          filename: '[name].[contenthash].css'
        })
      ] : [])
    ],

    optimization: {
      minimize: isProduction,
      splitChunks: false,
      runtimeChunk: false
    },

    target: ['web', 'es2020'],

    devServer: {
      static: {
        directory: path.join(__dirname, 'dist'),
      },
      compress: true,
      port: 3001,
      hot: true,
      open: false
    },

    stats: {
      colors: true,
      modules: false,
      children: false,
      chunks: false,
      chunkModules: false
    }
  }
];
