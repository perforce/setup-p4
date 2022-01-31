#!/bin/bash

set -ex

df -h
exit 0
echo "::debug:: command is: $INPUT_COMMAND"
echo "::debug:: pre_command_arguments is: $INPUT_PRE_COMMAND_ARGUMENTS"
echo "::debug:: post_command_arguments is: $INPUT_POST_COMMAND_ARGUMENTS"
echo "::debug:: working_directory is: $INPUT_WORKING_DIRECTORY"
echo "::debug:: spec is: $INPUT_SPEC"

if [ -z "${INPUT_COMMAND}" ]; then
  echo "Required variable \`command\` is missing"
  exit 1
fi

if [ -n "${INPUT_WORKING_DIRECTORY}" ]; then
  cd "${INPUT_WORKING_DIRECTORY}"
fi

COMMAND="p4 $INPUT_PRE_COMMAND_ARGUMENTS $INPUT_COMMAND $INPUT_POST_COMMAND_ARGUMENTS"

echo "::debug:: Executing command: ${COMMAND}"

if [ "$INPUT_COMMAND" = "login" ]; then
  echo "${P4_PASSWORD}" | ${COMMAND}
elif [ -z "${INPUT_SEPC}" ]; then
  echo "${INPUT_SPEC}" | ${COMMAND}
else
  ${COMMAND}
fi


