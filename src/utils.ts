import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as io from '@actions/io'
import * as fs from 'fs'
import {KubeConfig} from '@kubernetes/client-node'
import {getDefaultKubeconfig} from './kubeconfigs/default'
import {getArcKubeconfig} from './kubeconfigs/arc'
import {Cluster} from './types/cluster'
import { exit } from 'process'

const AZ_TOOL_NAME = 'az'
const KUBELOGIN_TOOL_NAME = 'kubelogin'

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

export async function getAKSKubeconfig(admin: boolean, subscription: string, cmd: string[]): Promise<number> {
   if (subscription) cmd.push('--subscription', subscription)
   if (admin) cmd.push('--admin')

   const exitCode = await exec.exec(AZ_TOOL_NAME, cmd)

   return exitCode;
}

export async function azSetContext(admin: boolean, kubeconfigPath: string): Promise<number> {
      // check az tools
   const azPath = await io.which(AZ_TOOL_NAME, false)
   if (!azPath)
      throw Error(
         'Az cli tools not installed. You must install them before running this action with the aks-set-context flag.'
      )
   
   const resourceGroupName: string = core.getInput('resource-group', {required: true})
   const clusterName: string = core.getInput('cluster-name', {required: true})
   const subscription: string = core.getInput('subscription') || ''

   
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

   const exitCode: number = await getAKSKubeconfig(admin, subscription, cmd)
   return exitCode
}

export async function kubeLogin(exitCode: number): Promise<void>{
   const kubeloginCmd = ['convert-kubeconfig', '-l', 'azurecli']

      const kubeloginExitCode = await exec.exec(
         KUBELOGIN_TOOL_NAME,
         kubeloginCmd
      )
      if (kubeloginExitCode !== 0)
         throw Error('kubelogin exited with error code ' + exitCode)
}