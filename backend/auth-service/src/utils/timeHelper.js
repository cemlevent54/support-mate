class TimeHelper {
  static parseDuration(str) {
    if (typeof str !== 'string') return 0;
    if (str.endsWith('m')) return parseInt(str) * 60 * 1000;
    if (str.endsWith('h')) return parseInt(str) * 60 * 60 * 1000;
    if (str.endsWith('d')) return parseInt(str) * 24 * 60 * 60 * 1000;
    return parseInt(str);
  }
}

export default TimeHelper; 