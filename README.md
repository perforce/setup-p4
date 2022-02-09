# GitHub Action: p4

> GitHub Action for running Perforce Helix Core P4 CLI [commands](https://www.perforce.com/manuals/cmdref/Content/CmdRef/commands.html).

- [GitHub Action: p4](#github-action-p4)
  - [Usage](#usage)
    - [Inputs](#inputs)
      - [`command`](#command)
      - [`global_options`](#global_options)
      - [`arguments`](#arguments)
      - [`working_directory`](#working_directory)
      - [`spec`](#spec)
    - [Configuration](#configuration)
      - [Environment Variables](#environment-variables)
      - [Secrets](#secrets)
  - [What This Action Does](#what-this-action-does)
    - [p4 login](#p4-login)
    - [`STDIN` required](#stdin-required)
    - [Everything Else](#everything-else)
  - [Detailed logs](#detailed-logs)
  - [Limitations](#limitations)
    - [Network Connectivity](#network-connectivity)
    - [Available Disk Space](#available-disk-space)
    - [p4 Binary](#p4-binary)
    - [Build Tool Availability in GitHub Actions](#build-tool-availability-in-github-actions)
  - [Author Information](#author-information)
  - [License](#license)
  - [Contributer's Guide](#contributers-guide)
  - [TODO](#todo)

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

      # Authenticate to Helix Core using P4PASSWD GitHub Secret
      - name: p4 login
        uses: perforce/p4-github-actions@master
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
            Owner:	andy_boutte
            Description:
              Created by andy_boutte.
            Root:	/tmp
            Options:	noallwrite noclobber nocompress unlocked modtime rmdir
            SubmitOptions:	leaveunchanged
            LineEnd:	local
            View:
              //guest/perforce_software/sdp/... //sdp-dev-pipeline/guest/perforce_software/sdp/...

      # pull down assets from Helix Core
      - name: p4 sync
        uses: perforce/p4-github-actions@master
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



#### `command`

`command` supports all P4 [CLI commands](https://www.perforce.com/manuals/cmdref/Content/CmdRef/commands.html).



#### `global_options`

`global_options` supports all P4 [global options](https://www.perforce.com/manuals/cmdref/Content/CmdRef/global.options.html#Global_options).

Common `global_options` you may want to set would include

- `P4PORT` by including `-p ssl:helixcore.example.com:1666` in `global_options`
- `P4USER` by including `-u joe` in `global_options` 



#### `arguments`

`arguments `supports all P4 Command arguments.  To find avaiable arguments first find the [command documentation](https://www.perforce.com/manuals/cmdref/Content/CmdRef/commands.html) and then look under the Options section. 



#### `working_directory`

The Action will change directory to what is provided in `working_directory`.  Note that the specified directory must exist.  



#### `spec`

If `spec` is provided the contents of `spec` will be passed to the `STDIN` of the p4 command.  In `arguments` include the option `-i` so that p4 reads from `STDIN` instead of opening your `P4EDITOR`.



### Configuration

#### Environment Variables

The [P4 CLI can utilize environment variables](https://www.perforce.com/manuals/cmdref/Content/CmdRef/envars.html) to get configuration and the same applies to p4 in GitHub Actions.  GitHub Actions allows you to set [environment variables at multiple levels](https://docs.github.com/en/actions/learn-github-actions/environment-variables):

- Workflow
- Job
- Step


```yaml
- name: p4 sync
  uses: perforce/p4-github-actions@master
  env:
  	P4CLIENT: sdp-dev-pipeline
  with:
    command: sync
    arguments: -f
```

Reference the `example.yml.disable`Workflow file in this repository for examples of setting environment variables at each level.

#### Secrets

All p4 commands will require valid authentication to your Helix Core server.  Most Workflows will start with a `p4 login` like the following:

```yaml
- name: p4 login
  uses: perforce/p4-github-actions@master
  with:
    command: login
    global_options: '-p public.perforce.com:1666 -u andy_boutte'
    env:
    	P4PASSWD: ${{ secrets.P4PASSWD }}
```

To use the above step your Github Repository will need to have a Secret named `P4PASSWD`and the contents will need to be the Helix Core password of the user you want to authenticate as.

You can name your GitHub Repositry Secret anything you would like but the Action expects you to set the environment variable `P4PASSWD` value to your secret.


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

## Detailed logs

To enable debug logging, create a GitHub Repostiry Secret named `ACTIONS_STEP_DEBUG` with the value `true`. See [here](https://docs.github.com/en/actions/monitoring-and-troubleshooting-workflows/enabling-debug-logging) for more information.


## Limitations

### Network Connectivity

GitHub Hosted Actions run in Azure so the list of [Azure IPv4 addresses](https://docs.github.com/en/actions/using-github-hosted-runners/about-github-hosted-runners#ip-addresses) must be able to reach your Helix Core instance.  

### Available Disk Space

GitHub Hosted Actions provide ~30GB of disk space to your workflow.  Depending on your P4 Client Depot mapping you may run out of disk space.  Your options are to update your Depot mapping to reduce what data is pulled down or switching to [Self Hosted GitHub Actions](https://docs.github.com/en/actions/hosting-your-own-runners/about-self-hosted-runners). 

### p4 Binary

[GitHub Actions virtual environment](https://github.com/actions/virtual-environments) does not have the p4 binary and Perforce does not have an official p4 cli Docker Image.  This means the p4 binary must be downloaded at the start of each workflow execution. 


### Build Tool Availability in GitHub Actions

If I am a pipeline developer using GitHb Actions I dont have many (any?) options for getting my build tool (unreal engine, unity, etc) into GitHub Actions.  My option is to create a build server and use Self Hosted GitHub Actions.


## Author Information

This module is maintained by the contributors listed on [GitHub](https://github.com/perforce/p4-github-actions/graphs/contributors).

Development of this module was sponsored by [Perforce](https://perforce.com).



## License

TODO



## Contributer's Guide

TODO


## TODO

- create GitHub Action output from the stdout of the p4 command.  https://trstringer.com/github-actions-multiline-strings/
