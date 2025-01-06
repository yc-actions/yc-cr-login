import { exec } from '@actions/exec'
import { getInput, setFailed, debug, error } from '@actions/core'

export async function run(): Promise<void> {
    const ycSaJsonCredentials = getInput('yc-sa-json-credentials', { required: true })
    if (!ycSaJsonCredentials) {
        setFailed('Empty credentials')
    }

    const cr = getInput('cr-endpoint', { required: false }) || 'cr.yandex'

    try {
        // Execute the docker login command
        let doLoginStdout = ''
        let doLoginStderr = ''
        const exitCode = await exec('docker login', ['--username', 'json_key', '--password-stdin', cr], {
            silent: true,
            ignoreReturnCode: true,
            input: Buffer.from(ycSaJsonCredentials),
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
