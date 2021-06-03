import * as run from '../src/login'
import * as arc from '../src/arc-login'
import * as os from 'os';
import * as io from '@actions/io';
import * as toolCache from '@actions/tool-cache';
import * as core from '@actions/core';
import * as fs from 'fs';
import * as jsyaml from 'js-yaml';
import * as path from 'path';
import * as child_process from 'child_process';
var mockStatusCode;
const mockExecFn = jest.fn().mockImplementation(() => mockStatusCode);
jest.mock('@actions/exec/lib/toolrunner', () => {
    return {
        ToolRunner: jest.fn().mockImplementation(() => {
            return {
                exec: mockExecFn  
            }
        })
    }
});


describe('Testing all functions.', () => {
    test('getExecutableExtension() - return .exe when os is Windows', () => {
        jest.spyOn(os, 'type').mockReturnValue('Windows_NT');
    
        expect(run.getExecutableExtension()).toBe('.exe');
        expect(os.type).toBeCalled();         
    });

    test('getExecutableExtension() - return empty string for non-windows OS', () => {
        jest.spyOn(os, 'type').mockReturnValue('Darwin');
    
        expect(run.getExecutableExtension()).toBe('');         
        expect(os.type).toBeCalled();         
    });

    test('getKubectlPath() - return path to existing kubectl', async () => {
        jest.spyOn(io, 'which').mockResolvedValue('pathToKubectl');

        expect(await run.getKubectlPath()).toBe('pathToKubectl');
        expect(io.which).toBeCalled();         
    });

    test('getKubectlPath() - throw error when kubectl not installed', async () => {
        jest.spyOn(io, 'which').mockResolvedValue('');
        jest.spyOn(toolCache, 'findAllVersions').mockReturnValue([]);

        await expect(run.getKubectlPath()).rejects.toThrow('Kubectl is not installed');
        expect(io.which).toBeCalled();         
        expect(toolCache.findAllVersions).toBeCalled();         
    });

    test('getKubectlPath() - return path to kubectl in toolCache', async () => {
        jest.spyOn(io, 'which').mockResolvedValue('');
        jest.spyOn(toolCache, 'findAllVersions').mockReturnValue(['v1.15.0']);
        jest.spyOn(toolCache, 'find').mockReturnValue('pathToTool');
        jest.spyOn(os, 'type').mockReturnValue('Windows_NT');

        expect(await run.getKubectlPath()).toBe(path.join('pathToTool', 'kubectl.exe'));
        expect(io.which).toBeCalled();         
        expect(toolCache.findAllVersions).toBeCalled();         
        expect(toolCache.find).toBeCalledWith('kubectl', 'v1.15.0');         
    });
    
    test('getKubeconfig() - throw error on invalid input', () => {
        jest.spyOn(core, 'getInput').mockReturnValue('invalid');

        expect(() => run.getKubeconfig()).toThrow('Invalid method specified. Acceptable values are kubeconfig and service-account.');
        expect(core.getInput).toBeCalled();         
    });

    test('getKubeconfig() - return kubeconfig from input', () => {
        jest.spyOn(core, 'getInput').mockImplementation((inputName, options) => {
            if (inputName == 'method') return 'kubeconfig';
            if (inputName == 'kubeconfig') return '###';
        });
        jest.spyOn(core, 'debug').mockImplementation();

        expect(run.getKubeconfig()).toBe('###');
        expect(core.getInput).toBeCalledWith('method', { required: true });         
        expect(core.getInput).toBeCalledWith('kubeconfig', { required: true });         
    });

    test('getKubeconfig() - create kubeconfig from secret provided and return it', () => {
        jest.spyOn(core, 'debug').mockImplementation();
        const k8Secret = fs.readFileSync('__tests__/sample-secret.yml').toString();
        const kubeconfig = JSON.stringify({
            "apiVersion": "v1",
            "kind": "Config",
            "clusters": [
                {
                    "cluster": {
                        "certificate-authority-data": 'LS0tLS1CRUdJTiBDRWyUSUZJQ',
                        "server": 'https://testing-dns-4za.hfp.earth.azmk8s.io:443'
                    }
                }
            ],
            "users": [
                {
                    "user": {
                        "token": Buffer.from('ZXlKaGJHY2lPcUpTVXpJMU5pSX=', 'base64').toString()
                    }
                }
            ]
        });
        jest.spyOn(core, 'getInput').mockImplementation((inputName, options) => {
            if (inputName == 'method') return 'service-account';
            if (inputName == 'k8s-url') return 'https://testing-dns-4za.hfp.earth.azmk8s.io:443';
            if (inputName == 'k8s-secret') return k8Secret;
        });

        expect(run.getKubeconfig()).toBe(kubeconfig);
        expect(core.getInput).toBeCalledTimes(3);         
    });

    test('getKubeconfig() - throw error if empty config provided', () => {
        jest.spyOn(core, 'getInput').mockImplementation((inputName, options) => {
            if (inputName == 'method') return 'service-account';
            if (inputName == 'k8s-url') return 'https://testing-dns-4da.hcp.earth.azmk8s.io:443';
            if (inputName == 'k8s-secret') return '';
        });

        expect(() => run.getKubeconfig()).toThrow('The service account secret yaml specified is invalid. Make sure that its a valid yaml and try again.');
        expect(core.getInput).toBeCalledTimes(3);         
    });
    
    test('getKubeconfig() - throw error if data field doesn\'t exist', () => {
        var k8SecretYaml = fs.readFileSync('__tests__/sample-secret.yml').toString();
        var k8SecretObject = jsyaml.safeLoad(k8SecretYaml);
        delete k8SecretObject['data'];
        k8SecretYaml = jsyaml.dump(k8SecretObject); 
        jest.spyOn(core, 'getInput').mockImplementation((inputName, options) => {
            if (inputName == 'method') return 'service-account';
            if (inputName == 'k8s-url') return 'https://testing-dns-4da.hcp.earth.azmk8s.io:443';
            if (inputName == 'k8s-secret') return k8SecretYaml;
        });

        expect(() => run.getKubeconfig()).toThrow('The service account secret yaml does not contain data; field. Make sure that its present and try again.');
        expect(core.getInput).toBeCalledTimes(3);         
    });
    
    test('getKubeconfig() - throw error if data.token field doesn\'t exist', () => {
        var k8SecretYaml = fs.readFileSync('__tests__/sample-secret.yml').toString();
        var k8SecretObject = jsyaml.safeLoad(k8SecretYaml);
        delete k8SecretObject['data']['token'];
        k8SecretYaml = jsyaml.dump(k8SecretObject);
        jest.spyOn(core, 'getInput').mockImplementation((inputName, options) => {
            if (inputName == 'method') return 'service-account';
            if (inputName == 'k8s-url') return 'https://testing-dns-4da.hcp.earth.azmk8s.io:443';
            if (inputName == 'k8s-secret') return k8SecretYaml;
        });

        expect(() => run.getKubeconfig()).toThrow('The service account secret yaml does not contain data.token; field. Make sure that its present and try again.');
        expect(core.getInput).toBeCalledTimes(3);         
    });

    test('getKubeconfig() - throw error if data[ca.crt] field doesn\'t exist', () => {
        var k8SecretYaml = fs.readFileSync('__tests__/sample-secret.yml').toString();
        var k8SecretObject = jsyaml.safeLoad(k8SecretYaml);
        delete k8SecretObject['data']['ca.crt'];
        k8SecretYaml = jsyaml.dump(k8SecretObject);
        jest.spyOn(core, 'getInput').mockImplementation((inputName, options) => {
            if (inputName == 'method') return 'service-account';
            if (inputName == 'k8s-url') return 'https://testing-dns-4da.hcp.earth.azmk8s.io:443';
            if (inputName == 'k8s-secret') return k8SecretYaml;
        });

        expect(() => run.getKubeconfig()).toThrow('The service account secret yaml does not contain data[ca.crt]; field. Make sure that its present and try again.');
        expect(core.getInput).toBeCalledTimes(3);         
    });
    
    test('setContext() - set context using kubectl', async () => {
        jest.spyOn(core, 'getInput').mockReturnValue('abc');
        jest.spyOn(io, 'which').mockResolvedValue('pathToKubectl');
        mockStatusCode = 0;

        expect(await run.setContext('/pathToKubeconfig'));
        expect(mockExecFn).toBeCalledTimes(2);         
    });

    test('run() - create kubeconfig, exportvariable and give appropriate access', async () => {
        jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {});
        jest.spyOn(fs, 'chmodSync').mockImplementation(() => {});
        jest.spyOn(core, 'exportVariable').mockImplementation(() => {});
        jest.spyOn(core, 'getInput').mockImplementation((inputName, options) => {
            if (inputName == 'method') return 'kubeconfig';
            if (inputName == 'kubeconfig') return '###';
            if (inputName == 'context') return '';
            if (inputName == 'cluster-type') return 'generic';
        });
        process.env['RUNNER_TEMP'] =  'tempDirPath'
        jest.spyOn(Date, 'now').mockImplementation(() => 1234561234567);

        expect(run.run());
        expect(fs.writeFileSync).toHaveBeenCalledWith(path.join('tempDirPath', 'kubeconfig_1234561234567'), '###');
        expect(fs.chmodSync).toHaveBeenCalledWith(path.join('tempDirPath', 'kubeconfig_1234561234567'), '600');
        expect(core.exportVariable).toHaveBeenCalledWith('KUBECONFIG', path.join('tempDirPath', 'kubeconfig_1234561234567'));
    });

    test('run() - check if arc scenario is getting triggered', async () =>{
        jest.spyOn(arc,'getArcKubeconfig').mockImplementation();
        jest.spyOn(core, 'getInput').mockImplementation((inputName, options) => {
            if (inputName == 'cluster-type') return 'arc';
        });
        expect(run.run());
        expect(arc.getArcKubeconfig).toBeCalled();
    });

    test('getArcKubeconfig() - checking successful execution of service-account scenario',async () =>{
        jest.spyOn(core, 'getInput').mockImplementation((inputName, options) => {
            if (inputName == 'method') return 'service-account';
            if (inputName == 'resource-group') return 'testrg';
            if (inputName == 'cluster-name') return 'testcluster';
            if (inputName == 'token') return 'token';
        });
        jest.spyOn(io, 'which').mockResolvedValue('az');
        jest.spyOn(arc,'executeAzCliCommand').mockImplementation();
        process.env['RUNNER_TEMP'] = 'tempDirPath'
        jest.spyOn(Date, 'now').mockImplementation(() => 1234561234567);
        jest.spyOn(child_process,'spawn').mockImplementation();
        jest.spyOn(arc,'sleep').mockImplementation();
        jest.spyOn(fs, 'chmodSync').mockImplementation(() => {});
        jest.spyOn(core, 'exportVariable').mockImplementation(() => {});
        await arc.getArcKubeconfig().catch(ex => {
            throw new Error('Error: Could not get the KUBECONFIG for arc cluster: ' + ex);
        });
        expect(core.getInput).toBeCalledTimes(4);
        expect(io.which).toHaveBeenCalledWith("az",true);
        expect(arc.executeAzCliCommand).toHaveBeenNthCalledWith(1,`account show`, false);
        expect(arc.executeAzCliCommand).toHaveBeenNthCalledWith(2,`extension remove -n connectedk8s`, false);
        expect(arc.executeAzCliCommand).toHaveBeenNthCalledWith(3,`extension add -n connectedk8s`, false);
        expect(arc.executeAzCliCommand).toHaveBeenNthCalledWith(4,`extension list`, false);
        expect(child_process.spawn).toHaveBeenCalledWith('az',['connectedk8s','proxy','-n','testcluster','-g','testrg','-f',path.join('tempDirPath', 'kubeconfig_1234561234567'),'--token','token'], {
            detached: true,
            stdio: 'ignore'
        });
        expect(arc.sleep).toBeCalled();
        expect(fs.chmodSync).toHaveBeenCalledWith(path.join('tempDirPath', 'kubeconfig_1234561234567'), '600');
        expect(core.exportVariable).toHaveBeenCalledWith('KUBECONFIG', path.join('tempDirPath', 'kubeconfig_1234561234567'));
    })
});
