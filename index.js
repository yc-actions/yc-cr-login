const core = require('@actions/core');
const exec = require('@actions/exec');


async function run() {
    const ycSaJsonCredentials = core.getInput('yc-sa-json-credentials', {required: true});
    if (!ycSaJsonCredentials) {
        core.setFailed("Empty credentials");
    }

    const cr = core.getInput('cr-endpoint', {required: false}) || 'cr.yandex';

    try {

        // Execute the docker login command
        let doLoginStdout = '';
        let doLoginStderr = '';
        const exitCode = await exec.exec('docker login',
            ['--username', 'json_key', '--password-stdin', cr], {
                silent: true,
                ignoreReturnCode: true,
                input: Buffer.from(ycSaJsonCredentials),
                listeners: {
                    stdout: (data) => {
                        doLoginStdout += data.toString();
                    },
                    stderr: (data) => {
                        doLoginStderr += data.toString();
                    }
                }
            });

        if (exitCode !== 0) {
            core.debug(doLoginStdout);
            // noinspection ExceptionCaughtLocallyJS
            throw new Error('Could not login: ' + doLoginStderr);
        }

    } catch (error) {
        core.setFailed(error.message);
    }
}

module.exports = run;

/* istanbul ignore next */
if (require.main === module) {
    run();
}
