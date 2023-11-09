const core = require("@actions/core");
const tc = require("@actions/tool-cache");
require("shelljs/global");
const os = require("os");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const path = require("path");
const setup = require("./lib/setup");
const { execSync } = require('child_process');

const inputCommand = core.getInput("command");
const globalOptions = core.getInput("global_options");
const args = core.getInput("arguments");
const spec = core.getInput("spec");
const p4Version = core.getInput("p4_version");
const command = `p4 ${globalOptions} ${inputCommand} ${args}`;
const platform = os.platform();
const cwd = core.getInput("working_directory");

// To allow using environment variables in working_directory drop down
// to the shell to expand the environment variables.
// trim off any leading or trailing whitespace
// remove any single or double quotes.
const expanded_cwd = execSync(`echo "${cwd}"`)
  .trim()
  .replace(/['"]+/g, '');

core.debug(`p4 version is: ${p4Version}`);
core.debug(`p4 semantic version is: ${setup.p4SemVersion(p4Version)}`);
core.debug(`input command is: ${inputCommand}`);
core.debug(`global options is: ${globalOptions}`);
core.debug(`arguments is: ${args}`);
core.debug(`command is: ${command}`);
core.debug(`spec is: ${spec}`);
core.debug(`working directory is set to: ${cwd}`);
core.debug(`expanded working directory is set to: ${expanded_cwd}`);

if (inputCommand === "") {
  core.setFailed(
    "Please provide a `command` to run."
  );
}

async function setupP4(callback) {
  let toolPath = "";
  toolPath = tc.find("p4", setup.p4SemVersion(p4Version));

  if (toolPath) {
    core.debug(`Found in cache @ ${toolPath}`);
    const allVersions = tc.findAllVersions("p4");
    core.debug(
      `Found the following versions of p4 in the cache: ${allVersions}`
    );
    // since the version of the binary we need is found just add it to the PATH
    core.addPath(toolPath);
  } else {
    const osPlatform = os.platform();
    const platform = setup.mapOS(osPlatform);
    const base_url = "https://cdist2.perforce.com/perforce";
    const extension = platform === "windows" ? "zip" : "tgz";
    const build = setup.perforceBuild(platform);

    // These are the downloads we support today:
    // https://cdist2.perforce.com/perforce/r21.2/bin.linux26x86_64/helix-core-server.tgz
    // https://cdist2.perforce.com/perforce/r21.2/bin.ntx64/helix-core-server.zip
    // https://cdist2.perforce.com/perforce/r21.2/bin.macosx1015x86_64/helix-core-server.tgz

    // From what I can tell tool-cache does not like working with non archives.  We do not distribute p4 as a stand alone archive
    // download the server archive and we will only cache the p4 binary
    const url = `${base_url}/r${p4Version}/bin.${build}/helix-core-server.${extension}`;
    core.debug(`Starting download using URL: ${url}`);

    // On Windows `ExtractToDirectory` DotNet is used first to attempt the extract the archive.  If this fails it switches over to `Expand-Archive` (PowerShell).
    // PowerShell fails because the downloaded file does not have a file extension
    // On selfhosted Windows ExtractToDirectory must not be available so both methods fail to expand.
    // Provide a destination for the download so we can guarantee that the file has an extension
    const dest = path.join(
      process.env["RUNNER_TEMP"] || "",
      `${uuidv4()}.${extension}`
    );

    fs.promises.mkdir(path.dirname(dest), { recursive: true });
    const pathToCLIZip = await tc.downloadTool(url, dest);
    const pathToCLI =
      platform === "windows"
        ? await tc.extractZip(pathToCLIZip)
        : await tc.extractTar(pathToCLIZip);

    if (!pathToCLIZip || !pathToCLI) {
      throw new Error(`Unable to download p4 from ${url}`);
    }
    const cachedPath = await tc.cacheDir(
      pathToCLI,
      "p4",
      setup.p4SemVersion(p4Version)
    );
    core.addPath(cachedPath);
  }

  callback();
}

function main() {
  // Change all nonzero exit codes within shelljs into fatal
  // Without this p4 commands that exit with a nonzero would be ignored and GitHub Actions
  // would continue onto the next workflow step
  // https://github.com/shelljs/shelljs#configfatal
  /* eslint-disable no-undef */
  config.fatal = true;

  try {

    if (fs.existsSync(expanded_cwd)) {
      process.chdir(expanded_cwd);
    } else {
      core.setFailed(
        `'working_directory' set to ${expanded_cwd}, which is a nonexistent directory. `
      );
    }

    if (inputCommand == "login") {
      core.debug("Login command found.");

      if (spec) {
        core.setFailed(
          "Login command found but `spec` is also set.  Please remove `spec` contents."
        );
      }

      if (setup.mapOS(platform) == "windows") {
        core.debug("Running OS is windows.");
        try {
          exec(
            `echo | set /p="${process.env.P4PASSWD}" | p4 login`,
            function (code, stdout, stderr) {
              core.setOutput("exit_code", code);
              core.setOutput("stdout", stdout);
              core.setOutput("stderr", stderr);
              if (code !== 0) {
                core.setFailed(
                  `Failed to run command ${inputCommand} with error: ${stderr}`
                );
              }
            }
          );
        } catch (error) {
          core.setFailed(
            `Failed to log into Helix Core with error: ${error.message}`
          );
        }
      } else {
        core.debug("Running OS is linux.");
        try {
          exec(
            `echo "${process.env.P4PASSWD}" | p4 login`,
            function (code, stdout, stderr) {
              core.setOutput("exit_code", code);
              core.setOutput("stdout", stdout);
              core.setOutput("stderr", stderr);
              if (code !== 0) {
                core.setFailed(
                  `Failed to log into Helix Core with error: ${stderr}`
                );
              }
            }
          );
        } catch (error) {
          core.setFailed(
            `Failed to log into Helix Core with error: ${error.message}`
          );
        }
      }
    } else if (spec) {
      if (args.includes("-i")) {
        core.debug("`arguments` includes -i which is required");
      } else {
        core.setFailed(
          "spec being used but `arguments` does not included `-i`  See README for more details: https://github.com/perforce/setup-p4#spec"
        );
      }

      core.debug("Spec is set so pass it in as stdin");

      if (setup.mapOS(platform) == "windows") {
        process.env["SPECENV"] = spec;
        try {
          exec(
            `powershell.exe -Command echo $env:SPECENV | ${command}`,
            function (code, stdout, stderr) {
              core.setOutput("exit_code", code);
              core.setOutput("stdout", stdout);
              core.setOutput("stderr", stderr);
              if (code !== 0) {
                core.setFailed(
                  `Failed to run command '${inputCommand}' with error: ${stderr}`
                );
              }
            },
            {
              env: {
                ...process.env,
                ...process.env["SPECENV"],
              },
            }
          );
        } catch (error) {
          core.setFailed(
            `Failed to run command '${inputCommand}' with error: ${error.message}`
          );
        }
      } else {
        try {
          exec(`echo "${spec}" | ${command}`, function (code, stdout, stderr) {
            core.setOutput("exit_code", code);
            core.setOutput("stdout", stdout);
            core.setOutput("stderr", stderr);
            if (code !== 0) {
              core.setFailed(
                `Failed to run command '${inputCommand}' with error: ${stderr}`
              );
            }
          });
        } catch (error) {
          core.setFailed(
            `Failed to run command '${inputCommand}' with error: ${error.message}`
          );
        }
      }
    } else {
      core.debug("Standard p4 command with nothing from stdin");
      try {
        exec(
          command,
          function (code, stdout, stderr) {
            core.setOutput("exit_code", code);
            core.setOutput("stdout", stdout);
            core.setOutput("stderr", stderr);
            if (code !== 0) {
              core.setFailed(
                `Failed to run command '${inputCommand}' with error: ${stderr}`
              );
            }
          },
          {
            env: {
              ...process.env,
            },
          }
        );
      } catch (error) {
        core.setFailed(
          `Failed to run command '${inputCommand}' with error: ${error.message}`
        );
      }
    }
  } catch (error) {
    core.setFailed(
      `Something bad happened in main.  Error was: ${error.message}`
    );
  }
}

setupP4(main);
