#!/bin/bash

PROFILE=dev
BUCKET=mirage-demo-examples-static-website
POLICY=gitops_s3
USER=gitops
ACCESS_KEY_ID=AWS_ACCESS_KEY_ID
SECRET_ACCESS_KEY=AWS_SECRET_ACCESS_KEY

trap "rm cache_[12x]__*" EXIT

aws() {
  # TODO: detect if has network error
  if [ "$1" = "no-cache" ]; then
    shift
    env aws --profile=$PROFILE $@
    return $?
  fi

  local digest=$(echo -n "$@" | md5sum)
  local key=${digest::-3}
  local stdout="cache_1__${key}"
  local stderr="cache_2__${key}"
  local result="cache_x__${key}"

  if [ -f ${result} ]; then
    cat $stdout
    cat $stderr >&2
    read code < ${result}
    return $code
  fi

  env aws --profile=$PROFILE $@ >${stdout} 2>${stderr}

  local code=$?
  cat ${stdout}
  cat ${stderr} >&2
  echo -n ${code} > $result
  return ${code}
}

has_bucket() {
  local bucket=${1:-"${BUCKET}"}
  aws s3api head-bucket --bucket $bucket >/dev/null 2>&1
  return $?
}

ls_bucket() {
  local bucket=${1:-"${BUCKET}"}
  aws s3 ls s3://$bucket --summarize
  return $?
}

get_bucket_location() {
  local bucket=${1:-"${BUCKET}"}
  aws s3api get-bucket-location --bucket ${bucket} --output text
}

get_bucket_website_url() {
  local bucket=${1:-"${BUCKET}"}
  local location=$(get_bucket_location ${bucket})
  local domain="s3-website-${location}.amazonaws.com"

  if [[ $location == cn-* ]]; then
    domain="s3-website.${location}.amazonaws.com.cn"
  fi

  echo -n http://${bucket}.${domain}
}

create_bucket() {
  local bucket=${1:-"${BUCKET}"}
  echo "creating bucket ${bucket}"
  aws s3 mb s3://$bucket
}

create_bucket_if_non_exist() {
  local bucket=${1:-"${BUCKET}"}
  has_bucket $bucket || create_bucket $bucket
}

get_policy_arn_by_name() {
  local name=${1:-"${POLICY}"}
  aws iam list-policies --query "Policies[?PolicyName==\`$name\`].Arn" --output text
}

has_policy() {
  local name=${1:-"${POLICY}"}
  local arn=$(get_policy_arn_by_name $name)
  if [ -z ${arn} ]; then
    return 1
  fi
}

create_policy_document() {
  local name=${1:-"${POLICY}"}
  local bucket=${2:-"${BUCKET}"}
  local location=$(get_bucket_location ${bucket})
  local partition="aws"

  if [[ "$location" == cn-* ]]; then
    partition="aws-cn"
  fi

  local policy_document=${name}_policy.json
  local policy_document_tmp=${name}_policy.json.tmp
  local policy_document_template=${name}_policy_template.json

  sed -E "s/PARTITION/${partition}/g;s/BUCKET_NAME/${bucket}/g" \
    ${policy_document_template} >${policy_document_tmp}

  if [ ! -f ${policy_document} ]; then
    echo "creating policy document for ${name}" >&2
    mv ${policy_document_tmp} ${policy_document}
  elif ! diff -qs ${policy_document_tmp} ${policy_document} >/dev/null; then
    echo "updating policy document for ${name}" >&2
    mv -f ${policy_document_tmp} ${policy_document}
  else
    rm ${policy_document_tmp}
  fi

  echo -n ${policy_document}
}

create_policy() {
  local name=${1:-"${POLICY}"}
  local file=${2:-"${name}_policy.json"}

  echo "creating policy ${name}"
  aws iam create-policy --policy-name ${name} --policy-document file://${file}
}

get_policy() {
  local name=${1:-"${POLICY}"}
  local arn=$(get_policy_arn_by_name ${name})
  local version=$(aws iam get-policy --policy-arn ${arn} --query "Policy.DefaultVersionId" --output text)
  aws iam get-policy-version --policy-arn ${arn} --version-id ${version} --query "PolicyVersion.Document"
}

is_two_jsons_equal() {
  python <<HEREDOC
import json
import sys

ja = json.loads("""${_A}""")
jb = json.loads("""${_B}""")

if ja == jb:
  sys.exit(0)

sys.exit(1)
HEREDOC
}

is_policy_changed() {
  local name=${1:-"${POLICY}"}
  local policy_document=${2:?"required a policy document"}
  local present_policy=$(get_policy ${name})

  _A=$(cat ${policy_document})
  _B=${present_policy}
  is_two_jsons_equal && return 1
  return 0
}

update_policy() {
  local name=${1:-"${POLICY}"}
  local file=${2:-"${name}_policy.json"}
  local arn=$(get_policy_arn_by_name ${name})

  echo "updating policy ${name}"
  aws iam create-policy-version --policy-arn ${arn} --policy-document file://${file} --set-as-default
}

create_policy_if_changed() {
  local name=${1:-"${POLICY}"}
  local bucket=${2:-"${BUCKET}"}
  local policy_document=$(create_policy_document ${name} ${bucket})

  if has_policy ${name}; then
    is_policy_changed ${name} "${policy_document}" &&
      update_policy ${name} "${policy_document}"
  else
    create_policy ${name} ${policy_document}
  fi
}

has_user() {
  local name=${1:-"${USER}"}
  aws iam get-user --user-name "$name" >/dev/null 2>&1
  return $?
}

create_user() {
  local name=${1:-"${USER}"}
  aws iam create-user --user-name ${name}
}

create_user_if_non_exist() {
  local name=${1:-"${USER}"}
  has_user ${name} || create_user ${name}
}

has_access_key() {
  local name=${1:-"${USER}"}
  local file=${name}_access_key.txt
  if [ ! -f ${file} ]; then
    return 1
  fi

  local count=$(wc -c ${file})
  if [[ ${count} == "0 "* ]]; then
    return 1
  fi
  return 0
}

list_access_keys() {
  local name=${1:-"${USER}"}
  aws iam list-access-keys --user-name ${name} --output text \
    --query 'AccessKeyMetadata[?Status==`Active`].AccessKeyId'
}

create_access_key() {
  local name=${1:-"${USER}"}
  aws iam create-access-key --user-name ${name} --output text >${name}_access_key.txt
}

create_access_key_if_non_exist() {
  local name=${1:-"${USER}"}
  has_access_key ${name} || create_access_key ${name}
}

has_attached_user_policy() {
  local name=${1:-"${USER}"}
  local policy=${2:-"${POLICY}"}
  local all=$(aws iam list-attached-user-policies --user-name ${name} --output text)

  while IFS= read -r line; do
    if [[ "${line}" == *$'\t'${policy} ]]; then
      return 0
    fi
  done <<<"${all}"

  return 1
}

attach_user_policy() {
  local name=${1:-"${USER}"}
  local policy=${2:-"${POLICY}"}
  local policy_arn=$(get_policy_arn_by_name ${policy})
  aws iam attach-user-policy --policy-arn ${policy_arn} --user-name ${name}
}

attach_user_policy_if_not() {
  local name=${1:-"${USER}"}
  local policy=${2:-"${POLICY}"}
  has_attached_user_policy ${name} ${policy} || attach_user_policy ${name} ${policy}
}

get_current_secret() {
  if [ "${_V[0]}" = "ACCESSKEY" ]; then
    return
  fi

  local name=${1:-"${USER}"}
  local file=${name}_access_key.txt
  readarray -td $'\t' _V <${file}
}

is_repo_secret_out_of_date() {
  local name=${1:-"${USER}"}
  local lines=$(gh secret list)

  # yes if remote secret is null
  if [ -z "${lines}" ]; then
    return 0
  fi

  local access_keys=$(list_access_keys ${name})
  local access_keys_digets=()
  for key in ${access_keys}; do
    local diget=$(echo -n ${key} | md5sum)
    access_keys_digets+=(${diget::-3})
  done

  while IFS= read -r line; do
    readarray -td $'\t' arr < <(printf '%s' "${line}")
    local secret_name=${arr[0]}

    for digest in "${access_keys_digets[@]}"; do
      # no if find a matching digest of an access key (with case-insensitive)
      if [ ${secret_name,,} = "_${digest,,}" ]; then
        return 1
      fi
    done
  done <<<"${lines}"

  return 0
}

setup_repo_secret() {
  local name=${1:-"${USER}"}
  if ! get_current_secret ${name}; then
    return 1
  fi

  local access_key_id=${2:-"${ACCESS_KEY_ID}"}
  local secret_access_key=${3:-"${SECRET_ACCESS_KEY}"}
  local digest=$(echo -n ${_V[1]} | md5sum)

  gh secret set ${access_key_id} -b ${_V[1]} &&
    gh secret set ${secret_access_key} -b ${_V[3]} &&
    gh secret set "_${digest::-3}" -b 1
}

setup_repo_secret_if_out_of_date() {
  local name=${1:-"${USER}"}
  is_repo_secret_out_of_date ${name} && setup_repo_secret ${name}
}

is_website_enabled() {
  local code='<li>Code: NoSuchWebsiteConfiguration</li>'
  local url=$(get_bucket_website_url)

  curl -s $url | grep "$code" -q && return 1
  return 0
}

enable_website() {
  local bucket=${1:-"${BUCKET}"}
  local file=${bucket}.json
  aws s3api put-bucket-website --bucket $bucket --website-configuration file://${file}
}

enable_website_if_disabled() {
  local bucket=${1:-"${BUCKET}"}
  is_website_enabled ${bucket} || enable_website ${bucket}
}

is_public_access_enabled() {
  local bucket=${1:-"${BUCKET}"}
  local settings=$(aws s3api get-public-access-block --output text --bucket ${bucket} 2>/dev/null)

  readarray -td $'\t' arr < <(printf '%s' "${settings}")
  if [[ "${arr[@]}" == *"False False False False" ]]; then
    return 0
  fi

  return 1
}

enable_public_access() {
  local bucket=${1:-"${BUCKET}"}
  aws s3api put-public-access-block \
    --bucket ${bucket} \
    --public-access-block-configuration "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"
}

enable_public_access_if_disabled() {
  local bucket=${1:-"${BUCKET}"}
  is_public_access_enabled ${bucket} || enable_public_access ${bucket}
}

is_bucket_policy_public() {
  local bucket=${1:-"${BUCKET}"}
  local status=$(aws s3api get-bucket-policy-status --bucket ${bucket} --query "PolicyStatus.IsPublic" 2>/dev/null)

  if [ "${status}" = "true" ]; then
    return 0
  fi

  return 1
}

update_bucket_policy() {
  local bucket=${1:-"${BUCKET}"}
  local policy_document=$(create_policy_document ${bucket} ${bucket})

  echo "updating bucket policy ${bucket}"
  aws s3api put-bucket-policy --bucket ${bucket} --policy file://${policy_document}
}

enable_public_bucket_policy() {
  local bucket=${1:-"${BUCKET}"}
  update_bucket_policy ${bucket}
}

enable_public_bucket_policy_if_disabled() {
  local bucket=${1:-"${BUCKET}"}
  is_bucket_policy_public ${bucket} || enable_public_bucket_policy ${bucket}
}

main() {
  create_bucket_if_non_exist
  create_policy_if_changed
  create_user_if_non_exist
  create_access_key_if_non_exist
  attach_user_policy_if_not
  setup_repo_secret_if_out_of_date
  enable_public_access_if_disabled
  enable_public_bucket_policy_if_disabled
  enable_website_if_disabled
}

case $1 in
"")
  main
  ;;
*)
  $@
  ;;
esac
