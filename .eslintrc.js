module.exports = {
  "env": {
      "phantomjs": true,
      "browser": true
  },
  
  "extends": [
      "eslint:recommended"
  ],
  
  "plugins": [
      "prettier"
  ],

  "rules": {
      "prettier/prettier": "error",
      "no-console": "off",
  },

  "globals": {
    "__utils__": true
  }
};