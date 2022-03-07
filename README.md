# :gear: `setup-p4` [![](https://github.com/perforce/setup-p4/actions/workflows/ci.yml/badge.svg?branch=master)](https://github.com/perforce/setup-p4/actions/workflows/ci.yml)  [![GitHub tag](https://img.shields.io/github/v/tag/perforce/setup-p4?sort=semver)](https://github.com/perforce/setup-p4/tags)

> GitHub Action for running Perforce Helix Core P4 CLI [commands](https://www.perforce.com/manuals/cmdref/Content/CmdRef/commands.html).

This GitHub Action downloads, installs and configures Perforce Helix Core P4 CLI, so that it can be used as part of the workflow.

In addition, the Action includes the following features:

- This Action supports all GitHub Hosted Runner Operating Systems
- Defaults to latest version of P4 CLI but can be overwritten 
- All P4 CLI commands can be run from the Action
- Uses GitHub Action Inputs for P4 CLI commands, arguments, and global options
- The connection details of the Perforce Helix Core servers used by P4 CLI can be stored as secrets. 

More features to come!

- [Usage](#usage)
  - [Inputs](#inputs)
    - [`command`](#command)
    - [`global_options`](#global_options)
    - [`arguments`](#arguments)
    - [`working_directory`](#working_directory)
    - [`spec`](#spec)
    - [`p4_version`](#p4_version)
    - [`setup`](#setup)
  - [Configuration](#configuration)
    - [Environment Variables](#environment-variables)
    - [Secrets](#secrets)
  - [Outputs](#outputs)
    - [stdout](#stdout)
    - [stderr](#stderr)
    - [exit_code](#exit_code)
    - [Output Usage](#output-usage)
- [What This Action Does](#what-this-action-does)
  - [p4 login](#p4-login)
  - [`STDIN` required](#stdin-required)
  - [Everything Else](#everything-else)
- [Example GitHub Action Workflows](#example-github-action-workflows)
- [Detailed logs](#detailed-logs)
- [Limitations](#limitations)
  - [Network Connectivity](#network-connectivity)
  - [Available Disk Space](#available-disk-space)
  - [Build Tool Availability in GitHub Actions](#build-tool-availability-in-github-actions)
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

Add the Action to your [GitHub Workflow](https://docs.github.com/en/actions/learn-github-actions#creating-a-workflow-file) like so:

```yaml
---

on: [push]

jobs:
  internal:
    runs-on: ubuntu-latest
    name: test private action
    env:
      P4PORT: ssl:helixcore.example.com:1666
      P4USER: joe
    steps:
      # Checkout assets stored in GitHub
      - name: Checkout
        uses: actions/checkout@v2

      # Install p4 cli and cache it if we are running within a self hosted runner
      - name: p4 setup
        uses:
        id: setup
        with:
          setup: true
          p4_version: 21.2

      # Authenticate to Helix Core using P4PASSWD GitHub Secret
      - name: p4 login
        uses: perforce/setup-p4@master
        id: login
        with:
          command: login
        env:
          P4PASSWD: ${{ secrets.P4PASSWD }}

      # Create a workspace
      - name: p4 client
        uses: ./
        id: client
        with:
          command: client
          arguments: -i

          spec: |
            Client:	sdp-dev-pipeline
            Owner:	andy
            Description:
              Created by andy.
            Root:	/tmp
            Options:	noallwrite noclobber nocompress unlocked modtime rmdir
            SubmitOptions:	leaveunchanged
            LineEnd:	local
            View:
              //guest/perforce_software/sdp/... //sdp-dev-pipeline/guest/perforce_software/sdp/...

      # pull down assets from Helix Core
      - name: p4 sync
        uses: perforce/setup-p4@master
        id: sync
        env:
          P4CLIENT: sdp-dev-pipeline
        with:
          command: sync
```

### Inputs

| Name                | Description                                                  | Required | Default |
| ------------------- | ------------------------------------------------------------ | -------- | ------- |
| `command`           | p4 cli command to execute                                    | yes      |         |
| `global_options`    | p4 cli arguments that are supplied on the command line before the command | no       |         |
| `arguments`         | arguments that are p4 cli command specific                   | no       |         |
| `working_directory` | directory to change into before running p4 command           | no       |         |
| `spec`              | spec content that is fed into p4 stdin to create/update resources | no       |         |
| `p4_version`        | version of p4 binary to download and cache | no       |  21.2       |
| `setup`        | used to trigger the setup routine that installs p4 | no       |  false       |



#### `command`

`command` supports all P4 [CLI commands](https://www.perforce.com/manuals/cmdref/Content/CmdRef/commands.html).


#### `global_options`

`global_options` supports all P4 [global options](https://www.perforce.com/manuals/cmdref/Content/CmdRef/global.options.html#Global_options).

Common `global_options` you may want to set would include

- `P4PORT` by including `-p ssl:helixcore.example.com:1666` in `global_options`
- `P4USER` by including `-u joe` in `global_options` 


#### `arguments`

`arguments `supports all P4 Command arguments.  To find available arguments first find the [command documentation](https://www.perforce.com/manuals/cmdref/Content/CmdRef/commands.html) and then look under the Options section. 


#### `working_directory`

The Action will change directory to what is provided in `working_directory`.  Note that the specified directory must exist.  


#### `spec`

If `spec` is provided the contents of `spec` will be passed to the `STDIN` of the p4 command.  In `arguments` include the option `-i` so that p4 reads from `STDIN` instead of opening your `P4EDITOR`.

#### `p4_version`

`p4_version` defines the version of the `p4` binary that will be downloaded and cached.  `p4_version` should only be specified in a `setup` GitHub Action Step. In this step the it will check if the specified version is already present, if it is not it will be loaded, cached, and added to the `$PATH`.  All subsequent steps will be able to use the `p4` found in the `$PATH`.

See our [CI workflows](https://github.com/perforce/setup-p4/tree/master/.github/workflows) for examples.

#### `setup`

`setup` is used to trigger the download, installation, and caching of the p4 binary.  



### Configuration

#### Environment Variables

The [P4 CLI can utilize environment variables](https://www.perforce.com/manuals/cmdref/Content/CmdRef/envars.html) to get configuration and the same applies to p4 in GitHub Actions.  GitHub Actions allows you to set [environment variables at multiple levels](https://docs.github.com/en/actions/learn-github-actions/environment-variables):

- Workflow
- Job
- Step


```yaml
- name: p4 sync
  uses: perforce/setup-p4@master
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
  uses: perforce/setup-p4@master
  with:
    command: login
    global_options: '-p helixcore.example.com:1666 -u andy'
    env:
    	P4PASSWD: ${{ secrets.P4PASSWD }}
```

To use the above step your Github Repository will need to have a Secret named `P4PASSWD`and the contents will need to be the Helix Core password of the user you want to authenticate as.

You can name your GitHub Repository Secret anything you would like but the Action expects you to set the environment variable `P4PASSWD` value to your secret.

### Outputs

This action creates three outputs for all p4 commands: stdout, stderr, and exit_code.

#### stdout

stderr will contain any standard output from the p4 command

#### stderr

stderr will contain any standard error output from the p4 command

#### exit_code

exit_code will be set to the exit code of the p4 command

#### Output Usage

The following is an example of how to use each of the outputs from this action:

```yaml
- name: p4 depots
  id: depots
  uses: perforce/setup-p4@master
  with:
    command: depots

- name: echo outputs from previous step
  run: |
    echo "this will print the outputs from the depots command in the previous step"
    echo "stdout was: ${{ steps.depots.outputs.stdout }}"   
    echo "stderr was: ${{ steps.depots.outputs.stderr }}"
    echo "exit code was: ${{ steps.depots.outputs.exit_code }}"
```

## What This Action Does


1) Installs the p4 CLI
2) Builds up a p4 command based on your inputs.  There are three scenarios that define how the command is built up
   1) p4 login
   2) `STDIN` required
   3) everything else

This is how the command gets built up:

```bash
COMMAND="p4 $INPUT_GLOBAL_OPTIONS $INPUT_COMMAND $INPUT_ARGUMENTS"
```


### p4 login

The `p4 login` command will read the user password from STDIN so `$P4PASSWD` gets echoed into `$COMMAND`.


```bash
echo "${P4PASSWD}" | ${COMMAND}
```

### `STDIN` required

This command format is used whenever a p4 resource must be created or updated.  The contents of your `spec` are passed to STDIN of p4 command.

```bash
echo "${INPUT_SPEC}" | ${COMMAND}
```

### Everything Else

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


### Build Tool Availability in GitHub Actions

If I am a pipeline developer using GitHb Actions I don't have many (any?) options for getting my build tool (unreal engine, unity, etc) into GitHub Actions.  My option is to create a build server and use Self Hosted GitHub Actions.


## Author Information

This module is maintained by the contributors listed on [GitHub](https://github.com/perforce/setup-p4/graphs/contributors).

Development of this module is sponsored by [Perforce](https://perforce.com).

## Support

![Support](https://img.shields.io/badge/Support-Community-yellow.svg)

setup-p4 is a community supported project. Pull requests and issues are the responsibility of the project's moderator(s); this may be a vetted individual or team with members outside of the Perforce organization. All issues should be reported and managed via GitHub (not via Perforce's standard support process).

## Code of Conduct

See the CODE_OF_CONDUCT.md file

## License

See the LICENSE file


## Contributor's Guide

### Issues

Please create an [issue](https://github.com/perforce/setup-p4/issues) for all bug reports

### Discussions

To discuss feature requests, use cases, or to ask general questions please start a [discussion](https://github.com/perforce/setup-p4/discussions). 

Here are the steps for contributing:

1) fork the project
2) clone your fork to your workstation
3) run `npm install` to install all the dependencies
4) run `npm run build` to package the action
5) create a `.actrc` and `act.secrets` file for testing locally (examples below)
6) run `act --job unit` and `act --job smoke`
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
