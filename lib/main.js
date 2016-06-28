'use babel';

import Provider from './provider';

export default {
  getProvider() {
    return new Provider();
  }
};
