export default {
  async fetch(request, env) {
    // For static sites, we just serve the assets directly
    // The ASSETS binding will handle all static file requests
    return env.ASSETS.fetch(request);
  },
};
