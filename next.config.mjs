/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Piper narration (src/lib/piper.ts) loads these at runtime with require():
    // a native module and an emscripten build that reads its .wasm/.data from disk.
    serverComponentsExternalPackages: ['onnxruntime-node', '@diffusionstudio/piper-wasm'],
    outputFileTracingIncludes: {
      '/api/tts': [
        './node_modules/onnxruntime-node/package.json',
        './node_modules/onnxruntime-node/dist/**',
        // CPU build only: the binding loads libonnxruntime.so.1
        './node_modules/onnxruntime-node/bin/napi-v3/linux/x64/onnxruntime_binding.node',
        './node_modules/onnxruntime-node/bin/napi-v3/linux/x64/libonnxruntime.so.1',
        './node_modules/onnxruntime-node/bin/napi-v3/linux/x64/libonnxruntime_providers_shared.so',
        './node_modules/onnxruntime-common/**',
        './node_modules/@diffusionstudio/piper-wasm/package.json',
        './node_modules/@diffusionstudio/piper-wasm/build/**',
      ],
    },
    outputFileTracingExcludes: {
      '/api/tts': [
        './node_modules/onnxruntime-node/bin/napi-v3/darwin/**',
        './node_modules/onnxruntime-node/bin/napi-v3/win32/**',
        './node_modules/onnxruntime-node/bin/napi-v3/linux/arm64/**',
        './node_modules/onnxruntime-node/bin/napi-v3/linux/x64/*{cuda,tensorrt}*',
        './node_modules/onnxruntime-node/bin/napi-v3/linux/x64/libonnxruntime.so.1.*',
      ],
    },
  },
};

export default nextConfig;
