import {
  resolve as resolvePath,
} from "path";

import {
  Observable,
} from "rx";

import {
  srcFileToSrcWithWorkspace,
  srcWithWorkspaceToSource,
  sourceToWebpackMultiCompiler,
  runWebpackMultiCompilerToMultiStats,
  joinStatsWithArgumentListToFinalBundle,
  finalBundleToOutputSideEffect,
} from "reacthtmlpack/lib/core";

import {
  default as NpmAutoInstallWebpackPlugin,
} from "npm-auto-install-webpack-plugin";

function addNpmAutoInstallWebpackPluginToSource (__source__) {
  return __source__
    .map(source => {
      const { customClientConfig, customServerConfig } = source;

      customClientConfig.plugins = [
        ...customClientConfig.plugins,
        new NpmAutoInstallWebpackPlugin(),
      ];

      return source;
    });
}

function build(
  __srcFile__: Observable,
  __outDir__: Observable,
  __prerenderPropsList__: Observable,
): Observable {
  const __source__ = __srcFile__
    .let(srcFileToSrcWithWorkspace)
    .let(srcWithWorkspaceToSource)
    .let(addNpmAutoInstallWebpackPluginToSource)
    .shareReplay();

  const __webpackMultiCompiler__ = __source__
    .let(sourceToWebpackMultiCompiler);

  const __webpackJoinStatsMap__ = __webpackMultiCompiler__
    .let(runWebpackMultiCompilerToMultiStats);

  const __finalBundle__ = __webpackJoinStatsMap__
    .withLatestFrom(
      __outDir__,
      __prerenderPropsList__,
      __source__,
    )
    .let(joinStatsWithArgumentListToFinalBundle);

  return __finalBundle__
    .let(finalBundleToOutputSideEffect);
}

const dirpath = process.env.MOUNT_DIRPATH;

build(
  Observable.of(resolvePath(dirpath, `./src/index.html`)),
  Observable.of(resolvePath(dirpath, `./public`)),
  Observable.of([{ location: `/` }]),
).subscribe(
  () => {
    console.log(`Next!`);
  }, (error) => {
    console.error(error.stack);
  }, () => {
    console.log(`Complete!`);
  }
)
