// O app trava em retrato (orientation: portrait). O Android deduz disso que
// android.hardware.screen.portrait e obrigatorio, e a Play passa a esconder o app
// de aparelhos sem esse recurso (Chromebook, XR, alguns tablets) e alerta no envio.
// Aqui declaramos os recursos de tela como opcionais no AndroidManifest.
const { withAndroidManifest } = require('expo/config-plugins');

const RECURSOS_OPCIONAIS = [
  'android.hardware.screen.portrait',
  'android.hardware.screen.landscape',
];

module.exports = function recursosHardwareOpcionais(config) {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;
    const lista = (manifest['uses-feature'] = manifest['uses-feature'] || []);
    for (const nome of RECURSOS_OPCIONAIS) {
      const existente = lista.find((f) => f.$['android:name'] === nome);
      if (existente) existente.$['android:required'] = 'false';
      else lista.push({ $: { 'android:name': nome, 'android:required': 'false' } });
    }
    return cfg;
  });
};
