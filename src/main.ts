import * as exec from '@actions/exec'
import * as core from '@actions/core'

export async function run(): Promise<void> {
    const ycSaJsonCredentials = core.getInput('yc-sa-json-credentials', { required: true })
    if (!ycSaJsonCredentials) {
        core.setFailed('Empty credentials')
    }

    const cr = core.getInput('cr-endpoint', { required: false }) || 'cr.yandex'

    try {
        // Execute the docker login command
        let doLoginStdout = ''
        let doLoginStderr = ''
        const exitCode = await exec.exec('docker login', ['--username', 'json_key', '--password-stdin', cr], {
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
            core.debug(doLoginStdout)
            // noinspection ExceptionCaughtLocallyJS
            throw new Error(`Could not login: ${doLoginStderr}`)
        }
    } catch (error) {
        if (error instanceof Error) {
            core.setFailed(error.message)
        }
    }
}

/**
 * When the GitHub Actions job is done, remove saved CR credentials from the
 * local Docker engine in the job's environment.
 */

export async function cleanup(): Promise<void> {
    try {
        core.debug(`Logging out registry`)

        // Execute the docker logout command
        let doLogoutStdout = ''
        let doLogoutStderr = ''
        const exitCode = await exec.exec('docker logout', ['cr.yandex'], {
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
            core.debug(doLogoutStdout)
            core.error(`Could not logout registry: ${doLogoutStderr}`)
            throw new Error(`Failed to logout}`)
        }
    } catch (error) {
        if (error instanceof Error) {
            core.setFailed(error.message)
        }
    }
}
