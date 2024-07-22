import path from 'path';
import { fileURLToPath } from 'url';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import ESLintPlugin from 'eslint-webpack-plugin';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import CompressionPlugin from 'compression-webpack-plugin';
import webpack from 'webpack';
import { WebpackManifestPlugin } from 'webpack-manifest-plugin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  entry: {
    main: './client/js/main.js',
    styles: './client/scss/main.scss',
    pageIndex: './client/js/pages/index.js',
    pageFoundMovies: './client/js/pages/foundMovies.js',
    pageIgnoredMovies: './client/js/pages/ignoredMovies.js',
    pageMissingMovies: './client/js/pages/missingMovies.js',
  },
  output: {
    filename: 'js/[name].[contenthash].js',
    path: path.resolve(__dirname, 'public'),
    publicPath: '/',
    clean: true,
  },
  optimization: {
    splitChunks: {
      chunks: 'async',
      minSize: 20000,
      minRemainingSize: 0,
      minChunks: 1,
      maxAsyncRequests: 30,
      maxInitialRequests: 30,
      enforceSizeThreshold: 50000,
      cacheGroups: {
        defaultVendors: {
          test: /[\\/]node_modules[\\/]/,
          priority: -10,
          reuseExistingChunk: true,
        },
        default: {
          minChunks: 2,
          priority: -20,
          reuseExistingChunk: true,
        },
      },
    },
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules|client\/js\/user-scripts/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
          },
        },
      },
      {
        test: /\.(sa|sc|c)ss$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              importLoaders: 2, // This ensures that postcss-loader and sass-loader run for @imported files
            },
          },
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                config: path.resolve(__dirname, 'postcss.config.cjs'),
              },
            },
          },
          'sass-loader',
        ],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif|webp)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'images/[name][ext][query]',
        },
        use: [
          {
            loader: 'image-webpack-loader',
            options: {
              mozjpeg: {
                progressive: true,
                quality: 85,
              },
              optipng: {
                enabled: false,
              },
              pngquant: {
                quality: [0.85, 0.9],
                speed: 4,
              },
              gifsicle: {
                interlaced: false,
              },
              webp: {
                quality: 85,
              },
            },
          },
        ],
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'fonts/[name][ext][query]',
        },
      },
    ],
  },
  plugins: [
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
      'window.jQuery': 'jquery',
      Popper: ['@popperjs/core', 'default'],
    }),
    new MiniCssExtractPlugin({
      filename: 'css/[name].[contenthash].css',
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: 'client/images', to: 'images' },
        {
          from: 'node_modules/@fortawesome/fontawesome-free/webfonts',
          to: 'webfonts',
        },
        {
          from: 'client/js/user-scripts/ptp_movie_checker.vm.user.js',
          to: 'js/ptp_movie_checker.vm.user.js',
          info: { minimized: true },
        },
      ],
    }),
    new ESLintPlugin({
      extensions: ['js'],
      fix: true,
      formatter: 'stylish',
      overrideConfigFile: path.resolve(__dirname, '.eslintrc.cjs'),
      emitWarning: true,
    }),
    // new BundleAnalyzerPlugin({
    //   analyzerMode: 'static',
    //   openAnalyzer: false,
    // }),
    new CompressionPlugin({
      test: /\.(js|css|html|svg)$/,
      algorithm: 'gzip',
    }),
    new WebpackManifestPlugin({
      fileName: 'manifest.json',
      publicPath: '/', // Ensure this matches your webpack config's output.publicPath
      generate: (seed, files, entrypoints) => {
        const manifest = {};
        Object.keys(entrypoints).forEach(entrypoint => {
          manifest[entrypoint] = {};
          const filteredFiles = entrypoints[entrypoint].filter(
            fileName => fileName.endsWith('.js') || fileName.endsWith('.css')
          );
          filteredFiles.forEach(fileName => {
            if (fileName.endsWith('.js')) {
              manifest[entrypoint].js = `/${fileName}`;
            }
            if (fileName.endsWith('.css')) {
              manifest[entrypoint].css = `/${fileName}`;
            }
          });
        });
        return manifest;
      },
    }),
  ],
  resolve: {
    extensions: ['.js', '.json', '.css', '.scss'],
    alias: {
      '@fortawesome': path.resolve(__dirname, 'node_modules/@fortawesome'),
    },
  },
};
