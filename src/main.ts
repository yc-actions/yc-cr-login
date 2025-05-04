import { exec } from '@actions/exec'
import { debug, error, getIDToken, getInput, info, setFailed } from '@actions/core'
import axios from 'axios'

export async function run(): Promise<void> {
    let username: string
    let password: string
    const ycSaJsonCredentials = getInput('yc-sa-json-credentials')
    const ycIamToken = getInput('yc-iam-token')
    const ycSaId = getInput('yc-sa-id')
    if (ycSaJsonCredentials !== '') {
        info('Parsed Service account JSON')
        username = 'json_key'
        password = ycSaJsonCredentials
    } else if (ycIamToken !== '') {
        username = 'iam'
        password = ycIamToken
        info('Using IAM token')
    } else if (ycSaId !== '') {
        const ghToken = await getIDToken()
        if (!ghToken) {
            throw new Error('No credentials provided')
        }
        const saToken = await exchangeToken(ghToken, ycSaId)
        username = 'iam'
        password = saToken
    } else {
        setFailed('Empty credentials')
        return
    }

    const cr = getInput('cr-endpoint', { required: false }) || 'cr.yandex'

    try {
        // Execute the docker login command
        let doLoginStdout = ''
        let doLoginStderr = ''
        const exitCode = await exec('docker login', ['--username', username, '--password-stdin', cr], {
            silent: true,
            ignoreReturnCode: true,
            input: Buffer.from(password),
            listeners: {
                stdout: data => {
                    doLoginStdout += data.toString()
                },
                stderr: data => {
                    doLoginStderr += data.toString()
                }
            }
        })

        if (exitCode !== 0) {
            debug(doLoginStdout)
            // noinspection ExceptionCaughtLocallyJS
            throw new Error(`Could not login: ${doLoginStderr}`)
        }
    } catch (err) {
        if (err instanceof Error) {
            setFailed(err.message)
        }
    }
}

/**
 * When the GitHub Actions job is done, remove saved CR credentials from the
 * local Docker engine in the job's environment.
 */

export async function cleanup(): Promise<void> {
    try {
        debug(`Logging out registry`)

        // Execute the docker logout command
        let doLogoutStdout = ''
        let doLogoutStderr = ''
        const exitCode = await exec('docker logout', ['cr.yandex'], {
            silent: true,
            ignoreReturnCode: true,
            listeners: {
                stdout: data => {
                    doLogoutStdout += data.toString()
                },
                stderr: data => {
                    doLogoutStderr += data.toString()
                }
            }
        })

        if (exitCode !== 0) {
            debug(doLogoutStdout)
            error(`Could not logout registry: ${doLogoutStderr}`)
            throw new Error(`Failed to logout}`)
        }
    } catch (err) {
        if (err instanceof Error) {
            setFailed(err.message)
        }
    }
}

async function exchangeToken(token: string, saId: string): Promise<string> {
    info(`Exchanging token for service account ${saId}`)
    const res = await axios.post(
        'https://auth.yandex.cloud/oauth/token',
        {
            grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange',
            requested_token_type: 'urn:ietf:params:oauth:token-type:access_token',
            audience: saId,
            subject_token: token,
            subject_token_type: 'urn:ietf:params:oauth:token-type:id_token'
        },
        {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        }
    )
    if (res.status !== 200) {
        throw new Error(`Failed to exchange token: ${res.status} ${res.statusText}`)
    }
    if (!res.data.access_token) {
        throw new Error(`Failed to exchange token: ${res.data.error} ${res.data.error_description}`)
    }
    info(`Token exchanged successfully`)
    return res.data.access_token
}
