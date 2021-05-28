const core = require('@actions/core');
const exec = require('@actions/exec');

/**
 * When the GitHub Actions job is done, remove saved CR credentials from the
 * local Docker engine in the job's environment.
 */

async function cleanup() {
    try {
        core.debug(`Logging out registry`);

        // Execute the docker logout command
        let doLogoutStdout = '';
        let doLogoutStderr = '';
        const exitCode = await exec.exec('docker logout', ['cr.yandex'], {
            silent: true,
            ignoreReturnCode: true,
            listeners: {
                stdout: (data) => {
                    doLogoutStdout += data.toString();
                },
                stderr: (data) => {
                    doLogoutStderr += data.toString();
                }
            }
        });

        if (exitCode != 0) {
            core.debug(doLogoutStdout);
            core.error(`Could not logout registry: ${doLogoutStderr}`);
            throw new Error(`Failed to logout}`);
        }
    } catch
        (error) {
        core.setFailed(error.message);
    }
}

module.exports = cleanup;

/* istanbul ignore next */
if (require.main === module) {
    cleanup();
}
