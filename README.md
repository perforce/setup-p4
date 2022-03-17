# :gear: `setup-p4` [![](https://github.com/perforce/setup-p4/actions/workflows/ci.yml/badge.svg?branch=master)](https://github.com/perforce/setup-p4/actions/workflows/ci.yml)  [![GitHub tag](https://img.shields.io/github/v/tag/perforce/setup-p4?sort=semver)](https://github.com/perforce/setup-p4/tags)

> GitHub Action for running Perforce Helix Core P4 CLI [commands](https://www.perforce.com/manuals/cmdref/Content/CmdRef/commands.html).



The `perforce/setup-p4` action is a JavaScript Action that sets up Perforce Helix Core P4 CLI in your GitHub Actions workflow by downloading a specific version of Perforce Helix Core CLI and adding it to the `PATH`.

In addition, the Action includes the following features:

- This Action supports all GitHub Hosted and Self-Hosted Runner Operating Systems
- Defaults to latest version of P4 CLI but can be overwritten 
- All P4 CLI commands can be run from the Action
- Optionally use GitHub Action Inputs to ease setting up your P4 CLI commands
- The connection details of the Perforce Helix Core servers used by P4 CLI can be stored as secrets

More features to come!

- [Usage](#usage)
  - [Quickstart](#quickstart)
  - [Inputs](#inputs)
    - [`command`](#command)
    - [`global_options`](#global_options)
    - [`arguments`](#arguments)
    - [`working_directory`](#working_directory)
    - [`spec`](#spec)
    - [`p4_version`](#p4_version)
  - [Configuration](#configuration)
    - [Environment Variables](#environment-variables)
    - [Secrets](#secrets)
  - [Outputs](#outputs)
    - [Output Usage](#output-usage)
  - [Versioning](#versioning)
  - [Helpers](#helpers)
    - [p4 login](#p4-login)
    - [`STDIN` required](#stdin-required)
    - [Everything Else](#everything-else)
- [Example GitHub Action Workflows](#example-github-action-workflows)
- [Detailed logs](#detailed-logs)
- [Limitations](#limitations)
  - [Network Connectivity](#network-connectivity)
  - [Available Disk Space](#available-disk-space)
- [Author Information](#author-information)
- [Support](#support)
- [Code of Conduct](#code-of-conduct)
- [License](#license)
- [Contributor's Guide](#contributors-guide)
  - [Issues](#issues)
  - [Discussions](#discussions)
  - [act](#act)
    - [.actrc](#actrc)
    - [my.secrets](#mysecrets)

## Usage

### Quickstart

Add the Action to your [GitHub Workflow](https://docs.github.com/en/actions/learn-github-actions#creating-a-workflow-file) like so:

Start by creating [GitHub Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets#creating-encrypted-secrets-for-a-repository) for the following values

- P4PORT
- P4USER
- P4PASSWD

Example:

```bash
P4PORT="ssl:helixcore.example.com:1666"
P4USER="ci"
P4PASSWD="mysecurepassword"
```

Define a job with environment variables that will be available for all steps:

``` yaml
jobs:
  quickstart:
    runs-on: ubuntu-latest
    name: quickstart

    env:
      P4PORT: ${{ secrets.P4PORT }}
      P4USER: ${{ secrets.P4USER }}
      P4PASSWD: ${{ secrets.P4PASSWD }}
```

Add a step that uses `perforce/setup-p4@v1` with your required version of p4; this will download, install, and add the P4 CLI to the `PATH`:

```yaml
# Install p4 cli
steps:
  - uses: perforce/setup-p4@v1
    with:
      p4_version: 21.2
```

This will perform a `p4 login` utilizing a GitHub Secret for the password:

``` yaml
# Authenticate to Helix Core using P4PASSWD GitHub Secret
steps:
  - uses: perforce/setup-p4@v1
    with:
      command: login
```


This will run `p4 depots`

``` yaml
# List depots in Helix Core
steps:
  - uses: perforce/setup-p4@v1
    with:
      command: depots
```



Review the [quickstart.yml](examples/quickstart.yml) for an example workflow that:

- install p4 CLI
- logs into Helix Core
- creates a workspace (client)
- pulls down assets from Helix Core



### Inputs

| Name                | Description                                                  | Required | Default |
| ------------------- | ------------------------------------------------------------ | -------- | ------- |
| `command`           | p4 CLI command to execute                                  | yes      |         |
| `global_options`    | p4 CLI arguments that are supplied on the command line before the `command` | no       |         |
| `arguments`         | arguments that are p4 CLI `command` specific               | no       |         |
| `working_directory` | directory to change into before running p4 `command`         | no       |         |
| `spec`              | spec content that is fed into p4 stdin to create/update resources | no       |         |
| `p4_version`        | version of p4 binary to download and cache | no       |  21.2       |



#### `command`

`command` supports all P4 [CLI commands](https://www.perforce.com/manuals/cmdref/Content/CmdRef/commands.html).


#### `global_options`

`global_options` supports all P4 [global options](https://www.perforce.com/manuals/cmdref/Content/CmdRef/global.options.html#Global_options).

Common `global_options` you may want to set would include

- `P4PORT` by including `-p ssl:helixcore.example.com:1666` in `global_options`
- `P4USER` by including `-u joe` in `global_options` 


#### `arguments`

`arguments ` supports all P4 Command arguments.  To find available arguments first find the [command documentation](https://www.perforce.com/manuals/cmdref/Content/CmdRef/commands.html) and then look under the Options section. 


#### `working_directory`

The Action will change directory to what is provided in `working_directory`.  Note that the specified directory must exist.  


#### `spec`

If `spec` is provided the contents of `spec` will be passed to the `STDIN` of the p4 command.  In `arguments` include the option `-i` so that p4 reads from `STDIN` instead of opening your `P4EDITOR`.

#### `p4_version`

`p4_version` defines the version of the `p4` binary that will be downloaded and cached.  `p4_version` should only be specified in a `setup` GitHub Action Step. In this step the it will check if the specified version is already present, if it is not it will be loaded, cached, and added to the `$PATH`.  All subsequent steps will be able to use the `p4` found in the `$PATH`.

See our [CI workflows](https://github.com/perforce/setup-p4/tree/master/.github/workflows) for examples.



### Configuration

#### Environment Variables

The [P4 CLI can utilize environment variables](https://www.perforce.com/manuals/cmdref/Content/CmdRef/envars.html) to get configuration and the same applies to p4 in GitHub Actions.  GitHub Actions allows you to set [environment variables at multiple levels](https://docs.github.com/en/actions/learn-github-actions/environment-variables):

- Workflow
- Job
- Step


```yaml
- name: p4 sync
  uses: perforce/setup-p4@v1
  env:
  	P4CLIENT: sdp-dev-pipeline
  with:
    command: sync
    arguments: -f
```

Reference the `example.yml.disable` Workflow file in this repository for examples of setting environment variables at each level.

#### Secrets

All p4 commands will require valid authentication to your Helix Core server.  Most Workflows will start with a `p4 login` like the following:

```yaml
- name: p4 login
  uses: perforce/setup-p4@v1
  with:
    command: login
    global_options: '-p helixcore.example.com:1666 -u joe'
    env:
    	P4PASSWD: ${{ secrets.P4PASSWD }}
```

To use the above step your GitHub Repository will need to have a Secret named `P4PASSWD`and the contents will need to be the Helix Core password of the user you want to authenticate as.

You can name your GitHub Repository Secret anything you would like but the Action expects you to set the environment variable `P4PASSWD` value to your secret.

### Outputs

When using the provided helpers this action creates three outputs for all p4 commands: stdout, stderr, and exit_code.  The following outputs are available for subsequent steps:

- `stdout` - The STDOUT stream of the call to the `p4` binary.
- `stderr` - The STDERR stream of the call to the `p4` binary.
- `exit_code` - The exit code of the call to the `p4` binary.



#### Output Usage

The following is an example of how to use each of the outputs from this action:

```yaml
- name: p4 depots
  id: depots
  uses: perforce/setup-p4@v1
  with:
    command: depots

- name: echo outputs from previous step
  run: |
    echo "this will print the outputs from the depots command in the previous step"
    echo "stdout was: ${{ steps.depots.outputs.stdout }}"   
    echo "stderr was: ${{ steps.depots.outputs.stderr }}"
    echo "exit code was: ${{ steps.depots.outputs.exit_code }}"
```



### Versioning

We recommend pinning to the latest available major version:

```
- uses: perforce/setup-p4@v1
```

This action follows semantic versioning, but we're human and sometimes make mistakes. To prevent accidental breaking changes, you can also pin to a specific version:

```
- uses: perforce/setup-p4@v1.0.1
```

However, you will not get automatic security updates or new features without explicitly updating your version number. 



### Helpers



After running the setup routine, subsequent steps in the same job can run arbitrary P4 CLI commands using [the GitHub Actions `run` syntax](https://help.github.com/en/actions/reference/workflow-syntax-for-github-actions#jobsjob_idstepsrun). This allows most P4 CLI commands to work exactly like they do on your local command line.  Take a look at [setup-only.yml](examples/setup-only.yml) for an example of what this looks like.

Alternatively to running P4 CLI commands using the GitHub ACtions `run` syntax you can use helpers that are provided by the `setup-p4` action. 



Benefits to using the helpers:

- you don't have to worry about passing complex `spec` as `stdin` to the p4 command ([example](https://github.com/perforce/setup-p4/blob/master/examples/setup-only.yml#L44))
- `stdout`, `stderr`, and `exit_code` are captured for you and stored as GitHub Outputs
- Bad p4 commands, bad p4 arguments, bad p4 spec, and [pipefail](https://coderwall.com/p/fkfaqq/safer-bash-scripts-with-set-euxo-pipefail) errors are all caught and will fail the GitHub Step to prevent false positives in your pipelines




1) Installs the p4 CLI
2) Builds up a p4 command based on your inputs.  There are three scenarios that define how the command is built up
   1) p4 login
   2) `STDIN` required
   3) everything else

This is how the command gets built up:

```bash
COMMAND="p4 $GLOBAL_OPTIONS $COMMAND $ARGUMENTS"
```



#### p4 login

The `p4 login` command will read the user password from STDIN so `$P4PASSWD` gets echoed into `$COMMAND`.


```bash
echo "${P4PASSWD}" | ${COMMAND}
```



#### `STDIN` required

This command format is used whenever a p4 resource must be created or updated.  The contents of your `spec` are passed to STDIN of p4 command.

```bash
echo "${SPEC}" | ${COMMAND}
```



#### Everything Else

```bash
${COMMAND}
```



## Example GitHub Action Workflows

You can find some example workflows that use `setup-p4` in the examples directory.  

| Name                | Description                                                  | 
| ------------------- | ------------------------------------------------------------ | 
| Quickstart          | Basic example that performs a p4 login, creates a workspaces, and sync files down from Helix Core.                                    | 
| Setup Only          | This example performs the same steps as the Quickstart example but does not utilize any of the Action helper inputs |
| Action Outputs      | Echos the stdout, stderr, and exit code                   | 

Additionally here are example projects that use `setup-p4`

- [setup-p4-example-build-template](https://github.com/perforce/setup-p4-example-build-template) - An example workflow that syncs content from Helix Core and publishes it to GitHub Pages.
- More to come!

## Detailed logs

To enable debug logging, create a GitHub Repository Secret named `ACTIONS_STEP_DEBUG` with the value `true`. See [here](https://docs.github.com/en/actions/monitoring-and-troubleshooting-workflows/enabling-debug-logging) for more information.  Run your workflow again and review the new debug logging.


## Limitations

### Network Connectivity

GitHub Hosted Actions run in Azure so the list of [Azure IPv4 addresses](https://docs.github.com/en/actions/using-github-hosted-runners/about-github-hosted-runners#ip-addresses) must be able to reach your Helix Core instance.  To test if your Helix Core server is reachable from GitHub Hosted Actions create a workflow with the following content and run it:

```bash
on:
  workflow_dispatch:

name: Network Connectivity Test

jobs:

  network:
    runs-on: ubuntu-latest
    steps:
    - run: nc -vz ${your helix core public IP} 1666
```

If your Helix Core server is reachable you will see output like the following:

```
Run nc -vz public.perforce.com 1666
Connection to public.perforce.com 1666 port [tcp/*] succeeded!
```

and if it is not reachable you will get an error like the following:

```
Run nc -vz public.perforce.com 1666
nc: connect to public.perforce.com port 1666 (tcp) failed: Connection timed out
Error: Process completed with exit code 1.
```



### Available Disk Space

GitHub Hosted Actions provide ~30GB of disk space to your workflow.  Depending on your P4 Client Depot mapping you may run out of disk space.  Your options are to update your Depot mapping to reduce what data is pulled down or switching to [Self Hosted GitHub Actions](https://docs.github.com/en/actions/hosting-your-own-runners/about-self-hosted-runners). 




## Author Information

This module is maintained by the contributors listed on [GitHub](https://github.com/perforce/setup-p4/graphs/contributors).

Development of this module is sponsored by [Perforce](https://perforce.com).



## Support

![Support](https://img.shields.io/badge/Support-Community-yellow.svg)

setup-p4 is a community supported project. Pull requests and issues are the responsibility of the project's moderator(s); this may be a vetted individual or team with members outside of the Perforce organization. All issues should be reported and managed via GitHub (not via Perforce's standard support process).



## Code of Conduct

See [CODE_OF_CONDUCT.md](/CODE_OF_CONDUCT.md)



## License

See [LICENSE](/LICENSE)



## Contributor's Guide



### Issues

Please create an [issue](https://github.com/perforce/setup-p4/issues) for all bug or security vulnerability reports.



### Discussions

To discuss feature requests, use cases, or to ask general questions please start a [discussion](https://github.com/perforce/setup-p4/discussions). 



Here are the steps for contributing:

1) fork the project
2) clone your fork to your workstation
3) run `npm ci` to install all the dependencies
4) run `npm run build` to package the action
5) create a `.actrc` and `act.secrets` file for testing locally (examples below)
6) run `act --job unit` , `act --job smoke`, and `act --job integration` before submitting a PR
   1) Note that the integration tests will require a running Helix Core
7) commit changes and submit PR

### act

[act](https://github.com/nektos/act) can be used to test GitHub Actions locally before having to commit any code. 


#### .actrc

The `.actrc` can be used to provide [default configuration](https://github.com/nektos/act#configuration) to `act`.  Example `.actrc` file to have `act` use the `act.secrets` file

```
--secret-file act.secrets
```


#### my.secrets

Create a `my.secrets` file (ignored via .gitignore file) that will allow the Action to authenticate to your Helix Core. 

```
P4PASSWD=""
P4PORT=""
P4USER=""
```
