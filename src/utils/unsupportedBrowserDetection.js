import UAParser from 'ua-parser-js';
import semverCompare from 'semver-compare';

const DEFAULT_SUPPORTED_BROWSERS_CONFIG = {
  desktop: [{
    browser: 'firefox', minversion: 41,
  }, {
    browser: 'ie', versions: [11, 'edge'],
  }, {
    browser: 'chrome', minversion: 45,
  }, {
    browser: 'edge',
  }, {
    os: 'mac os', minos: '10.10.0', browser: 'safari', minversion: 8,
  }],
  tablet: [{
    os: 'ios', minos: '9', browser: 'mobile safari',
  }, {
    os: 'android', minos: '5.0', browser: 'chrome',
  }, {
    browser: 'ie', versions: [11, 'edge'],
  }, {
    browser: 'edge',
  }],
  mobile: [{
    os: 'ios', minos: '9', browser: 'mobile safari',
  }, {
    os: 'ios', minos: '5.0', browser: 'chrome',
  }, {
    os: 'android', minos: '5.0', browser: 'chrome', minversion: 50,
  }],
};

export default class UnsupportedBrowserDetection {
  parser = new UAParser();

  constructor(config = DEFAULT_SUPPORTED_BROWSERS_CONFIG, isInAppBrowserSupported = true) {
    this.supportedBrowsersConfig = config;
    this.isInAppBrowserSupported = isInAppBrowserSupported;
  }

  get isInAppBrowser() {
    return (
      (this.ua.indexOf('FBAN') > -1) ||
      (this.ua.indexOf('FBAV') > -1) ||
      (this.ua.indexOf('Twitter') > -1)
    );
  }

  get device() {
    return this.parser.getDevice();
  }

  get ua() {
    return this.parser.getUA();
  }

  get browser() {
    return this.parser.getBrowser();
  }

  get os() {
    return this.parser.getOS();
  }

  get deviceType() {
    const { type = 'desktop' } = this.device;
    return type;
  }

  compareVersions(a, b) {
    if (typeof a === 'string' || a instanceof String) {
      return semverCompare(a, b) <= 0;
    }

    return a <= parseInt(b, 10);
  }

  isSupported() {
    if (this.isInAppBrowser) {
      return this.isInAppBrowserSupported;
    }

    const { version: browserVersion } = this.browser;

    const isSupported = !this.supportedBrowsersConfig[this.deviceType]
      .every(options => {
        const { os, minos, browser, minversion, versions } = options;
        const parsedVersion = isNaN(parseInt(browserVersion, 10))
          ? browserVersion.toLocaleLowerCase()
          : parseInt(browserVersion, 10);

        const checked = {
          os: os === this.os.name.toLowerCase(),
          minos: this.compareVersions(minos, this.os.version),
          browser: browser === this.browser.name.toLowerCase(),
          minversion: this.compareVersions(minversion, browserVersion),
          versions: versions ? versions.indexOf(parsedVersion) >= 0 : false,
        };

        return Object.keys(options).map(key => checked[key]).indexOf(false) !== -1;
      });
    return isSupported;
  }
}
