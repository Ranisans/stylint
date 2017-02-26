'use strict';

const stylint = require('../../index');

const app = stylint().create();

// turn on strict mode from this point and turn off unnecessary logging
app.state.quiet = true;
app.state.watching = true;
app.state.strictMode = true;

const dupeTest = app.lintMethods.duplicates.bind(app);

describe('duplicates', () => {
  beforeEach(() => {
    app.state.conf = 'always';
    app.state.severity = 'warning';
  });

  afterEach(() => {
    app.cache.messages = [];
  });

  it('tabs: false if no dupe, not root, diff context, same selector', () => {
    app.config.indentPref = 'tabs';
    app.cache.file = 'file.styl';
    app.cache.prevFile = 'file.styl';
    app.state.context = app.setContext('  .test'); // 1
    dupeTest('  .test');
    app.state.context = app.setContext('      .test'); // 3
    expect(dupeTest('      .test')).toEqual(false);
  });

  it('tabs: false if globalDupe off, diff files, same context, same selector', () => {
    app.config.globalDupe = true;
    app.cache.prevFile = 'file5.styl';
    app.cache.file = 'file6.styl';
    app.state.context = app.setContext('  .test'); // 1
    app.state.context = app.setContext('  .test'); // 1
    expect(dupeTest('  .test')).toEqual(false);
    app.config.globalDupe = false;
  });

  it('tabs: false if prev selector was in a list, same file, same context, same selector', () => {
    app.cache.prevFile = 'file.styl';
    app.cache.file = 'file.styl';
    app.state.context = app.setContext('  .classy,'); // to set the context
    dupeTest('  .classy,'); // prev selector
    expect(dupeTest('  .classy')).toEqual(false);
  });

  it('tabs: false if selector is in a list', () => {
    expect(dupeTest('  .classy,')).toEqual(false);
  });

  it('tabs: false if global dupe off and file changed', () => {
    dupeTest('  .test4'); // to set the context
    app.cache.prevFile = 'file.styl';
    app.cache.file = 'file2.styl';
    app.config.globalDupe = false;
    expect(dupeTest('  .test4')).toEqual(false);
  });

  it('spaces: false if no dupe, not root, diff context, same selector', () => {
    app.config.indentPref = 4;
    app.cache.file = 'file.styl';
    app.cache.prevFile = 'file.styl';
    app.state.context = app.setContext('    .test'); // 1
    dupeTest('    .test');
    app.state.context = app.setContext('            .test'); // 3
    expect(dupeTest('            .test')).toEqual(false);
  });

  it('spaces: false if globalDupe off, diff files, same context, same selector', () => {
    app.config.globalDupe = true;
    app.cache.prevFile = 'file5.styl';
    app.cache.file = 'file6.styl';
    app.state.context = app.setContext('    .test'); // 1
    app.state.context = app.setContext('    .test'); // 1
    expect(dupeTest('    .test')).toEqual(false);
    app.config.globalDupe = false;
  });

  it('spaces: false if prev selector was in a list, same file, same context, same selector', () => {
    app.cache.prevFile = 'file.styl';
    app.cache.file = 'file.styl';
    app.state.context = app.setContext('    .classy,'); // to set the context
    dupeTest('    .classy,'); // prev selector
    expect(dupeTest('    .classy')).toEqual(false);
  });

  it('spaces: false if selector is in a list', () => {
    expect(dupeTest('    .classy,')).toEqual(false);
  });

  it('space: false if global dupe off and file changed', () => {
    dupeTest('    .test4'); // to set the context
    app.cache.prevFile = 'file.styl';
    app.cache.file = 'file2.styl';
    app.config.globalDupe = false;
    expect(dupeTest('    .test4')).toEqual(false);
  });

  it('false if root selector dupe was in list', () => {
    app.state.context = 0;
    app.state.prevContext = 0;
    app.config.globalDupe = false;
    app.cache.file = 'file.styl';
    dupeTest('.test,'); // to set the context
    expect(dupeTest('.test')).toEqual(false);
  });

  it('tabs: true if nested selector is dupe', () => {
    app.cache.prevFile = 'file.styl';
    app.cache.file = 'file.styl';
    app.state.context = 1;
    app.state.prevContext = 1;
    dupeTest('  .test');
    expect(dupeTest('  .test')).toBeDefined();
  });

  it('spaces: true if nested selector is dupe', () => {
    app.cache.prevFile = 'file.styl';
    app.cache.file = 'file.styl';
    app.state.context = 1;
    app.state.prevContext = 1;
    dupeTest('    .test2');
    expect(dupeTest('    .test2')).toBeDefined();
  });

  it('true if root selector is dupe, same file', () => {
    app.state.context = 0;
    app.state.prevContext = 0;
    dupeTest('.test3'); // to set the context
    expect(dupeTest('.test3')).toBeDefined();
  });

  it('true if root selector is dupe, global dupe test', () => {
    app.state.context = 0;
    app.state.prevContext = 0;
    app.config.globalDupe = true;
    app.cache.prevFile = 'file.styl';
    dupeTest('.test'); // to set the context
    app.cache.file = 'file2.styl';
    expect(dupeTest('.test')).toBeDefined();
    app.config.globalDupe = false;
  });
});
