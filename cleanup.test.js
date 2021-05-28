const cleanup = require('./cleanup.js');
const core = require('@actions/core');
const exec = require('@actions/exec');

jest.mock('@actions/core');
jest.mock('@actions/exec');

describe('Logout from ECR', () => {

    beforeEach(() => {
        jest.clearAllMocks();

        exec.exec.mockReturnValue(0);
    });


    test('logs out', async () => {
        await cleanup();

        expect(exec.exec).toHaveBeenCalledTimes(1);
        expect(core.setFailed).toHaveBeenCalledTimes(0);
    });

    test('error is caught by core.setFailed for failed docker logout', async () => {
        exec.exec.mockReturnValue(1);

        await cleanup();

        expect(core.setFailed).toBeCalled();
    });
});
