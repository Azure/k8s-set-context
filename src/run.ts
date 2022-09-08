import * as core from '@actions/core'
import * as path from 'path'
import * as fs from 'fs'
import {Cluster, parseCluster} from './types/cluster'
import {
   setContext,
   getKubeconfig,
   kubeLogin,
   azSetContext,
   setKubeconfigPath
} from './utils'

/**
 * Sets the Kubernetes context based on supplied action inputs
 */

export async function run() {
   const adminInput: string = core.getInput('admin')
   const admin: boolean = adminInput.toLowerCase() === 'true'
   const useKubeLoginInput: string = core.getInput('use-kubelogin')
   const useKubeLogin: boolean =
      useKubeLoginInput.toLowerCase() === useKubeLoginInput.toLowerCase() &&
      !admin
   const useAZSetContextInput: string = core.getInput('use-az-set-context')
   const useAZSetContext: boolean =
      useAZSetContextInput.toLocaleLowerCase() === 'true'
   const runnerTempDirectory: string = process.env['RUNNER_TEMP']
   const kubeconfigPath: string = path.join(
      runnerTempDirectory,
      `kubeconfig_${Date.now()}`
   )

   if (useAZSetContext) {
      const subscription: string = core.getInput('subscription') || ''
      const clusterName: string = core.getInput('cluster-name', {
         required: true
      })
      const resourceGroupName: string = core.getInput('resource-group', {
         required: true
      })

      const exitCode: number = await azSetContext(
         admin,
         kubeconfigPath,
         resourceGroupName,
         clusterName,
         subscription
      )

      if (exitCode !== 0)
         throw Error('az cli exited with error code ' + exitCode)
      setKubeconfigPath(kubeconfigPath)
      if (useKubeLogin && !admin) {
         await kubeLogin(exitCode)
      }
   } else {
      const clusterType: Cluster | undefined = parseCluster(
         core.getInput('cluster-type', {
            required: true
         })
      )

      const kubeconfig: string = await getKubeconfig(clusterType)
      const kubeconfigWithContext: string = setContext(kubeconfig)
      // output kubeconfig
      core.debug(`Writing kubeconfig contents to ${kubeconfigPath}`)
      fs.writeFileSync(kubeconfigPath, kubeconfigWithContext)
      setKubeconfigPath(kubeconfigPath)
   }
}

// Run the application
run().catch(core.setFailed)
