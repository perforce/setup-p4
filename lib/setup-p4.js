const os = require('os');
const core = require('@actions/core');
const tc = require('@actions/tool-cache');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs')
const path = require('path')

// arch in [arm, x32, x64...] (https://nodejs.org/api/os.html#os_os_arch)
// return value in [amd64, 386, arm]
function mapArch(arch) {
  const mappings = {
    x32: '386',
    x64: 'amd64'
  };
  return mappings[arch] || arch;
}

// os in [darwin, linux, win32...] (https://nodejs.org/api/os.html#os_os_platform)
// return value in [darwin, linux, windows]
export function mapOS(os) {
    const mappings = {
      darwin: 'macOS',
      win32: 'windows'
    };
    return mappings[os] || os;
}

function perforceBuild(os) {
    const mappings = {
      linux : 'linux26x86_64',
      macOS: 'macosx1015x86_64',
      windows: 'ntx64'
    };
    return mappings[os] || os;
}

// p4version in [21.2, 21.1, 20.2] (https://ftp.perforce.com/perforce/r21.2/)
// return value in [2.1.2, 2.1.1, 2.0.2]
// https://github.com/actions/toolkit/issues/709
export function p4semversion(v) {
    return [v.slice(0, 1), '.', v.slice(1)].join('');
}

export async function run (version) {
  try {
    const osPlatform = os.platform();
    const platform = mapOS(osPlatform);
    const base_url = 'https://cdist2.perforce.com/perforce';
    const extension = platform === 'windows' ? 'zip' : 'tgz';
    const build = perforceBuild(platform)

    // These are the downloads we support today:
    // https://ftp.perforce.com/perforce/r21.2/bin.linux26x86_64/helix-core-server.tgz
    // https://ftp.perforce.com/perforce/r21.2/bin.ntx64/helix-core-server.zip
    // https://ftp.perforce.com/perforce/r21.2/bin.macosx1015x86_64/helix-core-server.tgz
    
    // From what I can tell tool-cache does not like working with non archives.  We do not distribute p4 as a stand alone archive
    // download the server archive and we will only cache the p4 binary
    const url = `${base_url}/r${version}/bin.${build}/helix-core-server.${extension}`
    core.debug(`Starting download using URL: ${url}`);

    // On Windows `ExtractToDirectory` DotNet is used first to attempt the extract the archive.  If this fails it switches over to `Expand-Archive` (PowerShell).  
    // PowerShell fails because the downloaded file does not have a file extension
    // On selfhosted Windows ExtractToDirectory must not be available so both methods fail to expand. 
    // Provide a destination for the download so we can guarantee that the file has an extension
    const dest = path.join(process.env['RUNNER_TEMP'] || '', `${uuidv4()}.${extension}`)
    // fs.mkdir(path.dirname(dest), {recursive: true})
    await fs.promises.mkdir(path.dirname(dest), { recursive: true })

    const pathToCLIZip = await tc.downloadTool(url, dest);
  
    core.debug('Starting to expand p4 archive');
    const pathToCLI = platform === 'windows' ? await tc.extractZip(pathToCLIZip) : await tc.extractTar(pathToCLIZip);
  
    if (!pathToCLIZip || !pathToCLI ) {
      throw new Error(`Unable to download p4 from ${url}`);
    }
    const cachedPath = await tc.cacheDir(pathToCLI, 'p4', p4semversion(version));
    core.addPath(cachedPath);
    
  } catch (error) {
    core.error(error);
    throw error;
  }
}

// module.exports = run;
