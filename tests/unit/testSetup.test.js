// // Mock external modules by default
// jest.mock('@actions/core');
// jest.mock('@actions/tool-cache');

// const os = require('os');
// const core = require('@actions/core');
// const tc = require('@actions/tool-cache');
// const { v4: uuidv4 } = require('uuid');
// const fs = require('fs')
// const path = require('path')


const { mapOS, p4semversion, run, perforceBuild } = require('../../lib/setup-p4');

test('Converting P4 version to semantic version', () => {
    expect(p4semversion('21.2')).toBe('2.1.2')
    expect(p4semversion('21.1')).toBe('2.1.1')
    expect(p4semversion('20.2')).toBe('2.0.2')
})

test('Map OS Platform', () => {
    expect(perforceBuild('linux')).toBe('linux26x86_64')
    expect(perforceBuild('macOS')).toBe('macosx1015x86_64')
    expect(perforceBuild('windows')).toBe('ntx64')
})

test('Map OS Platform', () => {
    expect(mapOS('linux')).toBe('linux')
    expect(mapOS('darwin')).toBe('macOS')
    expect(mapOS('win32')).toBe('windows')
})