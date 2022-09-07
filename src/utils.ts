import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as io from '@actions/io'
import * as crypto from 'crypto'
import * as fs from 'fs'
import {KubeConfig} from '@kubernetes/client-node'
import {getDefaultKubeconfig} from './kubeconfigs/default'
import {getArcKubeconfig} from './kubeconfigs/arc'
import {Cluster} from './types/cluster'

/**
 * Gets the kubeconfig based on Kubernetes cluster type
 * @param type The cluster type for the kubeconfig (defaults to generic)
 * @returns A promise of the kubeconfig
 */
export async function getKubeconfig(
   type: Cluster | undefined
): Promise<string> {
   switch (type) {
      case Cluster.ARC: {
         return await getArcKubeconfig()
      }
      case undefined: {
         core.warning('Cluster type not recognized. Defaulting to generic.')
      }
      default: {
         return getDefaultKubeconfig()
      }
   }
}

/**
 * Sets the context by updating the kubeconfig
 * @param kubeconfig The kubeconfig
 * @returns Updated kubeconfig with the context
 */
export function setContext(kubeconfig: string): string {
   const context: string = core.getInput('context')
   if (!context) {
      core.debug("Can't set context because context is unspecified.")
      return kubeconfig
   }

   // load current kubeconfig
   const kc = new KubeConfig()
   kc.loadFromString(kubeconfig)

   // update kubeconfig
   kc.setCurrentContext(context)
   return kc.exportConfig()
}

/**
 * Sets the context by pulling kubeconfig via az command
 * @param admin Boolean for determining whether or not user is admin
 * @param kubeconfigPath Path to place kubeconfig
 * @returns Promise for the resulting exitCode number from running az command
 */
export async function azSetContext(
   admin: boolean,
   kubeconfigPath: string,
   resourceGroupName: string,
   clusterName: string,
   subscription: string
): Promise<number> {
   const AZ_TOOL_NAME = 'az'
   const AZ_USER_AGENT_ENV = 'AZURE_HTTP_USER_AGENT'
   const AZ_USER_AGENT_ENV_PS = 'AZUREPS_HOST_ENVIRONMENT'
   const originalAzUserAgent = process.env[AZ_USER_AGENT_ENV] || ''
   const originalAzUserAgentPs = process.env[AZ_USER_AGENT_ENV_PS] || ''

   try {
      // set az user agent
      core.exportVariable(AZ_USER_AGENT_ENV, getUserAgent(originalAzUserAgent))
      core.exportVariable(
         AZ_USER_AGENT_ENV_PS,
         getUserAgent(originalAzUserAgentPs)
      )

      const cmd = [
         'aks',
         'get-credentials',
         '--resource-group',
         resourceGroupName,
         '--name',
         clusterName,
         '-f',
         kubeconfigPath
      ]

      // check az tools
      const azPath = await io.which(AZ_TOOL_NAME, false)
      if (!azPath)
         throw Error(
            'Az cli tools not installed. You must install them before running this action with the aks-set-context flag'
         )

      if (subscription.length > 0) cmd.push('--subscription', subscription)
      if (admin) cmd.push('--admin')

      return await exec.exec(AZ_TOOL_NAME, cmd)
   } catch (e) {
      throw e
   } finally {
      core.exportVariable(AZ_USER_AGENT_ENV, originalAzUserAgent)
      core.exportVariable(AZ_USER_AGENT_ENV_PS, originalAzUserAgentPs)
   }
}

/**
 * Uses kubelogin to convert kubeconfig to exec credential plugin format
 * @param exitCode ExitCode from az command execution to obtain kubeconfig
 */
export async function kubeLogin(exitCode: number): Promise<void> {
   const KUBELOGIN_TOOL_NAME = 'kubelogin'
   const KUBELOGIN_CMD = ['convert-kubeconfig', '-l', 'azurecli']

   const kubeloginExitCode = await exec.exec(KUBELOGIN_TOOL_NAME, KUBELOGIN_CMD)
   if (kubeloginExitCode !== 0)
      throw Error('kubelogin exited with error code ' + exitCode)
}

export async function setKubeconfigPath(kubeconfigPath: string) {
   fs.chmodSync(kubeconfigPath, '600')
   core.debug('Setting KUBECONFIG environment variable')
   core.exportVariable('KUBECONFIG', kubeconfigPath)
}

function getUserAgent(prevUserAgent: string): string {
   const ACTION_NAME = 'Azure/k8s-set-context'
   const actionName = process.env.GITHUB_ACTION_REPOSITORY || ACTION_NAME
   const runRepo = process.env.GITHUB_REPOSITORY || ''
   const runRepoHash = crypto.createHash('sha256').update(runRepo).digest('hex')
   const runId = process.env.GITHUB_RUN_ID
   const newUserAgent = `GitHubActions/${actionName}(${runRepoHash}; ${runId})`

   if (prevUserAgent) return `${prevUserAgent}+${newUserAgent}`
   return newUserAgent
}
