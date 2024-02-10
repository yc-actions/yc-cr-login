import * as core from '@actions/core'
import { exec } from '@actions/exec'

import { cleanup } from '../src/main'

jest.mock('@actions/core')
jest.mock('@actions/exec')

const mockedExec = jest.mocked(exec)

let setFailedMock: jest.SpyInstance
let debugMock: jest.SpyInstance
let errorMock: jest.SpyInstance

describe('Logout from ECR', () => {
    beforeEach(() => {
        jest.clearAllMocks()

        mockedExec.mockReturnValue(Promise.resolve(0))
        setFailedMock = jest.spyOn(core, 'setFailed').mockImplementation()
        debugMock = jest.spyOn(core, 'debug').mockImplementation()
        errorMock = jest.spyOn(core, 'error').mockImplementation()
    })

    test('logs out', async () => {
        await cleanup()

        expect(mockedExec).toHaveBeenCalledTimes(1)
        expect(setFailedMock).toHaveBeenCalledTimes(0)
    })

    test('error is caught by core.setFailed for failed docker logout', async () => {
        mockedExec.mockReturnValue(Promise.resolve(1))

        await cleanup()

        expect(setFailedMock).toHaveBeenCalled()
    })

    test('exec listeners are called', async () => {
        const stdout = 'stdout'
        const stderr = 'stderr'

        mockedExec.mockImplementation(async (command, args, options): Promise<number> => {
            options?.listeners?.stdout?.(Buffer.from(stdout))
            options?.listeners?.stderr?.(Buffer.from(stderr))
            return Promise.resolve(1)
        })

        await cleanup()

        expect(debugMock).toHaveBeenCalledWith(stdout)
        expect(errorMock).toHaveBeenCalledWith('Could not logout registry: stderr')
    })
})
