// eslint-disable-next-line import/no-namespace
import * as core from '@actions/core'
import axios from 'axios'
import { exec } from '@actions/exec'

import { run } from '../src/main'

jest.mock('@actions/exec')

const mockedExec = jest.mocked(exec)

type GetInputFun = (name: string, options?: core.InputOptions) => string

function mockGetInput(requestResponse: Record<string, string>): GetInputFun {
    return function (name) {
        return requestResponse[name] || ''
    }
}

const DEFAULT_INPUTS: Record<string, string> = {
    'yc-sa-json-credentials': '{}'
}

const EMPTY_INPUT: Record<string, string> = {
    'yc-sa-json-credentials': ''
}

const DEFAULT_INPUTS_WITH_ID: Record<string, string> = {
    'yc-sa-id': 'sa-id'
}

const DEFAULT_INPUTS_WITH_TOKEN: Record<string, string> = {
    'yc-iam-token': 'iam-token'
}

let getInputMock: jest.SpyInstance
let setFailedMock: jest.SpyInstance
let debugMock: jest.SpyInstance
let setOutputMock: jest.SpyInstance
let saveStateMock: jest.SpyInstance
let getIDTokenMock: jest.SpyInstance
let axiosMock: jest.SpyInstance

describe('Login to CR', () => {
    beforeEach(() => {
        jest.clearAllMocks()

        getInputMock = jest.spyOn(core, 'getInput').mockImplementation(mockGetInput(DEFAULT_INPUTS))
        setFailedMock = jest.spyOn(core, 'setFailed').mockImplementation()
        setOutputMock = jest.spyOn(core, 'setOutput').mockImplementation()
        saveStateMock = jest.spyOn(core, 'saveState').mockImplementation()
        getIDTokenMock = jest.spyOn(core, 'getIDToken').mockImplementation(async () => 'gh-token')
        axiosMock = jest.spyOn(axios, 'post').mockImplementation(async () => {
            return {
                status: 200,
                data: {
                    access_token: 'sa-token'
                }
            }
        })
        debugMock = jest.spyOn(core, 'debug').mockImplementation()

        mockedExec.mockReturnValue(Promise.resolve(0))
    })

    test('logins the Docker client', async () => {
        await run()

        expect(setOutputMock).toHaveBeenCalledTimes(0)
        expect(mockedExec).toHaveBeenCalledTimes(1)
        expect(mockedExec).toHaveBeenNthCalledWith(
            1,
            'docker login',
            ['--username', 'json_key', '--password-stdin', 'cr.yandex'],
            expect.anything()
        )
        expect(saveStateMock).toHaveBeenCalledTimes(0)
    })

    test('logins the Docker client with sa-id', async () => {
        getInputMock = jest.spyOn(core, 'getInput').mockImplementation(mockGetInput(DEFAULT_INPUTS_WITH_ID))
        await run()
        expect(setOutputMock).toHaveBeenCalledTimes(0)
        expect(getIDTokenMock).toHaveBeenCalledTimes(1)
        expect(axiosMock).toHaveBeenCalledTimes(1)
        expect(mockedExec).toHaveBeenNthCalledWith(
            1,
            'docker login',
            ['--username', 'iam', '--password-stdin', 'cr.yandex'],
            expect.objectContaining({
                input: Buffer.from('sa-token')
            })
        )
    })

    test('logins the Docker client with IAM', async () => {
        getInputMock = jest.spyOn(core, 'getInput').mockImplementation(mockGetInput(DEFAULT_INPUTS_WITH_TOKEN))
        await run()
        expect(setOutputMock).not.toHaveBeenCalled()
        expect(getIDTokenMock).not.toHaveBeenCalled()
        expect(axiosMock).not.toHaveBeenCalled()
        expect(mockedExec).toHaveBeenNthCalledWith(
            1,
            'docker login',
            ['--username', 'iam', '--password-stdin', 'cr.yandex'],
            expect.objectContaining({
                input: Buffer.from('iam-token')
            })
        )
    })

    test('error is caught by core.setFailed for failed docker login', async () => {
        mockedExec.mockReturnValue(Promise.resolve(1))

        await run()

        expect(setFailedMock).toHaveBeenCalled()
        expect(saveStateMock).toHaveBeenCalledTimes(0)
    })

    test('empty input fails action', async () => {
        getInputMock.mockImplementation(mockGetInput(EMPTY_INPUT))
        mockedExec.mockReturnValue(Promise.resolve(1))

        await run()

        expect(setFailedMock).toHaveBeenCalledWith('Empty credentials')
        expect(saveStateMock).toHaveBeenCalledTimes(0)
    })

    test('exec listeners are called', async () => {
        const stdout = 'stdout'
        const stderr = 'stderr'

        mockedExec.mockImplementation(async (command, args, options): Promise<number> => {
            options?.listeners?.stdout?.(Buffer.from(stdout))
            options?.listeners?.stderr?.(Buffer.from(stderr))
            return Promise.resolve(1)
        })

        await run()

        expect(debugMock).toHaveBeenCalledWith(stdout)
    })
})
