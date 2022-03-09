
// os in [darwin, linux, win32...] (https://nodejs.org/api/os.html#os_os_platform)
// return value in [darwin, linux, windows]
function mapOS(os) {
  const mappings = {
    darwin: "macOS",
    win32: "windows",
  };
  return mappings[os] || os;
}

function perforceBuild(os) {
  const mappings = {
    linux: "linux26x86_64",
    macOS: "macosx1015x86_64",
    windows: "ntx64",
  };
  return mappings[os] || os;
}

// p4version in [21.2, 21.1, 20.2] (https://ftp.perforce.com/perforce/r21.2/)
// return value in [2.1.2, 2.1.1, 2.0.2]
// https://github.com/actions/toolkit/issues/709
function p4SemVersion(v) {
  return [v.slice(0, 1), ".", v.slice(1)].join("");
}

module.exports = { mapOS, p4SemVersion, perforceBuild };
