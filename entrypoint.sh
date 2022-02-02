#!/usr/bin/env bash

set -e

RED='\033[0;31m'
NC='\033[0m'

echo "::debug:: command is: $INPUT_COMMAND"
echo "::debug:: global options is: $INPUT_GLOBAL_OPTIONS"
echo "::debug:: arguments is: $INPUT_ARGUMENTS"
echo "::debug:: working directory is: $INPUT_WORKING_DIRECTORY"
echo "::debug:: spec is: $INPUT_SPEC"

if [ -z "${INPUT_COMMAND}" ]; then
  printf "${RED}Required variable \`command\` is missing${NC}"
  exit 1
fi

if [ -n "${INPUT_WORKING_DIRECTORY}" ]; then
  echo "::debug:: Changing directories to ${INPUT_WORKING_DIRECTORY}"
  cd "${INPUT_WORKING_DIRECTORY}"
fi

COMMAND=$(echo "p4 $INPUT_GLOBAL_OPTIONS $INPUT_COMMAND $INPUT_ARGUMENTS" | xargs)

echo "::debug:: Executing command: ${COMMAND}"

if [ "$INPUT_COMMAND" = "login" ]; then
  if [ -z "${P4PASSWD}" ]; then
    printf "${RED}Required environment variable \`P4PASSWD\` is missing${NC}"
    exit 1
  fi
  echo "::debug:: login command found, passing password as stdin"
  echo "${P4PASSWD}" | ${COMMAND}
  EXIT_STATUS="$?"
elif [ -n "${INPUT_SPEC}" ]; then
  if [[ "$INPUT_ARGUMENTS" != *"-i"* ]]; then
    printf "${RED}\`spec\` being used but \`arguments\` does not include required \`-i\`${NC}"
    exit 1
  fi
  echo "::debug:: spec provided, passing spec as stdin"
  echo "${INPUT_SPEC}" | ${COMMAND}
  EXIT_STATUS="$?"
else
  echo "::debug:: standard command execution, nothing being passed as stdin"
  ${COMMAND}
  EXIT_STATUS="$?"
fi

echo "::debug:: setting exit status output"
echo "::set-output name=status::$EXIT_STATUS"

