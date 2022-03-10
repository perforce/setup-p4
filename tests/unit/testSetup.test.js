
const { mapOS, p4SemVersion , perforceBuild } = require('../../lib/setup');

test('Converting P4 version to semantic version', () => {
    expect(p4SemVersion('21.2')).toBe('2.1.2')
    expect(p4SemVersion('21.1')).toBe('2.1.1')
    expect(p4SemVersion('20.2')).toBe('2.0.2')
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
