/**
 * Registro centralizado das imagens do mascote Doutor Gentileza.
 *
 * React Native exige require() estatico (analise em compile-time).
 * Imagens sao bundled no APK, funcionam offline.
 */

export const MASCOT_POSES = [
  require("../../assets/mascot/pose-1.jpg"),
  require("../../assets/mascot/pose-2.jpg"),
  require("../../assets/mascot/pose-3.jpg"),
  require("../../assets/mascot/pose-4.jpg"),
  require("../../assets/mascot/pose-5.jpg"),
  require("../../assets/mascot/pose-6.jpg"),
  require("../../assets/mascot/pose-7.jpg"),
  require("../../assets/mascot/pose-8.jpg"),
];

export const MASCOT_ANALYZING = require("../../assets/mascot/analyzing.jpg");

export const MASCOT_GIFT = require("../../assets/mascot/gift.jpg");

export function getRandomMascotPose() {
  const index = Math.floor(Math.random() * MASCOT_POSES.length);
  return MASCOT_POSES[index];
}
