import * as core from '@actions/core'
import * as io from '@actions/io'
import * as crypto from 'crypto'
import * as path from 'path'
import * as jsyaml from 'js-yaml'
import {runAzKubeconfigCommandBlocking} from './azCommands'
import {kubeLogin, createKubeconfig} from '../utils'
import {Method, parseMethod} from '../types/method'
import {K8sSecret, parseK8sSecret} from '../types/k8sSecret'
const RUNNER_TEMP: string = process.env['RUNNER_TEMP'] || ''
export const KUBECONFIG_LOCATION: string = path.join(
   RUNNER_TEMP,
   `aks_kubeconfig_${Date.now()}`
)

/**
 * Sets the context by pulling kubeconfig via az aks command
 * @returns Promise for the resulting kubeconfig in string form
 */
export async function getAKSKubeconfig(): Promise<string> {
   const AZ_USER_AGENT_ENV = 'AZURE_HTTP_USER_AGENT'
   const AZ_USER_AGENT_ENV_PS = 'AZUREPS_HOST_ENVIRONMENT'

   const resourceGroupName = core.getInput('resource-group', {required: true})
   const clusterName = core.getInput('cluster-name', {required: true})
   const adminInput: string = core.getInput('admin')
   const admin: boolean = adminInput.toLowerCase() === 'true'
   const subscription: string = core.getInput('subscription') || ''
   const azPath = await io.which('az', true)

   const method: Method | undefined = parseMethod(
      core.getInput('method', {required: true})
   )

   switch (method) {
      case Method.SERVICE_PRINCIPAL: {
         // check az tools
         if (!azPath)
            throw Error(
               'Az cli tools not installed. You must install them before running this action with an AKS cluster'
            )

         const originalAzUserAgent = process.env[AZ_USER_AGENT_ENV] || ''
         const originalAzUserAgentPs = process.env[AZ_USER_AGENT_ENV_PS] || ''

         const cmd = [
            'aks',
            'get-credentials',
            '-g',
            resourceGroupName,
            '-n',
            clusterName,
            '-f',
            KUBECONFIG_LOCATION
         ]

         let aksKubeconfig = ''

         try {
            core.exportVariable(
               AZ_USER_AGENT_ENV,
               getUserAgent(originalAzUserAgent)
            )
            core.exportVariable(
               AZ_USER_AGENT_ENV_PS,
               getUserAgent(originalAzUserAgentPs)
            )

            if (admin) {
               cmd.push('--admin')
            } else {
               core.warning(
                  'Service Principal method needs admin permissions to run via az aks command. Defaulting to kubelogin method'
               )
            }

            if (subscription.length > 0)
               cmd.push('--subscription', subscription)

            aksKubeconfig = await runAzKubeconfigCommandBlocking(
               azPath,
               cmd,
               KUBECONFIG_LOCATION
            )

            if (!admin) {
               kubeLogin()
            }
         } catch (e) {
            throw e
         } finally {
            core.exportVariable(AZ_USER_AGENT_ENV_PS, originalAzUserAgentPs)
            core.exportVariable(AZ_USER_AGENT_ENV, originalAzUserAgent)
         }

         return aksKubeconfig
      }
      case Method.SERVICE_ACCOUNT: {
         const clusterUrl = core.getInput('k8s-url', {required: true})
         core.debug(
            'Found clusterUrl. Creating kubeconfig using certificate and token'
         )

         const k8sSecret: string = core.getInput('k8s-secret', {
            required: true
         })
         const parsedK8sSecret: K8sSecret = parseK8sSecret(
            jsyaml.load(k8sSecret)
         )
         const certAuth: string = parsedK8sSecret.data['ca.crt']
         const token: string = Buffer.from(
            parsedK8sSecret.data.token,
            'base64'
         ).toString()

         return createKubeconfig(certAuth, token, clusterUrl)
      }
      case undefined:
         core.warning('Defaulting to kubeconfig method')
      case Method.KUBECONFIG:
      default:
         throw Error('Kubeconfig method not supported for AKS cluster')
   }
}

/**
 * Creates a new UserAgent and returns it. If given a previous UserAgent it appends the new one and returns it.
 * @param prevUserAgent
 * @returns updated user agent or a new user agent if none are provided
 */
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
