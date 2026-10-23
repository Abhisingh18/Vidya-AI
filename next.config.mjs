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
        './node_modules/onnxruntime-node/bin/napi-v3/linux/x64/**',
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
      ],
    },
  },
};

export default nextConfig;
