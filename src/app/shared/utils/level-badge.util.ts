export function getLevelBadgeAsset(level: number): string {
  if (level >= 20) {
    return 'assets/level/lvl20.png';
  }

  if (level >= 18) {
    return 'assets/level/lvl18,19.png';
  }

  if (level >= 16) {
    return 'assets/level/lvl16,17.png';
  }

  if (level >= 14) {
    return 'assets/level/lvl14,15.png';
  }

  if (level >= 12) {
    return 'assets/level/lvl12,13.png';
  }

  if (level >= 10) {
    return 'assets/level/lvl10,11.png';
  }

  if (level >= 8) {
    return 'assets/level/lvl8,9.png';
  }

  if (level >= 5) {
    return 'assets/level/lvl5,6,7.png';
  }

  switch (level) {
    case 4:
      return 'assets/level/lvl4.png';
    case 3:
      return 'assets/level/lvl3.png';
    case 2:
      return 'assets/level/lvl2.png';
    case 1:
    default:
      return 'assets/level/lvl1.png';
  }
}
