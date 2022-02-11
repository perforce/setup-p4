const core = require('@actions/core');
const tc = require('@actions/tool-cache');
const shell = require('shelljs');
const os = require('os');
const setup = require('./lib/setup-p4');

try {
    const inputCommand = core.getInput('command');
    const globalOptions = core.getInput('global_options');
    const arguments = core.getInput('arguments');
    const spec = core.getInput('spec');
    const p4Version = core.getInput('p4_version');
    const command = `p4 ${globalOptions} ${inputCommand} ${arguments}`
    const platform = os.platform();
    const p4SemVersion = setup.p4semversion(p4Version)
    const cwd = core.getInput('working_directory');
    
    core.debug(`p4 semversion is: ${p4SemVersion}`);
    core.debug(`input command is: ${inputCommand}`);
    core.debug(`command is: ${command}`);
    core.debug(`global options is: ${globalOptions}`);
    core.debug(`arguments is: ${arguments}`);
    core.debug(`spec is: ${spec}`);
    core.debug(`p4 version is: ${p4Version}`);
    core.debug(`working directory is set to: ${cwd}`)
    core.debug(`setup input is: ${core.getInput('setup')}`)

    process.chdir(cwd)
    
    if ( core.getInput('setup') == 'true' ) {
        core.info(`setup specified so running setup routine`);
        if (inputCommand || globalOptions || arguments || spec ) {
            core.warning("In setup routine but command, global_options, arguments, or spec specified.  Ignoring these inputs. ");
        }
        toolPath = tc.find('p4', p4SemVersion);
        if (toolPath) {
            core.info(`Found in cache @ ${toolPath}`);
            const allNodeVersions = tc.findAllVersions('p4');
            core.debug(`Found the following versions of p4 in the cache: ${allNodeVersions}`);
            // since the version of the binary we need is found just add it to the PATH
            core.addPath(toolPath);
        } else {
            core.info(`p4 not found in cache`);
            (async () => {
                try {
                  await setup.run(p4Version);
                } catch (error) {
                  core.setFailed(error.message);
                }
              })();
        }

    } else if (inputCommand == "login") {
        core.debug("Login command found.");

        if (spec)  {
            core.setFailed("Login command found but `spec` is also set.  Please remove `spec` contents.");
        }
        
        if (setup.mapOS(platform) == 'windows') {
            core.debug("Running OS is windows.");
            if (shell.exec(`echo | set /p="${process.env.P4PASSWD}" | p4 login`).code !== 0) {
                core.setFailed("Failed to log into Helix Core");
            }
            
        } else {
            core.debug("Running OS is linux.");
            if (shell.exec(`echo "${process.env.P4PASSWD}" | p4 login`).code !== 0) {
                core.setFailed("Failed to log into Helix Core");
            }
        }

    } else if ( spec ) {
        
        if ( arguments.includes("-i"))  {
            core.debug("`arguments` includes -i which is required");
        } else {
            core.setFailed("spec being used but `arguments` does not included `-i`");
        }

        core.debug("Spec is set so pass it in as stdin");

        if (setup.mapOS(platform) == 'windows') {
            process.env['SPECENV'] = spec;    
            if (shell.exec(`powershell.exe -Command echo $env:SPECENV | ${command}`, {
                env: {
                  ...process.env,
                  ...process.env['SPECENV']
                }
              }).code !== 0) {
                core.setFailed(`Failed to run command: ${inputCommand}`);
              }            
        } else {
            if (shell.exec(`echo "${spec}" | ${command}`).code !== 0) {
                core.setFailed(`Failed to run command: ${inputCommand}`);
            }
        }

    } else {
        core.debug("Standard p4 command with nothing from stdin");
        if (shell.exec(command, { 
            env: { 
                ...process.env 
            }
        }).code !== 0) {
            core.setFailed(`Failed to run command: ${inputCommand}`);
        }
    }

} catch (error) {
    core.setFailed(error.message);
}

