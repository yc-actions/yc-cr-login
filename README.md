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
      uses: yc-actions/yc-cr-login@v2
      with:
        yc-sa-json-credentials: ${{ secrets.YC_SA_JSON_CREDENTIALS }}

    - name: Build, tag, and push image to Yandex Cloud Container Registry
      env:
        CR_REGISTRY: crp00000000000000000
        CR_REPOSITORY: my-cr-repo
        IMAGE_TAG: ${{ github.sha }}
      run: |
        docker build -t cr.yandex/$CR_REGISTRY/$CR_REPOSITORY:$IMAGE_TAG .
        docker push cr.yandex/$CR_REGISTRY/$CR_REPOSITORY:$IMAGE_TAG
```

See [action.yml](action.yml) for the full documentation for this action's inputs and outputs.

## Permissions

This action does not require any specific permissions. But to push images to the Yandex Cloud Container Registry, 
the service account used for the action should have the `container-registry.images.pusher` 
[permission](https://cloud.yandex.ru/en/docs/container-registry/security/).

## License Summary

This code is made available under the MIT license.
