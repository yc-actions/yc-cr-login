const run = require('./index.js');
const core = require('@actions/core');
const exec = require('@actions/exec');

jest.mock('@actions/core');
jest.mock('@actions/exec');

function mockGetInput(requestResponse) {
    // noinspection JSUnusedLocalSymbols
    return function (name, options) { // eslint-disable-line no-unused-vars
        return requestResponse[name]
    }
}

const DEFAULT_INPUTS = {
    'yc-sa-json-credentials': '{}',
};

const EMPTY_INPUT = {
    'yc-sa-json-credentials': '',
};


describe('Login to CR', () => {

    beforeEach(() => {
        jest.clearAllMocks();

        core.getInput = jest
            .fn()
            .mockImplementation(mockGetInput(DEFAULT_INPUTS));


        exec.exec.mockReturnValue(0);
    });



    test('logins the Docker client', async () => {

        await run();

        expect(core.setOutput).toHaveBeenCalledTimes(0);
        expect(exec.exec).toHaveBeenCalledTimes(1);
        expect(exec.exec).toHaveBeenNthCalledWith(1,
            'docker login',
            ['--username', 'json_key', '--password-stdin', 'cr.yandex'],
            expect.anything());
        expect(core.saveState).toHaveBeenCalledTimes(0);
    });

    test('error is caught by core.setFailed for failed docker login', async () => {
        exec.exec.mockReturnValue(1);

        await run();

        expect(core.setFailed).toBeCalled();
        expect(core.saveState).toHaveBeenCalledTimes(0);
    });

    test('empty input fails action', async () => {
        core.getInput = jest
            .fn()
            .mockImplementation(mockGetInput(EMPTY_INPUT));
        exec.exec.mockReturnValue(1);

        await run();

        expect(core.setFailed).toBeCalledWith("Empty credentials");
        expect(core.saveState).toHaveBeenCalledTimes(0);
    });

});
