'use strict';

const fs = require('fs');
const path = require('path');
const userHome = require('user-home');
const pathIsAbsolute = require('path-is-absolute');
const stripJsonComments = require('strip-json-comments');
const Glob = require('glob').Glob;

/**
 * @description Sets the return config if one if found.
 * @param  {string} configPath - Where to look for config.
 * @returns {Object|void} Object if stylintrc found, undefined if not.
 */
function parseConfig(configPath) {
  return JSON.parse(
    stripJsonComments(
      fs.readFileSync(configPath, 'utf-8')
    )
  );
}

/**
 * @description Reverse walk from cwd to usr.
 *              If .stylintrc found, use it.
 * @param  {Array<string>} files - All files for this dir level.
 * @param  {number} level - Number of dirs traversed so far.
 * @param  {string} cwd  - Relative path to current directory being walked.
 * @returns {?Object|?Function} Config if found, recurse if not. null if failed.
 */
function recurseDirectories(files, level, cwd) {
  let localLevel = level;

  // parse stylintrc if found, stop recursion
  if (files.indexOf('.stylintrc') !== -1) {
    return parseConfig(`${cwd}/.stylintrc`);
  }

  // only go up to user home directory, stop recursion
  if (userHome) return null;

  // next dir level
  const nextLevel = level + 1;
  // pathArr is generated by applying our dir level
  // to cwd, and going backwards
  // ie, level = 1, pathArr = [ cwd, '..' ]
  // ie, level = 2, pathArr = [ cwd, '..', '..' ]
  // and so on
  const pathArr = [cwd];

  // push '..' for each dir level
  while (localLevel--) {
    pathArr.push('..');
  }

  // creates the path to the next directory
  const newPath = path.join.apply(null, pathArr);
  // gets the files for the next directory
  const newFiles = fs.readdirSync(newPath);
  // passes the newFiles, nextLevel, and newPath to itself
  // to start the process over again
  return recurseDirectories(newFiles, nextLevel, newPath);
}

// @TODO i just this sloppy just to fix some stuff
// comes back and refactor / cleanup

/**
 * @description Overrides default config with a new config object.
 *              Many potential code paths here.
 * 1: user passed in config object via function param
 * 2: user passes location of .stylintrc file to use via cli
 * 3: user has options obj in package.json or path to
 * 4: none of the above, fallback to initial config
 * 5: user has a .stylintrc file in a dir but doesn't pass anything
 * @param {string} [configPath] - If defined, the path to a config-file to read.
 * @returns {Function} Kick off linter again.
 */
const setConfig = function (configPath) {
  let files = [];
  let customPath = '';
  // return default config if nothing passed in or found
  let returnConfig;
  const cwd = process.cwd();
  let pkg = null;
  try {
    // TODO: Use pkg-up
    // eslint-disable-next-line import/no-dynamic-require
    pkg = require(`${cwd}/package.json`);
  }
  catch (err) {
    // no output
  }

  // if 1, the customConfig will be what we want
  // this only occurs if using stylint programmatically
  // ie, user passed in option object
  if (this.customConfig) {
    returnConfig = this.customConfig;
  }
  // if 2, we pass in a path to the config
  // this only occurs if using stylint via the command line
  else if (configPath) {
    customPath = pathIsAbsolute(configPath) ? configPath : `${cwd}/${configPath}`;
    try {
      returnConfig = parseConfig(customPath);
    }
    catch (err) {
      throw err;
    }
  }
  // 3, if user did not pass in option obj, or pass options via cli
  // check the user's package.json for either an option obj, or
  // at least a path to one
  else if (pkg !== null &&
    typeof pkg.stylintrc !== 'undefined') {
    const rc = pkg.stylintrc;

    if (typeof rc === 'object' && !(rc instanceof Array)) {
      returnConfig = rc;
    }
    else if (typeof rc === 'string') {
      returnConfig = parseConfig(rc);
    }
  }
  // 4, nothing passed in via cli or programmatically or via pkg
  // start at cwd, walk up to user home directory, if nothing
  // found, then just use the default config
  else {
    try {
      // recurse up to user home
      files = fs.readdirSync(cwd);
      // null if .stylintrc file found anywhere
      returnConfig = recurseDirectories(files, 1, cwd);

      // default config if nothing found
      if (!returnConfig) {
        returnConfig = this.config;
      }
    }
      // in case there's an issue parsing or no .stylintrc found at specified location
    catch (err) {
      throw err;
    }
  }

  returnConfig.exclude = (returnConfig.exclude || []).map(exclude => new Glob(exclude, {
    matchBase: true,
  }).minimatch);

  // make sure indentPref is set no matter what
  returnConfig.indentPref = returnConfig.indentPref || false;

  // 5, just return the default config if nothing found
  return returnConfig;
};

module.exports = setConfig;
