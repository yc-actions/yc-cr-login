## YC CR "Login" Action for GitHub Actions

[![Coverage](./badges/coverage.svg)](./badges/coverage.svg)

Logs in the local Docker client to Yandex Cloud Container Registry.

**Table of Contents**

<!-- toc -->

- [Usage](#usage)
- [Permissions](#permissions)
- [License Summary](#license-summary)

<!-- tocstop -->

## Usage

```yaml
    - name: Login to Yandex Cloud Container Registry
      id: login-cr
      uses: yc-actions/yc-cr-login@v3
      with:
        yc-sa-id: ${{ secrets.YC_SA_ID }}

    - name: Build, tag, and push image to Yandex Cloud Container Registry
      env:
        CR_REGISTRY: crp00000000000000000
        CR_REPOSITORY: my-cr-repo
        IMAGE_TAG: ${{ github.sha }}
      run: |
        docker build -t cr.yandex/$CR_REGISTRY/$CR_REPOSITORY:$IMAGE_TAG .
        docker push cr.yandex/$CR_REGISTRY/$CR_REPOSITORY:$IMAGE_TAG
```

One of `yc-sa-json-credentials`, `yc-iam-token` or `yc-sa-id` should be provided depending on the authentication method you
want to use. The action will use the first one it finds.
* `yc-sa-json-credentials` should contain JSON with authorized key for Service Account. More info
  in [Yandex Cloud IAM documentation](https://yandex.cloud/en/docs/iam/operations/authentication/manage-authorized-keys#cli_1).
* `yc-iam-token` should contain IAM token. It can be obtained using `yc iam create-token` command or using
  [yc-actions/yc-iam-token-fed](https://github.com/yc-actions/yc-iam-token-fed)
```yaml
  - name: Get Yandex Cloud IAM token
    id: get-iam-token
    uses: docker://ghcr.io/yc-actions/yc-iam-token-fed:1.0.0
    with:
      yc-sa-id: aje***
```
* `yc-sa-id` should contain Service Account ID. It can be obtained using `yc iam service-accounts list` command. It is
  used to exchange GitHub token for IAM token using Workload Identity Federation. More info in [Yandex Cloud IAM documentation](https://yandex.cloud/ru/docs/iam/concepts/workload-identity).

See [action.yml](action.yml) for the full documentation for this action's inputs and outputs.

## Permissions

This action does not require any specific permissions. But to push images to the Yandex Cloud Container Registry, 
the service account used for the action should have the `container-registry.images.pusher` 
[permission](https://cloud.yandex.ru/en/docs/container-registry/security/).

## License Summary

This code is made available under the MIT license.
